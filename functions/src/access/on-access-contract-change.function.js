"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAccessContractChange = void 0;
const node_crypto_1 = require("node:crypto");
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_admin_1 = require("../shared/firebase-admin");
const role_catalog_1 = require("../security/role-catalog");
function fingerprint(value) {
    return (0, node_crypto_1.createHash)('sha256').update(JSON.stringify(value)).digest('hex');
}
async function updateNamedSeat(uid, companyId, seatRequired) {
    const seatRef = firebase_admin_1.firestore
        .collection('company_seat_allocations')
        .doc(companyId)
        .collection('users')
        .doc(uid);
    if (seatRequired) {
        await seatRef.set({
            uid,
            companyId,
            status: 'active',
            seatClass: 'tenant_staff',
            updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
    }
    const contracts = await firebase_admin_1.firestore
        .collection('access_contracts')
        .where('uid', '==', uid)
        .where('companyId', '==', companyId)
        .where('status', '==', 'active')
        .get();
    const stillRequired = contracts.docs.some((document) => {
        const role = document.data().jobRoleId;
        return (0, role_catalog_1.isCisusRole)(role) && role_catalog_1.ROLE_POLICIES[role].seatRequired;
    });
    if (!stillRequired) {
        await seatRef.set({ status: 'released', releasedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
    }
}
exports.onAccessContractChange = (0, firestore_1.onDocumentWritten)({
    document: 'access_contracts/{contractId}',
    database: firebase_admin_1.databaseId,
    region: 'southamerica-west1',
    retry: false,
}, async (event) => {
    var _a, _b, _c, _d, _e;
    const contractId = event.params.contractId;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const projectionRef = firebase_admin_1.firestore.collection('scoped_user_permissions').doc(contractId);
    const previousProjection = await projectionRef.get();
    const previousData = (_c = previousProjection.data()) !== null && _c !== void 0 ? _c : {};
    const previousUid = typeof previousData.uid === 'string'
        ? previousData.uid
        : typeof (before === null || before === void 0 ? void 0 : before.uid) === 'string'
            ? before.uid
            : undefined;
    const previousCompanyId = typeof previousData.companyId === 'string'
        ? previousData.companyId
        : typeof (before === null || before === void 0 ? void 0 : before.companyId) === 'string'
            ? before.companyId
            : undefined;
    const active = (after === null || after === void 0 ? void 0 : after.status) === 'active';
    const uid = typeof (after === null || after === void 0 ? void 0 : after.uid) === 'string' ? after.uid : undefined;
    const companyId = typeof (after === null || after === void 0 ? void 0 : after.companyId) === 'string' ? after.companyId : undefined;
    const entityId = typeof (after === null || after === void 0 ? void 0 : after.scopeUnitId) === 'string' ? after.scopeUnitId : undefined;
    const role = after === null || after === void 0 ? void 0 : after.jobRoleId;
    if (previousUid && uid && previousUid !== uid) {
        await firebase_admin_1.firestore.runTransaction(async (transaction) => {
            var _a, _b;
            const previousStateRef = firebase_admin_1.firestore.collection('user_permission_state').doc(previousUid);
            const previousState = await transaction.get(previousStateRef);
            const current = Number((_b = (_a = previousState.data()) === null || _a === void 0 ? void 0 : _a.permissionVersionNonce) !== null && _b !== void 0 ? _b : 0);
            transaction.set(previousStateRef, { permissionVersionNonce: current + 1, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
        });
    }
    if (previousUid &&
        previousCompanyId &&
        (previousUid !== uid || previousCompanyId !== companyId)) {
        await updateNamedSeat(previousUid, previousCompanyId, false);
    }
    if (!active || !uid || !companyId || !entityId || !(0, role_catalog_1.isCisusRole)(role)) {
        if (previousProjection.exists && previousUid) {
            await firebase_admin_1.firestore.runTransaction(async (transaction) => {
                var _a, _b;
                const stateRef = firebase_admin_1.firestore.collection('user_permission_state').doc(previousUid);
                const state = await transaction.get(stateRef);
                const current = Number((_b = (_a = state.data()) === null || _a === void 0 ? void 0 : _a.permissionVersionNonce) !== null && _b !== void 0 ? _b : 0);
                transaction.delete(projectionRef);
                transaction.set(stateRef, { permissionVersionNonce: current + 1, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
            });
        }
        if (previousUid && previousCompanyId) {
            await updateNamedSeat(previousUid, previousCompanyId, false);
        }
        return;
    }
    const [unitSnapshot, companySnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('business_units').doc(entityId).get(),
        firebase_admin_1.firestore.collection('companies').doc(companyId).get(),
    ]);
    const unit = (_d = unitSnapshot.data()) !== null && _d !== void 0 ? _d : {};
    const company = (_e = companySnapshot.data()) !== null && _e !== void 0 ? _e : {};
    if (!unitSnapshot.exists || unit.companyId !== companyId || unit.status !== 'active') {
        console.error('[onAccessContractChange] invalid unit scope', { contractId, companyId, entityId });
        if (previousProjection.exists)
            await projectionRef.delete();
        return;
    }
    const policy = role_catalog_1.ROLE_POLICIES[role];
    const projection = {
        sourceContractId: contractId,
        uid,
        companyId,
        companyName: typeof company.name === 'string' ? company.name : 'Empresa',
        entityId,
        entityName: typeof unit.name === 'string' ? unit.name : 'Unidad',
        jobRoleId: role,
        scopeLevel: unit.type === 'company' ? 'company' : 'branch',
        permissions: [...policy.permissions],
        seatRequired: policy.seatRequired,
        seatClass: policy.seatRequired ? 'tenant_staff' : 'platform_exempt',
        status: 'active',
    };
    const projectionFingerprint = fingerprint(projection);
    await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a, _b, _c;
        const stateRef = firebase_admin_1.firestore.collection('user_permission_state').doc(uid);
        const [state, currentProjection] = await Promise.all([
            transaction.get(stateRef),
            transaction.get(projectionRef),
        ]);
        if (((_a = currentProjection.data()) === null || _a === void 0 ? void 0 : _a.fingerprint) === projectionFingerprint)
            return;
        const currentVersion = Number((_c = (_b = state.data()) === null || _b === void 0 ? void 0 : _b.permissionVersionNonce) !== null && _c !== void 0 ? _c : 0);
        const nextVersion = Math.max(currentVersion + 1, 1);
        transaction.set(projectionRef, Object.assign(Object.assign({}, projection), { fingerprint: projectionFingerprint, permissionVersionNonce: nextVersion, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }), { merge: false });
        transaction.set(stateRef, { permissionVersionNonce: nextVersion, updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }, { merge: true });
    });
    await updateNamedSeat(uid, companyId, policy.seatRequired);
});
