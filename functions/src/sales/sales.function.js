"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundSale = exports.listSales = exports.createSale = void 0;
const https_1 = require("firebase-functions/v2/https");
const tenant_scope_1 = require("../domain/tenant-scope");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
const pricing_1 = require("./pricing");
function activePromotionFor(promotions, productId) {
    const now = Date.now();
    return promotions
        .map((document) => document.data())
        .filter((promotion) => {
        var _a, _b, _c, _d, _e, _f;
        const startsAt = (_c = (_b = (_a = promotion.startsAt) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
        const endsAt = (_f = (_e = (_d = promotion.endsAt) === null || _d === void 0 ? void 0 : _d.toMillis) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : Number.MAX_SAFE_INTEGER;
        const products = Array.isArray(promotion.productIds) ? promotion.productIds : [];
        return promotion.status === 'active' && startsAt <= now && endsAt >= now &&
            (products.length === 0 || products.includes(productId));
    })
        .sort((left, right) => { var _a, _b; return Number((_a = right.discountPercent) !== null && _a !== void 0 ? _a : 0) - Number((_b = left.discountPercent) !== null && _b !== void 0 ? _b : 0); })[0];
}
exports.createSale = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'sales.create' }, async (data, context) => {
    var _a, _b;
    const branchId = await (0, tenant_scope_1.assertBranchInScope)(context, data.branchId);
    const idempotencyKey = (0, tenant_scope_1.requiredDocumentId)(data.idempotencyKey, 'idempotencyKey');
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50) {
        throw new https_1.HttpsError('invalid-argument', 'Sale must contain between 1 and 50 items.');
    }
    const items = data.items.map((item) => {
        var _a;
        return ({
            productId: (0, tenant_scope_1.requiredDocumentId)(item.productId, 'productId'),
            quantity: (0, tenant_scope_1.requiredPositiveInteger)(item.quantity, 'quantity'),
            requestedUnitPrice: (_a = item.requestedUnitPrice) !== null && _a !== void 0 ? _a : null,
        });
    });
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
        throw new https_1.HttpsError('invalid-argument', 'Duplicate products are not allowed in one sale.');
    }
    if (data.customerId) {
        const link = await firebase_admin_1.firestore
            .collection('customer_company_links')
            .doc(`${context.cid}__${(0, tenant_scope_1.requiredDocumentId)(data.customerId, 'customerId')}`)
            .get();
        if (!link.exists || ((_a = link.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'active') {
            throw new https_1.HttpsError('permission-denied', 'Customer is outside the active company.', {
                code: 'FOREIGN_COMPANY_RESOURCE',
            });
        }
    }
    const [agreementSnapshot, promotionsSnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('partner_agreements').doc(context.cid).get(),
        firebase_admin_1.firestore.collection('promotions').where('companyId', '==', context.cid).where('status', '==', 'active').get(),
    ]);
    const agreement = (_b = agreementSnapshot.data()) !== null && _b !== void 0 ? _b : {};
    const authority = agreement.pricingAuthority;
    if (!['cisus_fixed', 'cisus_bands', 'company_freedom'].includes(authority)) {
        throw new https_1.HttpsError('failed-precondition', 'Company pricing agreement is invalid.', {
            code: 'INVALID_PRICING_AGREEMENT',
        });
    }
    const saleId = `${context.cid}__${idempotencyKey}`;
    const saleRef = firebase_admin_1.firestore.collection('sales').doc(saleId);
    const result = await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a, _b, _c, _d, _e;
        const existing = await transaction.get(saleRef);
        if (existing.exists) {
            return {
                total: Number((_b = (_a = existing.data()) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0),
                currency: String((_d = (_c = existing.data()) === null || _c === void 0 ? void 0 : _c.currency) !== null && _d !== void 0 ? _d : 'CLP'),
            };
        }
        const productRefs = items.map((item) => firebase_admin_1.firestore.collection('products').doc(item.productId));
        const offerRefs = items.map((item) => firebase_admin_1.firestore.collection('company_product_offers').doc(`${context.cid}__${item.productId}`));
        const inventoryRefs = items.map((item) => firebase_admin_1.firestore.collection('branch_inventory').doc(`${context.cid}__${branchId}__${item.productId}`));
        const [products, offers, inventories] = await Promise.all([
            transaction.getAll(...productRefs),
            transaction.getAll(...offerRefs),
            transaction.getAll(...inventoryRefs),
        ]);
        const lines = items.map((item, index) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            const product = (_a = products[index].data()) !== null && _a !== void 0 ? _a : {};
            const offer = (_b = offers[index].data()) !== null && _b !== void 0 ? _b : {};
            const inventory = (_c = inventories[index].data()) !== null && _c !== void 0 ? _c : {};
            if (!products[index].exists || product.status !== 'active' || offer.enabled !== true) {
                throw new https_1.HttpsError('failed-precondition', 'Product is not enabled for this company.', {
                    code: 'PRODUCT_NOT_AVAILABLE',
                    productId: item.productId,
                });
            }
            const available = Number((_d = inventory.quantity) !== null && _d !== void 0 ? _d : 0);
            if (available < item.quantity) {
                throw new https_1.HttpsError('failed-precondition', 'Insufficient stock.', {
                    code: 'INSUFFICIENT_STOCK',
                    productId: item.productId,
                    available,
                });
            }
            const promotion = context.entitlements.includes('margin_promotions')
                ? activePromotionFor(promotionsSnapshot.docs, item.productId)
                : undefined;
            const unitPrice = (0, pricing_1.calculateAuthorizedUnitPrice)({
                authority,
                basePrice: Number((_e = product.basePrice) !== null && _e !== void 0 ? _e : 0),
                fixedPrice: typeof offer.fixedPrice === 'number' ? offer.fixedPrice : null,
                minPrice: typeof offer.minPrice === 'number' ? offer.minPrice : null,
                maxPrice: typeof offer.maxPrice === 'number' ? offer.maxPrice : null,
                requestedPrice: item.requestedUnitPrice,
                discountPercent: Number((_f = promotion === null || promotion === void 0 ? void 0 : promotion.discountPercent) !== null && _f !== void 0 ? _f : 0),
            });
            const lineTotal = unitPrice * item.quantity;
            const commissionRate = Number((_g = offer.commissionRate) !== null && _g !== void 0 ? _g : 0) + Number((_h = promotion === null || promotion === void 0 ? void 0 : promotion.marginBonusRate) !== null && _h !== void 0 ? _h : 0);
            return Object.assign(Object.assign({}, item), { productName: String((_j = product.name) !== null && _j !== void 0 ? _j : 'Producto Cisus'), sku: String((_k = product.sku) !== null && _k !== void 0 ? _k : ''), currency: String((_m = (_l = product.currency) !== null && _l !== void 0 ? _l : agreement.currency) !== null && _m !== void 0 ? _m : 'CLP'), unitPrice,
                lineTotal, commercialModel: String((_o = offer.commercialModel) !== null && _o !== void 0 ? _o : 'wholesale'), commissionRate, commissionAmount: Math.round((lineTotal * commissionRate) / 100), promotionId: (_p = promotion === null || promotion === void 0 ? void 0 : promotion.promotionId) !== null && _p !== void 0 ? _p : null, quantityBefore: available, quantityAfter: available - item.quantity });
        });
        const currency = lines[0].currency;
        if (lines.some((line) => line.currency !== currency)) {
            throw new https_1.HttpsError('failed-precondition', 'All sale items must use the same currency.');
        }
        const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
        const commissionTotal = lines.reduce((sum, line) => sum + line.commissionAmount, 0);
        transaction.create(saleRef, {
            companyId: context.cid,
            branchId,
            customerId: (_e = data.customerId) !== null && _e !== void 0 ? _e : null,
            sellerUid: context.uid,
            status: 'completed',
            total,
            currency,
            commissionTotal,
            idempotencyKey,
            createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
        });
        lines.forEach((line, index) => {
            const lineRef = firebase_admin_1.firestore.collection('sale_lines').doc(`${saleId}__${index + 1}`);
            const movementRef = firebase_admin_1.firestore.collection('stock_movements').doc(`${saleId}__sale__${index + 1}`);
            transaction.create(lineRef, Object.assign(Object.assign({ saleId, companyId: context.cid, branchId }, line), { createdAt: firebase_admin_1.FieldValue.serverTimestamp() }));
            transaction.set(inventoryRefs[index], { quantity: line.quantityAfter, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
            transaction.create(movementRef, {
                companyId: context.cid,
                branchId,
                productId: line.productId,
                type: 'sale',
                quantityDelta: -line.quantity,
                quantityBefore: line.quantityBefore,
                quantityAfter: line.quantityAfter,
                saleId,
                actorUid: context.uid,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
        });
        return { total, currency };
    });
    return Object.assign({ saleId }, result);
});
exports.listSales = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'sales.read' }, async (data, context) => {
    var _a;
    const branchId = data.branchId
        ? await (0, tenant_scope_1.assertBranchInScope)(context, data.branchId)
        : context.scopeLevel === 'branch'
            ? context.entityId
            : undefined;
    let query = firebase_admin_1.firestore.collection('sales').where('companyId', '==', context.cid);
    if (branchId)
        query = query.where('branchId', '==', branchId);
    if (context.jobRoleId === 'sales_associate')
        query = query.where('sellerUid', '==', context.uid);
    const snapshot = await query.limit(Math.min(Math.max(Number((_a = data.limit) !== null && _a !== void 0 ? _a : 50), 1), 100)).get();
    return { sales: snapshot.docs.map((document) => (Object.assign({ id: document.id }, document.data()))) };
});
exports.refundSale = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'sales.refund' }, async (data, context) => {
    var _a, _b;
    const saleId = (0, tenant_scope_1.requiredDocumentId)(data.saleId, 'saleId');
    const idempotencyKey = (0, tenant_scope_1.requiredDocumentId)(data.idempotencyKey, 'idempotencyKey');
    const reason = (_a = data.reason) === null || _a === void 0 ? void 0 : _a.trim();
    if (!reason || reason.length < 3 || reason.length > 300) {
        throw new https_1.HttpsError('invalid-argument', 'A refund reason is required.');
    }
    const saleRef = firebase_admin_1.firestore.collection('sales').doc(saleId);
    const saleSnapshot = await saleRef.get();
    const sale = (_b = saleSnapshot.data()) !== null && _b !== void 0 ? _b : {};
    if (!saleSnapshot.exists || sale.companyId !== context.cid) {
        throw new https_1.HttpsError('permission-denied', 'Sale is outside the active company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    await (0, tenant_scope_1.assertBranchInScope)(context, sale.branchId);
    const lines = await firebase_admin_1.firestore.collection('sale_lines').where('saleId', '==', saleId).get();
    const refundRef = firebase_admin_1.firestore.collection('returns').doc(`${context.cid}__${idempotencyKey}`);
    await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a;
        const [currentSale, existingRefund] = await Promise.all([
            transaction.get(saleRef),
            transaction.get(refundRef),
        ]);
        if (existingRefund.exists)
            return;
        if (((_a = currentSale.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'completed') {
            throw new https_1.HttpsError('failed-precondition', 'Only completed sales can be refunded.', {
                code: 'SALE_NOT_REFUNDABLE',
            });
        }
        const inventoryRefs = lines.docs.map((line) => firebase_admin_1.firestore
            .collection('branch_inventory')
            .doc(`${context.cid}__${sale.branchId}__${line.data().productId}`));
        const inventories = await transaction.getAll(...inventoryRefs);
        lines.docs.forEach((line, index) => {
            var _a, _b;
            const lineData = line.data();
            const inventoryRef = inventoryRefs[index];
            const inventory = inventories[index];
            const before = Number((_b = (_a = inventory.data()) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : 0);
            transaction.set(inventoryRef, { quantity: before + Number(lineData.quantity), updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
            transaction.create(firebase_admin_1.firestore.collection('stock_movements').doc(`${refundRef.id}__${index + 1}`), {
                companyId: context.cid,
                branchId: sale.branchId,
                productId: lineData.productId,
                type: 'refund',
                quantityDelta: Number(lineData.quantity),
                quantityBefore: before,
                quantityAfter: before + Number(lineData.quantity),
                saleId,
                returnId: refundRef.id,
                actorUid: context.uid,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
        });
        transaction.update(saleRef, {
            status: 'refunded',
            refundedAt: firebase_admin_1.FieldValue.serverTimestamp(),
            refundedBy: context.uid,
        });
        transaction.create(refundRef, {
            companyId: context.cid,
            branchId: sale.branchId,
            saleId,
            reason,
            actorUid: context.uid,
            idempotencyKey,
            createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
        });
    });
    return { saleId, status: 'refunded' };
});
