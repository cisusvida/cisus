"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntityAccess = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
function requiredPositiveVersion(value, code) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
        throw new https_1.HttpsError('failed-precondition', 'Access projection is not versioned correctly.', {
            code,
        });
    }
    return value;
}
exports.getEntityAccess = (0, https_1.onCall)({
    region: 'southamerica-west1',
    memory: '256MiB',
    timeoutSeconds: 20,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
}, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.', {
            code: 'AUTH_REQUIRED',
        });
    }
    const scopeId = (_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.scopeId) === null || _c === void 0 ? void 0 : _c.trim();
    if (!scopeId || scopeId.length > 180 || !/^[A-Za-z0-9_-]+$/.test(scopeId)) {
        throw new https_1.HttpsError('invalid-argument', 'A valid scopeId is required.', {
            code: 'INVALID_SCOPE_ID',
        });
    }
    const uid = request.auth.uid;
    const projectionSnapshot = await firebase_admin_1.firestore.collection('scoped_user_permissions').doc(scopeId).get();
    if (!projectionSnapshot.exists) {
        throw new https_1.HttpsError('permission-denied', 'Access context was not found.', {
            code: 'SCOPED_CONTEXT_NOT_FOUND',
        });
    }
    const projection = (_d = projectionSnapshot.data()) !== null && _d !== void 0 ? _d : {};
    const companyId = projection.companyId;
    const entityId = projection.entityId;
    const jobRoleId = projection.jobRoleId;
    const scopeLevel = projection.scopeLevel;
    if (projection.uid !== uid ||
        projection.status !== 'active' ||
        typeof companyId !== 'string' ||
        typeof entityId !== 'string' ||
        typeof jobRoleId !== 'string' ||
        (scopeLevel !== 'company' && scopeLevel !== 'branch')) {
        throw new https_1.HttpsError('permission-denied', 'Access context is not active for this user.', {
            code: 'SCOPED_PROJECTION_MISMATCH',
        });
    }
    const [userStateSnapshot, entitlementSnapshot, unitSnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('user_permission_state').doc(uid).get(),
        firebase_admin_1.firestore.collection('subscription_entitlements').doc(companyId).get(),
        firebase_admin_1.firestore.collection('business_units').doc(entityId).get(),
    ]);
    const userState = (_e = userStateSnapshot.data()) !== null && _e !== void 0 ? _e : {};
    const entitlements = (_f = entitlementSnapshot.data()) !== null && _f !== void 0 ? _f : {};
    const unit = (_g = unitSnapshot.data()) !== null && _g !== void 0 ? _g : {};
    const pv = requiredPositiveVersion(userState.permissionVersionNonce, 'INVALID_PERMISSION_VERSION');
    const sv = requiredPositiveVersion(entitlements.subscriptionVersionNonce, 'INVALID_SUBSCRIPTION_VERSION');
    if (!['active', 'trialing'].includes(String(entitlements.status))) {
        throw new https_1.HttpsError('permission-denied', 'Company subscription is not active.', {
            code: 'SUBSCRIPTION_INACTIVE',
        });
    }
    if (entitlements.companyId !== companyId) {
        throw new https_1.HttpsError('permission-denied', 'Subscription is outside the selected company.', {
            code: 'SUBSCRIPTION_COMPANY_MISMATCH',
        });
    }
    if (unit.companyId !== companyId || unit.status !== 'active') {
        throw new https_1.HttpsError('permission-denied', 'Business unit is outside the selected company.', {
            code: 'BUSINESS_UNIT_MISMATCH',
        });
    }
    if (projection.seatRequired === true) {
        const seatSnapshot = await firebase_admin_1.firestore
            .collection('company_seat_allocations')
            .doc(companyId)
            .collection('users')
            .doc(uid)
            .get();
        if (!seatSnapshot.exists || ((_h = seatSnapshot.data()) === null || _h === void 0 ? void 0 : _h.status) !== 'active') {
            throw new https_1.HttpsError('permission-denied', 'An active named seat is required.', {
                code: 'NAMED_SEAT_REQUIRED',
            });
        }
    }
    const permissions = Array.isArray(projection.permissions)
        ? Array.from(new Set(projection.permissions.filter((item) => typeof item === 'string'))).slice(0, 80)
        : [];
    if (permissions.length === 0) {
        throw new https_1.HttpsError('permission-denied', 'Access context has no permissions.', {
            code: 'PERMISSIONS_NOT_ASSIGNED',
        });
    }
    const claims = {
        pv,
        sv,
        cid: companyId,
        entityId,
        jobRoleId,
        scopeId,
        scopeLevel,
        permissions,
    };
    const customToken = await firebase_admin_1.auth.createCustomToken(uid, claims);
    await firebase_admin_1.firestore.collection('audit_logs').add({
        actorUid: uid,
        operation: 'auth.context.issue',
        companyId,
        entityId,
        scopeId,
        success: true,
        permissionVersionNonce: pv,
        subscriptionVersionNonce: sv,
        timestamp: firebase_admin_1.FieldValue.serverTimestamp(),
    });
    return {
        customToken,
        context: {
            scopeId,
            companyId,
            entityId,
            jobRoleId,
            scopeLevel,
            pv,
            sv,
            permissions,
        },
    };
});
