"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageBusinessUnit = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
exports.manageBusinessUnit = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'branches.manage', entitlement: 'multi_branch' }, async (data, context) => {
    var _a, _b, _c;
    if (context.scopeLevel !== 'company') {
        throw new https_1.HttpsError('permission-denied', 'Company scope is required.', {
            code: 'COMPANY_SCOPE_REQUIRED',
        });
    }
    const branchId = (_a = data.branchId) === null || _a === void 0 ? void 0 : _a.trim();
    const name = (_b = data.name) === null || _b === void 0 ? void 0 : _b.trim();
    const status = data.status === 'inactive' ? 'inactive' : 'active';
    if (!branchId || !/^[A-Za-z0-9_-]{3,180}$/.test(branchId) || branchId === context.cid) {
        throw new https_1.HttpsError('invalid-argument', 'branchId is invalid.');
    }
    if (!name || name.length < 3 || name.length > 120) {
        throw new https_1.HttpsError('invalid-argument', 'Branch name is invalid.');
    }
    const branchRef = firebase_admin_1.firestore.collection('business_units').doc(branchId);
    const existing = await branchRef.get();
    if (existing.exists && ((_c = existing.data()) === null || _c === void 0 ? void 0 : _c.companyId) !== context.cid) {
        throw new https_1.HttpsError('permission-denied', 'Branch ID belongs to another company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    await branchRef.set(Object.assign(Object.assign({ companyId: context.cid, name, type: 'branch', status }, (existing.exists ? {} : { createdAt: firebase_admin_1.FieldValue.serverTimestamp() })), { updatedAt: firebase_admin_1.FieldValue.serverTimestamp(), updatedBy: context.uid }), { merge: true });
    await firebase_admin_1.firestore.collection('audit_logs').add({
        actorUid: context.uid,
        operation: 'branches.manage',
        companyId: context.cid,
        entityId: branchId,
        status,
        timestamp: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    return { branchId, status };
});
