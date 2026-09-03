"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAccessContracts = exports.manageAccessContract = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
const role_catalog_1 = require("../security/role-catalog");
function requiredId(value, field) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,180}$/.test(value)) {
        throw new https_1.HttpsError('invalid-argument', `${field} is invalid.`, { code: 'INVALID_ID', field });
    }
    return value;
}
exports.manageAccessContract = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'access_contracts.manage' }, async (data, context) => {
    var _a, _b, _c, _d, _e, _f;
    if (context.scopeLevel !== 'company') {
        throw new https_1.HttpsError('permission-denied', 'Company scope is required.', {
            code: 'COMPANY_SCOPE_REQUIRED',
        });
    }
    const contractId = data.contractId
        ? requiredId(data.contractId, 'contractId')
        : firebase_admin_1.firestore.collection('access_contracts').doc().id;
    const targetUid = requiredId(data.targetUid, 'targetUid');
    const entityId = requiredId(data.entityId, 'entityId');
    const status = data.status === 'suspended' ? 'suspended' : 'active';
    if (!(0, role_catalog_1.isCisusRole)(data.jobRoleId) || data.jobRoleId === 'platform_admin') {
        throw new https_1.HttpsError('invalid-argument', 'jobRoleId is not assignable in a tenant.', {
            code: 'INVALID_JOB_ROLE',
        });
    }
    const contractRef = firebase_admin_1.firestore.collection('access_contracts').doc(contractId);
    const [unitSnapshot, targetUser, existingContractSnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('business_units').doc(entityId).get(),
        firebase_admin_1.auth.getUser(targetUid).catch(() => undefined),
        contractRef.get(),
    ]);
    const unit = (_a = unitSnapshot.data()) !== null && _a !== void 0 ? _a : {};
    if (!unitSnapshot.exists || unit.companyId !== context.cid || unit.status !== 'active') {
        throw new https_1.HttpsError('permission-denied', 'Target unit is outside the active company.', {
            code: 'TARGET_SCOPE_MISMATCH',
        });
    }
    if (!targetUser) {
        throw new https_1.HttpsError('not-found', 'Target Firebase user was not found.', {
            code: 'TARGET_USER_NOT_FOUND',
        });
    }
    const existingContract = existingContractSnapshot.data();
    if (existingContractSnapshot.exists &&
        ((existingContract === null || existingContract === void 0 ? void 0 : existingContract.companyId) !== context.cid || (existingContract === null || existingContract === void 0 ? void 0 : existingContract.uid) !== targetUid)) {
        throw new https_1.HttpsError('permission-denied', 'The company and user of an access contract are immutable.', { code: 'ACCESS_CONTRACT_IDENTITY_IMMUTABLE' });
    }
    const rolePolicy = role_catalog_1.ROLE_POLICIES[data.jobRoleId];
    if (status === 'active' && rolePolicy.seatRequired) {
        const [subscriptionSnapshot, existingSeat, allocations] = await Promise.all([
            firebase_admin_1.firestore.collection('subscription_entitlements').doc(context.cid).get(),
            firebase_admin_1.firestore
                .collection('company_seat_allocations')
                .doc(context.cid)
                .collection('users')
                .doc(targetUid)
                .get(),
            firebase_admin_1.firestore
                .collection('company_seat_allocations')
                .doc(context.cid)
                .collection('users')
                .where('status', '==', 'active')
                .count()
                .get(),
        ]);
        const seatLimit = Number((_e = (_d = (_c = (_b = subscriptionSnapshot.data()) === null || _b === void 0 ? void 0 : _b.limits) === null || _c === void 0 ? void 0 : _c.seats) === null || _d === void 0 ? void 0 : _d.max) !== null && _e !== void 0 ? _e : 0);
        const allocated = allocations.data().count;
        if (((_f = existingSeat.data()) === null || _f === void 0 ? void 0 : _f.status) !== 'active' && (seatLimit < 1 || allocated >= seatLimit)) {
            throw new https_1.HttpsError('resource-exhausted', 'The company has no named seats available.', {
                code: 'SEAT_CAPACITY_EXCEEDED',
                seatLimit,
                allocated,
            });
        }
    }
    await contractRef.set(Object.assign({ uid: targetUid, companyId: context.cid, scopeUnitId: entityId, jobRoleId: data.jobRoleId, status, updatedBy: context.uid, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, (existingContractSnapshot.exists ? {} : { createdAt: firebase_admin_1.FieldValue.serverTimestamp() })), { merge: true });
    await firebase_admin_1.firestore.collection('audit_logs').add({
        actorUid: context.uid,
        operation: 'access_contracts.manage',
        companyId: context.cid,
        entityId,
        targetUid,
        resourceId: contractId,
        status,
        timestamp: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    return { contractId, status };
});
exports.listAccessContracts = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'access_contracts.read' }, async (data, context) => {
    var _a;
    const limit = Math.min(Math.max(Number((_a = data.limit) !== null && _a !== void 0 ? _a : 50), 1), 100);
    let query = firebase_admin_1.firestore
        .collection('access_contracts')
        .where('companyId', '==', context.cid);
    if (context.scopeLevel === 'branch')
        query = query.where('scopeUnitId', '==', context.entityId);
    const snapshot = await query.limit(limit).get();
    return {
        contracts: snapshot.docs.map((document) => (Object.assign({ id: document.id }, document.data()))),
    };
});
