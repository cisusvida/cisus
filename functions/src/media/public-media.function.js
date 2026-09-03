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
const SERVER_CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_COST = 120;
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const signedUrlCache = new Map();
const rateLimits = new Map();

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
    const file = firebase_admin_1.storage.bucket().file(path);
    let metadata;
    try {
        [metadata] = await file.getMetadata();
    } catch (error) {
        if (Number(error?.code) === 404) return null;
        throw error;
    }
    const expiresAt = now + SIGNED_URL_TTL_MS;
    const [url] = await file.getSignedUrl({ version: 'v4', action: 'read', expires: expiresAt });
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

async function resolveMediaReference(reference, homeContent) {
    let path = '';
    if (reference.kind === 'home') {
        path = String(homeContent?.[public_media_policy_1.HOME_ASSETS[reference.targetId]] ?? '');
    } else {
        const snapshot = await firebase_admin_1.firestore.collection('products').doc(reference.targetId).get();
        const product = snapshot.exists ? snapshot.data() : null;
        if (product?.status !== 'active' || product?.isPublic !== true) return null;
        path = String(product.imagePath ?? '');
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
        const homeSnapshot = needsHome
            ? await firebase_admin_1.firestore.collection('public_site_content').doc('home').get()
            : null;
        const homeContent = homeSnapshot?.exists ? homeSnapshot.data() : null;
        const media = await Promise.all(
            references.map((reference) => resolveMediaReference(reference, homeContent)),
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
    return { reference, bytes };
}

/** Escritura backend-only con contexto tenant fresco y permiso explícito de catálogo. */
exports.uploadPublicMedia = (0, define_scoped_callable_1.defineScopedCallable)(
    { permission: 'catalog.manage', timeoutSeconds: 60 },
    async (data, context) => {
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
        const { reference, bytes } = validated;
        let targetRef;
        if (reference.kind === 'home') {
            targetRef = firebase_admin_1.firestore.collection('public_site_content').doc('home');
        } else {
            targetRef = firebase_admin_1.firestore.collection('products').doc(reference.targetId);
            const product = await targetRef.get();
            if (!product.exists) throw new https_1.HttpsError('not-found', 'El producto no existe.');
        }
        let webp;
        try {
            const width = reference.kind === 'home' ? 1920 : 1200;
            webp = await sharp(bytes, { limitInputPixels: 40_000_000 })
                .rotate()
                .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer();
        } catch {
            throw new https_1.HttpsError('invalid-argument', 'No se pudo procesar la imagen.');
        }
        const folder = reference.kind === 'home'
            ? `public-media/home/${reference.targetId}`
            : `public-media/products/${reference.targetId}`;
        const path = `${folder}/image-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8)}.webp`;
        const file = firebase_admin_1.storage.bucket().file(path);
        await file.save(webp, {
            contentType: 'image/webp',
            resumable: false,
            metadata: {
                cacheControl: 'public, max-age=604800, immutable',
                metadata: { mediaKind: reference.kind, targetId: reference.targetId },
            },
        });
        try {
            const field = reference.kind === 'home'
                ? public_media_policy_1.HOME_ASSETS[reference.targetId]
                : 'imagePath';
            const batch = firebase_admin_1.firestore.batch();
            batch.set(targetRef, {
                [field]: path,
                ...(reference.kind === 'product' ? { imageUrl: firebase_admin_1.FieldValue.delete() } : {}),
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
