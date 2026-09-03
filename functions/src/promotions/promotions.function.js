"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPromotions = exports.managePromotion = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
const tenant_scope_1 = require("../domain/tenant-scope");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
function percentage(value, field) {
    const number = Number(value !== null && value !== void 0 ? value : 0);
    if (!Number.isFinite(number) || number < 0 || number > 100) {
        throw new https_1.HttpsError('invalid-argument', `${field} must be between 0 and 100.`);
    }
    return number;
}
function optionalTimestamp(value, field) {
    if (value === null || value === undefined || value === '')
        return null;
    if (typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', `${field} is invalid.`);
    }
    const milliseconds = Date.parse(value);
    if (!Number.isFinite(milliseconds)) {
        throw new https_1.HttpsError('invalid-argument', `${field} is invalid.`);
    }
    return firebase_admin_1.Timestamp.fromMillis(milliseconds);
}
exports.managePromotion = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'promotions.manage', entitlement: 'margin_promotions' }, async (data, context) => {
    var _a, _b;
    const promotionId = data.promotionId
        ? (0, tenant_scope_1.requiredDocumentId)(data.promotionId, 'promotionId')
        : firebase_admin_1.firestore.collection('promotions').doc().id;
    const name = (_a = data.name) === null || _a === void 0 ? void 0 : _a.trim();
    if (!name || name.length < 3 || name.length > 120) {
        throw new https_1.HttpsError('invalid-argument', 'Promotion name is invalid.');
    }
    const productIds = Array.isArray(data.productIds)
        ? Array.from(new Set(data.productIds.map((id) => (0, tenant_scope_1.requiredDocumentId)(id, 'productId')))).slice(0, 100)
        : [];
    const startsAt = optionalTimestamp(data.startsAt, 'startsAt');
    const endsAt = optionalTimestamp(data.endsAt, 'endsAt');
    if (startsAt && endsAt && startsAt.toMillis() >= endsAt.toMillis()) {
        throw new https_1.HttpsError('invalid-argument', 'endsAt must be after startsAt.');
    }
    const promotionRef = firebase_admin_1.firestore.collection('promotions').doc(promotionId);
    const existing = await promotionRef.get();
    if (existing.exists && ((_b = existing.data()) === null || _b === void 0 ? void 0 : _b.companyId) !== context.cid) {
        throw new https_1.HttpsError('permission-denied', 'Promotion is outside the active company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    const status = data.status === 'inactive' ? 'inactive' : 'active';
    await promotionRef.set(Object.assign(Object.assign({ promotionId, companyId: context.cid, name,
        status,
        productIds, discountPercent: percentage(data.discountPercent, 'discountPercent'), marginBonusRate: percentage(data.marginBonusRate, 'marginBonusRate'), startsAt,
        endsAt }, (existing.exists ? {} : { createdAt: firebase_admin_1.FieldValue.serverTimestamp() })), { updatedAt: firebase_admin_1.FieldValue.serverTimestamp(), updatedBy: context.uid }), { merge: true });
    return { promotionId, status };
});
exports.listPromotions = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'promotions.read', entitlement: 'margin_promotions' }, async (_data, context) => {
    const snapshot = await firebase_admin_1.firestore
        .collection('promotions')
        .where('companyId', '==', context.cid)
        .limit(100)
        .get();
    return { promotions: snapshot.docs.map((document) => (Object.assign({ id: document.id }, document.data()))) };
});
