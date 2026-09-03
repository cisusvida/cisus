"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFreshScopedContext = resolveFreshScopedContext;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
const scoped_claims_1 = require("./scoped-claims");
function dataOf(snapshot) {
    var _a;
    if (!snapshot.exists) {
        throw new https_1.HttpsError('permission-denied', 'The active access context no longer exists.', {
            code: 'SCOPED_CONTEXT_NOT_FOUND',
        });
    }
    return (_a = snapshot.data()) !== null && _a !== void 0 ? _a : {};
}
function deny(code, message, uid, cid) {
    console.warn('[ScopedAuthorization] denied', { code, uid, companyId: cid !== null && cid !== void 0 ? cid : null });
    throw new https_1.HttpsError('permission-denied', message, { code });
}
async function resolveFreshScopedContext(request, policy) {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.', {
            code: 'AUTH_REQUIRED',
        });
    }
    const uid = request.auth.uid;
    const claims = (0, scoped_claims_1.parseScopedClaims)(request.auth.token);
    const userStateRef = firebase_admin_1.firestore.collection('user_permission_state').doc(uid);
    const entitlementRef = firebase_admin_1.firestore.collection('subscription_entitlements').doc(claims.cid);
    const projectionRef = firebase_admin_1.firestore.collection('scoped_user_permissions').doc(claims.scopeId);
    const unitRef = firebase_admin_1.firestore.collection('business_units').doc(claims.entityId);
    const [userStateSnapshot, entitlementSnapshot, projectionSnapshot, unitSnapshot] = await Promise.all([
        userStateRef.get(),
        entitlementRef.get(),
        projectionRef.get(),
        unitRef.get(),
    ]);
    const userState = dataOf(userStateSnapshot);
    const entitlements = dataOf(entitlementSnapshot);
    const projection = dataOf(projectionSnapshot);
    const unit = dataOf(unitSnapshot);
    if (userState.permissionVersionNonce !== claims.pv) {
        return deny('STALE_PERMISSION_VERSION', 'Permission context is stale.', uid, claims.cid);
    }
    if (entitlements.subscriptionVersionNonce !== claims.sv) {
        return deny('STALE_SUBSCRIPTION_VERSION', 'Subscription context is stale.', uid, claims.cid);
    }
    if (!['active', 'trialing'].includes(String(entitlements.status))) {
        return deny('SUBSCRIPTION_INACTIVE', 'Company subscription is not active.', uid, claims.cid);
    }
    if (entitlements.companyId !== claims.cid) {
        return deny('SUBSCRIPTION_COMPANY_MISMATCH', 'Subscription is outside the active company.', uid, claims.cid);
    }
    if (projection.uid !== uid ||
        projection.companyId !== claims.cid ||
        projection.entityId !== claims.entityId ||
        projection.jobRoleId !== claims.jobRoleId ||
        projection.scopeLevel !== claims.scopeLevel ||
        projection.status !== 'active') {
        return deny('SCOPED_PROJECTION_MISMATCH', 'Access projection does not match the token.', uid, claims.cid);
    }
    if (unit.companyId !== claims.cid || unit.status !== 'active') {
        return deny('BUSINESS_UNIT_MISMATCH', 'Business unit is outside the active company.', uid, claims.cid);
    }
    if (projection.seatRequired === true) {
        const seat = await firebase_admin_1.firestore
            .collection('company_seat_allocations')
            .doc(claims.cid)
            .collection('users')
            .doc(uid)
            .get();
        if (!seat.exists || ((_b = seat.data()) === null || _b === void 0 ? void 0 : _b.status) !== 'active') {
            return deny('NAMED_SEAT_REQUIRED', 'An active named seat is required.', uid, claims.cid);
        }
    }
    (0, scoped_claims_1.assertScopedPermission)(claims, policy.permission);
    const enabledEntitlements = Array.isArray(entitlements.entitlements)
        ? entitlements.entitlements.filter((item) => typeof item === 'string')
        : [];
    if (policy.entitlement && !enabledEntitlements.includes(policy.entitlement)) {
        return deny('ENTITLEMENT_REQUIRED', 'The subscription does not enable this capability.', uid, claims.cid);
    }
    return Object.assign(Object.assign({ uid }, claims), { entitlements: enabledEntitlements });
}
