"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageCompanyProductOffer = exports.listCompanyCatalog = exports.listPublicProducts = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
function mapProduct(id, data) {
    var _a, _b, _c, _d, _e;
    return {
        id,
        sku: String((_a = data.sku) !== null && _a !== void 0 ? _a : ''),
        name: String((_b = data.name) !== null && _b !== void 0 ? _b : 'Producto Cisus'),
        description: String((_c = data.description) !== null && _c !== void 0 ? _c : ''),
        imagePath: typeof data.imagePath === 'string' ? data.imagePath : null,
        imageUrl: null,
        basePrice: Number((_d = data.basePrice) !== null && _d !== void 0 ? _d : 0),
        currency: String((_e = data.currency) !== null && _e !== void 0 ? _e : 'CLP'),
    };
}
exports.listPublicProducts = (0, https_1.onCall)({
    region: 'southamerica-west1',
    memory: '256MiB',
    timeoutSeconds: 20,
    concurrency: 40,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
}, async (_request) => {
    const snapshot = await firebase_admin_1.firestore
        .collection('products')
        .where('status', '==', 'active')
        .where('isPublic', '==', true)
        .limit(100)
        .get();
    return { products: snapshot.docs.map((document) => mapProduct(document.id, document.data())) };
});
exports.listCompanyCatalog = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'catalog.read' }, async (_data, context) => {
    const [productsSnapshot, offersSnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('products').where('status', '==', 'active').limit(200).get(),
        firebase_admin_1.firestore.collection('company_product_offers').where('companyId', '==', context.cid).get(),
    ]);
    const offers = new Map(offersSnapshot.docs.map((document) => [document.data().productId, document.data()]));
    return {
        products: productsSnapshot.docs.flatMap((document) => {
            var _a, _b;
            const offer = offers.get(document.id);
            if (!offer || offer.enabled !== true)
                return [];
            return [
                Object.assign(Object.assign({}, mapProduct(document.id, document.data())), { enabled: true, commercialModel: String((_a = offer.commercialModel) !== null && _a !== void 0 ? _a : 'wholesale'), fixedPrice: typeof offer.fixedPrice === 'number' ? offer.fixedPrice : null, minPrice: typeof offer.minPrice === 'number' ? offer.minPrice : null, maxPrice: typeof offer.maxPrice === 'number' ? offer.maxPrice : null, commissionRate: Number((_b = offer.commissionRate) !== null && _b !== void 0 ? _b : 0) }),
            ];
        }),
    };
});
exports.manageCompanyProductOffer = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'pricing.manage', entitlement: 'advanced_pricing' }, async (data, context) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const productId = (_a = data.productId) === null || _a === void 0 ? void 0 : _a.trim();
    if (!productId || !/^[A-Za-z0-9_-]{3,180}$/.test(productId)) {
        throw new https_1.HttpsError('invalid-argument', 'productId is invalid.');
    }
    const product = await firebase_admin_1.firestore.collection('products').doc(productId).get();
    if (!product.exists || ((_b = product.data()) === null || _b === void 0 ? void 0 : _b.status) !== 'active') {
        throw new https_1.HttpsError('not-found', 'Product was not found.');
    }
    const agreement = (_c = (await firebase_admin_1.firestore.collection('partner_agreements').doc(context.cid).get()).data()) !== null && _c !== void 0 ? _c : {};
    const allowedModels = Array.isArray(agreement.commercialModels) ? agreement.commercialModels : [];
    if (!data.commercialModel || !allowedModels.includes(data.commercialModel)) {
        throw new https_1.HttpsError('failed-precondition', 'Commercial model is outside the agreement.', {
            code: 'COMMERCIAL_MODEL_NOT_ALLOWED',
        });
    }
    const numericValues = [data.fixedPrice, data.minPrice, data.maxPrice, data.commissionRate].filter((value) => value !== null && value !== undefined);
    if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
        throw new https_1.HttpsError('invalid-argument', 'Pricing values must be non-negative numbers.');
    }
    if (typeof data.minPrice === 'number' &&
        typeof data.maxPrice === 'number' &&
        data.minPrice > data.maxPrice) {
        throw new https_1.HttpsError('invalid-argument', 'minPrice cannot exceed maxPrice.');
    }
    const offerId = `${context.cid}__${productId}`;
    await firebase_admin_1.firestore.collection('company_product_offers').doc(offerId).set({
        companyId: context.cid,
        productId,
        enabled: data.enabled === true,
        commercialModel: data.commercialModel,
        fixedPrice: (_d = data.fixedPrice) !== null && _d !== void 0 ? _d : null,
        minPrice: (_e = data.minPrice) !== null && _e !== void 0 ? _e : null,
        maxPrice: (_f = data.maxPrice) !== null && _f !== void 0 ? _f : null,
        commissionRate: (_g = data.commissionRate) !== null && _g !== void 0 ? _g : 0,
        updatedBy: context.uid,
        updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { offerId };
});
