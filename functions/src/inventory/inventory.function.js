"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferInventory = exports.adjustInventory = exports.receiveInventory = exports.listInventory = void 0;
const https_1 = require("firebase-functions/v2/https");
const tenant_scope_1 = require("../domain/tenant-scope");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
async function recordMovement(data, context, type) {
    var _a;
    const branchId = await (0, tenant_scope_1.assertBranchInScope)(context, data.branchId);
    const productId = (0, tenant_scope_1.requiredDocumentId)(data.productId, 'productId');
    const rawQuantity = data.quantity;
    if (typeof rawQuantity !== 'number' ||
        !Number.isSafeInteger(rawQuantity) ||
        rawQuantity === 0 ||
        (type === 'receipt' && rawQuantity < 1)) {
        throw new https_1.HttpsError('invalid-argument', 'quantity is invalid.', { code: 'INVALID_QUANTITY' });
    }
    const reason = (_a = data.reason) === null || _a === void 0 ? void 0 : _a.trim();
    if (!reason || reason.length < 3 || reason.length > 300) {
        throw new https_1.HttpsError('invalid-argument', 'A reason between 3 and 300 characters is required.');
    }
    const idempotencyKey = (0, tenant_scope_1.requiredDocumentId)(data.idempotencyKey, 'idempotencyKey');
    const movementId = `${context.cid}__${idempotencyKey}`;
    const movementRef = firebase_admin_1.firestore.collection('stock_movements').doc(movementId);
    const inventoryId = `${context.cid}__${branchId}__${productId}`;
    const inventoryRef = firebase_admin_1.firestore.collection('branch_inventory').doc(inventoryId);
    const productRef = firebase_admin_1.firestore.collection('products').doc(productId);
    const quantityAfter = await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a, _b, _c, _d, _e;
        const [existingMovement, inventory, product] = await Promise.all([
            transaction.get(movementRef),
            transaction.get(inventoryRef),
            transaction.get(productRef),
        ]);
        if (existingMovement.exists)
            return Number((_b = (_a = existingMovement.data()) === null || _a === void 0 ? void 0 : _a.quantityAfter) !== null && _b !== void 0 ? _b : 0);
        if (!product.exists || ((_c = product.data()) === null || _c === void 0 ? void 0 : _c.status) !== 'active') {
            throw new https_1.HttpsError('not-found', 'Product was not found.', { code: 'PRODUCT_NOT_FOUND' });
        }
        const current = Number((_e = (_d = inventory.data()) === null || _d === void 0 ? void 0 : _d.quantity) !== null && _e !== void 0 ? _e : 0);
        const next = current + rawQuantity;
        if (next < 0) {
            throw new https_1.HttpsError('failed-precondition', 'Movement would create negative stock.', {
                code: 'INSUFFICIENT_STOCK',
                available: current,
            });
        }
        transaction.set(inventoryRef, {
            companyId: context.cid,
            branchId,
            productId,
            quantity: next,
            updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.create(movementRef, {
            companyId: context.cid,
            branchId,
            productId,
            type,
            quantityDelta: rawQuantity,
            quantityBefore: current,
            quantityAfter: next,
            reason,
            actorUid: context.uid,
            idempotencyKey,
            createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
        });
        return next;
    });
    return { movementId, quantityAfter };
}
exports.listInventory = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'inventory.read' }, async (data, context) => {
    var _a;
    const branchId = data.branchId
        ? await (0, tenant_scope_1.assertBranchInScope)(context, data.branchId)
        : context.scopeLevel === 'branch'
            ? context.entityId
            : undefined;
    const limit = Math.min(Math.max(Number((_a = data.limit) !== null && _a !== void 0 ? _a : 100), 1), 200);
    let query = firebase_admin_1.firestore
        .collection('branch_inventory')
        .where('companyId', '==', context.cid);
    if (branchId)
        query = query.where('branchId', '==', branchId);
    const snapshot = await query.limit(limit).get();
    return {
        inventory: snapshot.docs.map((document) => (Object.assign({ id: document.id }, document.data()))),
    };
});
exports.receiveInventory = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'inventory.receive' }, (data, context) => recordMovement(data, context, 'receipt'));
exports.adjustInventory = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'inventory.adjust' }, (data, context) => recordMovement(data, context, 'adjustment'));
exports.transferInventory = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'inventory.transfer', entitlement: 'stock_transfers' }, async (data, context) => {
    var _a;
    const fromBranchId = await (0, tenant_scope_1.assertBranchInScope)(context, data.fromBranchId);
    const toBranchId = await (0, tenant_scope_1.assertBranchInScope)(Object.assign(Object.assign({}, context), { scopeLevel: 'company' }), data.toBranchId);
    if (fromBranchId === toBranchId) {
        throw new https_1.HttpsError('invalid-argument', 'Transfer branches must be different.');
    }
    const productId = (0, tenant_scope_1.requiredDocumentId)(data.productId, 'productId');
    const quantity = (0, tenant_scope_1.requiredPositiveInteger)(data.quantity, 'quantity');
    const idempotencyKey = (0, tenant_scope_1.requiredDocumentId)(data.idempotencyKey, 'idempotencyKey');
    const reason = (_a = data.reason) === null || _a === void 0 ? void 0 : _a.trim();
    if (!reason || reason.length < 3 || reason.length > 300) {
        throw new https_1.HttpsError('invalid-argument', 'A transfer reason is required.');
    }
    const movementId = `${context.cid}__${idempotencyKey}`;
    const movementRef = firebase_admin_1.firestore.collection('stock_movements').doc(movementId);
    const fromRef = firebase_admin_1.firestore
        .collection('branch_inventory')
        .doc(`${context.cid}__${fromBranchId}__${productId}`);
    const toRef = firebase_admin_1.firestore
        .collection('branch_inventory')
        .doc(`${context.cid}__${toBranchId}__${productId}`);
    await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a, _b, _c, _d;
        const [existing, fromInventory, toInventory] = await Promise.all([
            transaction.get(movementRef),
            transaction.get(fromRef),
            transaction.get(toRef),
        ]);
        if (existing.exists)
            return;
        const fromQuantity = Number((_b = (_a = fromInventory.data()) === null || _a === void 0 ? void 0 : _a.quantity) !== null && _b !== void 0 ? _b : 0);
        const toQuantity = Number((_d = (_c = toInventory.data()) === null || _c === void 0 ? void 0 : _c.quantity) !== null && _d !== void 0 ? _d : 0);
        if (fromQuantity < quantity) {
            throw new https_1.HttpsError('failed-precondition', 'Insufficient stock for transfer.', {
                code: 'INSUFFICIENT_STOCK',
                available: fromQuantity,
            });
        }
        transaction.set(fromRef, { quantity: fromQuantity - quantity, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
        transaction.set(toRef, {
            companyId: context.cid,
            branchId: toBranchId,
            productId,
            quantity: toQuantity + quantity,
            updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.create(movementRef, {
            companyId: context.cid,
            fromBranchId,
            toBranchId,
            productId,
            type: 'transfer',
            quantityDelta: quantity,
            reason,
            actorUid: context.uid,
            idempotencyKey,
            createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
        });
    });
    return { movementId };
});
