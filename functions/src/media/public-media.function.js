"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPublicMedia = exports.getPublicMediaUrls = void 0;
const crypto_1 = require("node:crypto");
const https_1 = require("firebase-functions/v2/https");
const sharp = require("sharp");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
const public_media_policy_1 = require("./public-media-policy");

const SIGNED_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DOWNLOAD_URL_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const SERVER_CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_COST = 120;
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const signedUrlCache = new Map();
const rateLimits = new Map();
const HOME_ANIMATION_LAYER_KEYS = ['hero', 'hero_carving', 'hero_layer_3', 'hero_layer_4', 'hero_layer_5', 'hero_layer_6'];
const PRODUCT_ANIMATION_LAYER_KEYS = ['product_scene', 'product_scene_2', 'product_scene_3', 'product_scene_4', 'product_scene_5', 'product_scene_6'];

function animationLayerIsPublished(content, isHome, targetId, key) {
    const kind = isHome ? 'home' : key;
    const target = isHome ? key : targetId;
    const path = content[public_media_policy_1.mediaField(kind, target)];
    return public_media_policy_1.allowedMediaPath(kind, target, path);
}

function animationLayerKeysFromLegacy(content, isHome, targetId, legacyTarget) {
    const keys = isHome ? HOME_ANIMATION_LAYER_KEYS : PRODUCT_ANIMATION_LAYER_KEYS;
    const base = keys[0];
    const overlays = keys.slice(1).filter(key => animationLayerIsPublished(content, isHome, targetId, key));
    const hasBase = animationLayerIsPublished(content, isHome, targetId, base);
    if (legacyTarget === 'first') return hasBase ? [base] : [];
    if (legacyTarget === 'both') return hasBase && overlays.length ? [base, overlays[overlays.length - 1]] : [];
    return overlays.length ? [overlays[overlays.length - 1]] : [];
}

function legacyAnimationTargetFromKeys(keys, isHome) {
    const base = isHome ? 'hero' : 'product_scene';
    if (keys.includes(base) && keys.length === 1) return 'first';
    if (keys.includes(base) && keys.length === 2) return 'both';
    return 'last';
}

function legacyAnimationConfiguration(content, isHome, targetId) {
    const animationField = isHome ? 'heroAnimation' : 'sceneAnimation';
    const targetField = isHome ? 'heroAnimationTarget' : 'sceneAnimationTarget';
    const keysField = isHome ? 'heroAnimationLayerKeys' : 'sceneAnimationLayerKeys';
    const legacyTarget = ['first', 'both'].includes(content[targetField]) ? content[targetField] : 'last';
    const keys = animationLayerKeysFromLegacy(content, isHome, targetId, legacyTarget);
    const hasOverlay = keys.some(key => key !== (isHome ? 'hero' : 'product_scene'));
    const animation = ['appear', 'disappear'].includes(content[animationField])
        && (legacyTarget === 'first' || hasOverlay)
        ? content[animationField]
        : 'none';
    return { animation, animationLayerKeys: keys, animationTarget: legacyTarget };
}

function isCompositionLayerReference(reference) {
    return reference.kind === 'home'
        ? HOME_ANIMATION_LAYER_KEYS.includes(reference.targetId)
        : reference.kind === 'product_scene' || /^product_scene_[2-6]$/.test(reference.kind);
}

function requestKey(request) {
    const ip = request.rawRequest.ip || 'anonymous';
    return (0, crypto_1.createHash)('sha256').update(ip).digest('hex').slice(0, 24);
}

function enforceRateLimit(key, cost) {
    const now = Date.now();
    const current = rateLimits.get(key);
    if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
        rateLimits.set(key, { cost, windowStart: now });
        return;
    }
    if (current.cost + cost > RATE_LIMIT_MAX_COST) {
        throw new https_1.HttpsError('resource-exhausted', 'Demasiadas solicitudes de imágenes.');
    }
    current.cost += cost;
}

async function signedMedia(key, path) {
    const now = Date.now();
    const cached = signedUrlCache.get(path);
    if (cached && now - cached.createdAt < SERVER_CACHE_TTL_MS && cached.expiresAt > now) {
        return { ...cached, key };
    }
    const bucket = firebase_admin_1.storage.bucket();
    const file = bucket.file(path);
    let metadata;
    try {
        [metadata] = await file.getMetadata();
    } catch (error) {
        if (Number(error?.code) === 404) return null;
        throw error;
    }
    const downloadToken = String(metadata.metadata?.firebaseStorageDownloadTokens ?? '')
        .split(',')[0]
        .trim();
    const expiresAt = now + (downloadToken ? DOWNLOAD_URL_TTL_MS : SIGNED_URL_TTL_MS);
    const url = downloadToken
        ? `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(downloadToken)}`
        : (await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt }))[0];
    const entry = {
        path,
        url,
        expiresAt,
        generation: String(metadata.generation ?? ''),
        createdAt: now,
    };
    signedUrlCache.set(path, entry);
    return { ...entry, key };
}

async function resolveMediaReference(reference, homeContent, processContent) {
    let path = '';
    if (reference.kind === 'home') {
        path = String(homeContent?.[public_media_policy_1.HOME_ASSETS[reference.targetId]] ?? '');
    } else if (reference.kind === 'process') {
        path = String(processContent?.[public_media_policy_1.PROCESS_ASSETS[reference.targetId]] ?? '');
    } else {
        const snapshot = await firebase_admin_1.firestore.collection('products').doc(reference.targetId).get();
        const product = snapshot.exists ? snapshot.data() : null;
        if (product?.status !== 'active' || product?.isPublic !== true) return null;
        path = String(product[public_media_policy_1.mediaField(reference.kind, reference.targetId)] ?? '');
    }
    if (!(0, public_media_policy_1.allowedMediaPath)(reference.kind, reference.targetId, path)) return null;
    return signedMedia(`${reference.kind}:${reference.targetId}`, path);
}

/** Público sin Firebase Auth: App Check valida la app y la lista blanca impide firmar rutas libres. */
exports.getPublicMediaUrls = (0, https_1.onCall)({
    region: 'southamerica-west1',
    memory: '256MiB',
    timeoutSeconds: 20,
    concurrency: 40,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
}, async (request) => {
    let references;
    try {
        references = (0, public_media_policy_1.parseMediaRequests)(request.data?.items);
    } catch {
        throw new https_1.HttpsError('invalid-argument', 'Las imágenes solicitadas no son válidas.');
    }
    enforceRateLimit(requestKey(request), references.length);
    try {
        const needsHome = references.some((reference) => reference.kind === 'home');
        const needsProcess = references.some((reference) => reference.kind === 'process');
        const [homeSnapshot, processSnapshot] = await Promise.all([
            needsHome
                ? firebase_admin_1.firestore.collection('public_site_content').doc('home').get()
                : null,
            needsProcess
                ? firebase_admin_1.firestore.collection('public_site_content').doc('process').get()
                : null,
        ]);
        const homeContent = homeSnapshot?.exists ? homeSnapshot.data() : null;
        const processContent = processSnapshot?.exists ? processSnapshot.data() : null;
        const media = await Promise.all(
            references.map((reference) => resolveMediaReference(reference, homeContent, processContent)),
        );
        return { media: media.filter(Boolean).map(({ createdAt: _createdAt, ...entry }) => entry) };
    } catch (error) {
        console.error(JSON.stringify({
            event: 'public_media_resolution_failed',
            errorType: error instanceof Error ? error.name : typeof error,
        }));
        throw new https_1.HttpsError('internal', 'No se pudieron cargar las imágenes públicas.');
    }
});

function validateUpload(data) {
    const [reference] = (0, public_media_policy_1.parseMediaRequests)([
        { kind: data?.kind, targetId: data?.targetId },
    ]);
    const mimeType = String(data?.mimeType ?? '');
    if (!MIME_TYPES.has(mimeType)) {
        throw new https_1.HttpsError('invalid-argument', 'Usa una imagen JPG, PNG o WebP.');
    }
    const base64 = String(data?.fileBase64 ?? '').replace(/^data:[^;]+;base64,/, '');
    if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
        throw new https_1.HttpsError('invalid-argument', 'La imagen no está codificada correctamente.');
    }
    const bytes = Buffer.from(base64, 'base64');
    if (!bytes.length || bytes.length > MAX_BYTES) {
        throw new https_1.HttpsError('invalid-argument', 'La imagen debe pesar menos de 8 MB.');
    }
    const quality = data?.quality === undefined ? 82 : data.quality;
    if (![82, 76, 68].includes(quality)) {
        throw new https_1.HttpsError('invalid-argument', 'Selecciona una calidad WebP de 82, 76 o 68.');
    }
    return { reference, bytes, quality };
}

function requireMediaEditor(context) {
    if (context.scopeLevel !== 'company' || !public_media_policy_1.PLATFORM_MEDIA_ROLES.has(context.jobRoleId))
        throw new https_1.HttpsError('permission-denied', 'Solo el equipo Cisus administra medios.');
}

// Authenticated download of the active managed object, without browser Storage CORS dependency.
exports.downloadPublicMedia = (0, define_scoped_callable_1.defineScopedCallable)(
    { permission: 'public_media.manage', timeoutSeconds: 60 }, async (data, context) => {
        requireMediaEditor(context);
        let reference;
        try { [reference] = public_media_policy_1.parseMediaRequests([data]); }
        catch { throw new https_1.HttpsError('invalid-argument', 'Destino no válido.'); }
        const isHome = reference.kind === 'home';
        const isProcess = reference.kind === 'process';
        const snapshot = await firebase_admin_1.firestore.collection(isHome || isProcess ? 'public_site_content' : 'products')
            .doc(isHome ? 'home' : isProcess ? 'process' : reference.targetId).get();
        const path = snapshot.data()?.[public_media_policy_1.mediaField(reference.kind, reference.targetId)];
        if (!public_media_policy_1.allowedMediaPath(reference.kind, reference.targetId, path))
            throw new https_1.HttpsError('not-found', 'No hay imagen publicada.');
        const file = firebase_admin_1.storage.bucket().file(path);
        const [metadata] = await file.getMetadata();
        if (Number(metadata.size) > MAX_BYTES) throw new https_1.HttpsError('resource-exhausted', 'Archivo demasiado grande.');
        const [bytes] = await file.download();
        if (!bytes.length || bytes.length > MAX_BYTES) throw new https_1.HttpsError('resource-exhausted', 'Archivo no descargable.');
        return { base64: bytes.toString('base64'), filename: `cisus-${reference.targetId}-${reference.kind}.webp`, mimeType: 'image/webp' };
    });

exports.configurePublicMedia = (0, define_scoped_callable_1.defineScopedCallable)(
    { permission: 'public_media.manage', timeoutSeconds: 20 }, async (data, context) => {
        requireMediaEditor(context);
        let reference;
        try { [reference] = public_media_policy_1.parseMediaRequests([data]); }
        catch { throw new https_1.HttpsError('invalid-argument', 'Destino no válido.'); }
        if (reference.kind === 'product_customization') {
            const value = data.customization;
            if (!value || typeof value.enabled !== 'boolean' || typeof value.label !== 'string'
                || value.label.trim().length > 40 || /[\u0000-\u001f\u007f]/.test(value.label)
                || (value.enabled && !value.label.trim()))
                throw new https_1.HttpsError('invalid-argument', 'Indica un nombre de hasta 40 caracteres para la personalización.');
            const customization = { enabled: value.enabled, label: value.label.trim() };
            const ref = firebase_admin_1.firestore.collection('products').doc(reference.targetId);
            const snapshot = await ref.get();
            if (!snapshot.exists) throw new https_1.HttpsError('not-found', 'El producto no existe.');
            const content = snapshot.data();
            if (customization.enabled && (!public_media_policy_1.allowedMediaPath(reference.kind, reference.targetId, content.customizationImagePath)
                || !public_media_policy_1.allowedMediaPath('product_scene', reference.targetId, content.sceneImagePath)))
                throw new https_1.HttpsError('failed-precondition', 'Publica la imagen base y la superposición antes de habilitar el botón.');
            const batch = firebase_admin_1.firestore.batch();
            batch.set(ref, { customization, updatedAt: firebase_admin_1.FieldValue.serverTimestamp(), updatedBy: context.uid }, { merge: true });
            batch.set(firebase_admin_1.firestore.collection('audit_logs').doc(), {
                event: 'public_media_configured', actorUid: context.uid, companyId: context.cid,
                targetId: reference.targetId, mediaKind: reference.kind, customization,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
            await batch.commit();
            return { customization };
        }
        if (reference.kind === 'product' && Object.hasOwn(data, 'relatedImageSource')) {
            const source = data.relatedImageSource;
            const sources = {
                auto: null,
                product_scene: { kind: 'product_scene', field: 'sceneImagePath' },
                product: { kind: 'product', field: 'imagePath' },
                product_thumbnail: { kind: 'product_thumbnail', field: 'thumbnailImagePath' },
                product_customization: { kind: 'product_customization', field: 'customizationImagePath' },
                product_related: { kind: 'product_related', field: 'relatedImagePath' },
                ...Object.fromEntries([2, 3, 4, 5, 6].map(index => [
                    `product_scene_${index}`,
                    { kind: `product_scene_${index}`, field: `sceneLayer${index}Path` },
                ])),
            };
            const aliases = { scene: 'product_scene', catalog: 'product', thumbnail: 'product_thumbnail' };
            const normalizedSource = aliases[source] ?? source;
            if (!Object.hasOwn(sources, normalizedSource))
                throw new https_1.HttpsError('invalid-argument', 'Fuente de imagen no válida.');
            const ref = firebase_admin_1.firestore.collection('products').doc(reference.targetId);
            const snapshot = await ref.get();
            if (!snapshot.exists)
                throw new https_1.HttpsError('not-found', 'El producto no existe.');
            const content = snapshot.data();
            const sourceMedia = sources[normalizedSource];
            if (sourceMedia && !public_media_policy_1.allowedMediaPath(
                sourceMedia.kind, reference.targetId, content[sourceMedia.field]))
                throw new https_1.HttpsError('failed-precondition', 'Publica primero esa imagen para este producto.');
            const batch = firebase_admin_1.firestore.batch();
            batch.set(ref, {
                relatedImageSource: normalizedSource,
                updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
                updatedBy: context.uid,
            }, { merge: true });
            batch.set(firebase_admin_1.firestore.collection('audit_logs').doc(), {
                event: 'public_media_configured', actorUid: context.uid, companyId: context.cid,
                targetId: reference.targetId, mediaKind: reference.kind, relatedImageSource: normalizedSource,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
            await batch.commit();
            return { relatedImageSource: normalizedSource };
        }
        if (!(reference.kind === 'home' && reference.targetId === 'hero') && reference.kind !== 'product_scene')
            throw new https_1.HttpsError('invalid-argument', 'Solo se anima una composición.');
        if (!['none', 'appear', 'disappear'].includes(data.animation))
            throw new https_1.HttpsError('invalid-argument', 'Animación no válida.');
        const isHome = reference.kind === 'home';
        const ref = firebase_admin_1.firestore.collection(isHome ? 'public_site_content' : 'products')
            .doc(isHome ? 'home' : reference.targetId);
        const snapshot = await ref.get();
        if (!snapshot.exists) throw new https_1.HttpsError('not-found', 'No existe la composición.');
        const content = snapshot.data();
        if (data.animationLayerKeys !== undefined && !Array.isArray(data.animationLayerKeys))
            throw new https_1.HttpsError('invalid-argument', 'Elige las capas que recibirán la animación.');
        if (data.animationTarget !== undefined && !['first', 'last', 'both'].includes(data.animationTarget))
            throw new https_1.HttpsError('invalid-argument', 'Elige una capa válida.');
        const targetField = isHome ? 'heroAnimationTarget' : 'sceneAnimationTarget';
        const keysField = isHome ? 'heroAnimationLayerKeys' : 'sceneAnimationLayerKeys';
        const allowedKeys = isHome ? HOME_ANIMATION_LAYER_KEYS : PRODUCT_ANIMATION_LAYER_KEYS;
        const legacyTarget = ['first', 'both'].includes(data.animationTarget)
            ? data.animationTarget
            : ['first', 'both'].includes(content[targetField]) ? content[targetField] : 'last';
        let animationLayerKeys;
        if (Array.isArray(data.animationLayerKeys)) {
            animationLayerKeys = data.animationLayerKeys;
        } else if (Array.isArray(content[keysField])) {
            // Older clients send only `animation`; preserve the stable choice already saved by a newer editor.
            animationLayerKeys = content[keysField];
        } else {
            animationLayerKeys = animationLayerKeysFromLegacy(content, isHome, reference.targetId, legacyTarget);
        }
        if (animationLayerKeys.length > 2
            || animationLayerKeys.some(key => typeof key !== 'string' || !allowedKeys.includes(key))
            || new Set(animationLayerKeys).size !== animationLayerKeys.length)
            throw new https_1.HttpsError('invalid-argument', 'La selección de capas no es válida.');
        const baseKey = isHome ? 'hero' : 'product_scene';
        if (animationLayerKeys.length === 2
            && (!animationLayerKeys.includes(baseKey)
                || animationLayerKeys.filter(key => key !== baseKey).length !== 1))
            throw new https_1.HttpsError('invalid-argument', 'Solo puedes animar una capa y, opcionalmente, la imagen base.');
        if (data.animation !== 'none' && animationLayerKeys.length === 0)
            throw new https_1.HttpsError('failed-precondition', 'Elige una capa publicada antes de activar la animación.');
        if (data.animation !== 'none'
            && animationLayerKeys.some(key => !animationLayerIsPublished(content, isHome, reference.targetId, key)))
            throw new https_1.HttpsError('failed-precondition', 'Publica las capas elegidas antes de activar la animación.');
        const animationTarget = legacyAnimationTargetFromKeys(animationLayerKeys, isHome);
        const batch = firebase_admin_1.firestore.batch();
        batch.set(ref, { [isHome ? 'heroAnimation' : 'sceneAnimation']: data.animation, [targetField]: animationTarget,
            [keysField]: animationLayerKeys,
            updatedAt: firebase_admin_1.FieldValue.serverTimestamp(), updatedBy: context.uid }, { merge: true });
        batch.set(firebase_admin_1.firestore.collection('audit_logs').doc(), {
            event: 'public_media_configured', actorUid: context.uid, companyId: context.cid,
            targetId: reference.targetId, mediaKind: reference.kind, animation: data.animation, animationTarget, animationLayerKeys,
            createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        return { animation: data.animation, animationTarget, animationLayerKeys };
    });

/** Escritura backend-only con contexto tenant fresco y permiso explícito de medios públicos. */
exports.uploadPublicMedia = (0, define_scoped_callable_1.defineScopedCallable)(
    { permission: 'public_media.manage', timeoutSeconds: 60 },
    async (data, context) => {
        if (context.scopeLevel !== 'company') {
            throw new https_1.HttpsError('permission-denied', 'La publicación requiere contexto de empresa.', {
                code: 'COMPANY_SCOPE_REQUIRED',
            });
        }
        if (!public_media_policy_1.PLATFORM_MEDIA_ROLES.has(context.jobRoleId)) {
            throw new https_1.HttpsError('permission-denied', 'Solo el equipo Cisus administra imágenes públicas.', {
                code: 'CISUS_MEDIA_ROLE_REQUIRED',
            });
        }
        let validated;
        try {
            validated = validateUpload(data);
        } catch (error) {
            if (error instanceof https_1.HttpsError) throw error;
            throw new https_1.HttpsError('invalid-argument', 'El destino de la imagen no es válido.');
        }
        const { reference, bytes, quality } = validated;
        let targetRef;
        if (reference.kind === 'home') {
            targetRef = firebase_admin_1.firestore.collection('public_site_content').doc('home');
        } else if (reference.kind === 'process') {
            targetRef = firebase_admin_1.firestore.collection('public_site_content').doc('process');
        } else {
            targetRef = firebase_admin_1.firestore.collection('products').doc(reference.targetId);
            const product = await targetRef.get();
            if (!product.exists) throw new https_1.HttpsError('not-found', 'El producto no existe.');
        }
        let webp;
        try {
            const width = reference.kind === 'home' || reference.kind.startsWith('product_scene') || reference.kind === 'product_customization' ? 1920 : 1200;
            webp = await sharp(bytes, { limitInputPixels: 40_000_000 })
                .rotate()
                .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
                .webp({ quality, alphaQuality: 100 })
                .toBuffer();
        } catch {
            throw new https_1.HttpsError('invalid-argument', 'No se pudo procesar la imagen.');
        }
        const dimensions = await sharp(webp).metadata();
        const overlay = reference.kind === 'home' && (reference.targetId === 'hero_carving' || reference.targetId.startsWith('hero_layer_'))
            || /^product_scene_[2-6]$/.test(reference.kind) || reference.kind === 'product_customization';
        if (overlay) {
            const current = (await targetRef.get()).data() ?? {};
            const baseKind = reference.kind === 'home' ? 'home' : 'product_scene';
            const baseTarget = reference.kind === 'home' ? 'hero' : reference.targetId;
            const baseField = reference.kind === 'home' ? 'heroImagePath' : 'sceneImagePath';
            const basePath = current[baseField];
            if (!public_media_policy_1.allowedMediaPath(baseKind, baseTarget, basePath))
                throw new https_1.HttpsError('failed-precondition', 'Publica primero la imagen base.');
            const [baseBytes] = await firebase_admin_1.storage.bucket().file(basePath).download();
            const base = await sharp(baseBytes).metadata();
            if (Math.abs(dimensions.width / dimensions.height - base.width / base.height) > 0.002)
                throw new https_1.HttpsError('invalid-argument', 'La capa debe tener la misma proporción y lienzo que la base.');
        }
        if (reference.kind === 'product_scene' || reference.kind === 'home' && reference.targetId === 'hero') {
            const current = (await targetRef.get()).data() ?? {};
            const overlays = reference.kind === 'home'
                ? ['hero_carving', 'hero_layer_3', 'hero_layer_4', 'hero_layer_5', 'hero_layer_6'].map(targetId => ({ kind: 'home', targetId }))
                : [...[2,3,4,5,6].map(index => ({ kind: `product_scene_${index}`, targetId: reference.targetId })),
                    { kind: 'product_customization', targetId: reference.targetId }];
            for (const layer of overlays) {
                const path = current[public_media_policy_1.mediaField(layer.kind, layer.targetId)];
                if (!public_media_policy_1.allowedMediaPath(layer.kind, layer.targetId, path)) continue;
                const [bytes] = await firebase_admin_1.storage.bucket().file(path).download();
                const existing = await sharp(bytes).metadata();
                if (Math.abs(dimensions.width / dimensions.height - existing.width / existing.height) > 0.002)
                    throw new https_1.HttpsError('invalid-argument', 'La base debe conservar la proporción de las capas publicadas.');
            }
        }
        const folder = reference.kind === 'home'
            ? `public-media/home/${reference.targetId}`
            : reference.kind === 'process'
                ? `public-media/process/${reference.targetId}`
                : reference.kind === 'product_scene'
                    ? `public-media/product-scenes/${reference.targetId}`
                    : reference.kind === 'product_thumbnail'
                        ? `public-media/product-thumbnails/${reference.targetId}`
                        : reference.kind === 'product_customization'
                            ? `public-media/product-customizations/${reference.targetId}`
                            : reference.kind === 'product_related'
                                ? `public-media/product-related/${reference.targetId}`
                        : /^product_scene_[2-6]$/.test(reference.kind)
                            ? `public-media/product-layers/${reference.targetId}/${reference.kind.slice(-1)}`
                            : `public-media/products/${reference.targetId}`;
        const path = `${folder}/image-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.webp`;
        const file = firebase_admin_1.storage.bucket().file(path);
        const downloadToken = (0, crypto_1.randomUUID)();
        await file.save(webp, {
            contentType: 'image/webp',
            resumable: false,
            metadata: {
                cacheControl: 'public, max-age=604800, immutable',
                metadata: {
                    mediaKind: reference.kind,
                    targetId: reference.targetId,
                    webpQuality: String(quality),
                    firebaseStorageDownloadTokens: downloadToken,
                },
            },
        });
        try {
            const field = public_media_policy_1.mediaField(reference.kind, reference.targetId);
            const batch = firebase_admin_1.firestore.batch();
            let animationMigration = {};
            if (isCompositionLayerReference(reference)) {
                const currentSnapshot = await targetRef.get();
                const current = currentSnapshot.exists ? currentSnapshot.data() ?? {} : {};
                const isHome = reference.kind === 'home';
                const keysField = isHome ? 'heroAnimationLayerKeys' : 'sceneAnimationLayerKeys';
                if (!Object.hasOwn(current, keysField)) {
                    const migrated = legacyAnimationConfiguration(current, isHome, reference.targetId);
                    animationMigration = {
                        [isHome ? 'heroAnimation' : 'sceneAnimation']: migrated.animation,
                        [isHome ? 'heroAnimationTarget' : 'sceneAnimationTarget']: migrated.animationTarget,
                        [keysField]: migrated.animationLayerKeys,
                    };
                }
            }
            batch.set(targetRef, {
                [field]: path,
                [`${field}Dimensions`]: { width: dimensions.width, height: dimensions.height },
                ...animationMigration,
                ...(reference.kind === 'product_related' ? { relatedImageSource: 'product_related' } : {}),
                ...(reference.kind === 'product' ? { imageUrl: firebase_admin_1.FieldValue.delete() } : {}),
                ...(reference.kind === 'product_scene' ? { sceneImageUrl: firebase_admin_1.FieldValue.delete() } : {}),
                updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
                updatedBy: context.uid,
            }, { merge: true });
            batch.set(firebase_admin_1.firestore.collection('audit_logs').doc(), {
                event: 'public_media_uploaded',
                actorUid: context.uid,
                companyId: context.cid,
                entityId: context.entityId,
                mediaKind: reference.kind,
                targetId: reference.targetId,
                path,
                quality,
                sizeBytes: webp.length,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
            await batch.commit();
        } catch (error) {
            await file.delete({ ignoreNotFound: true }).catch(() => undefined);
            throw error;
        }
        const entry = await signedMedia(`${reference.kind}:${reference.targetId}`, path);
        if (!entry) throw new https_1.HttpsError('internal', 'La imagen guardada no está disponible.');
        const { createdAt: _createdAt, ...media } = entry;
        return { media };
    },
);
