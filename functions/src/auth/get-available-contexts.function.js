"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableContexts = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
exports.getAvailableContexts = (0, https_1.onCall)({
    region: 'southamerica-west1',
    memory: '256MiB',
    timeoutSeconds: 20,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
}, async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.', {
            code: 'AUTH_REQUIRED',
        });
    }
    const snapshot = await firebase_admin_1.firestore
        .collection('scoped_user_permissions')
        .where('uid', '==', request.auth.uid)
        .where('status', '==', 'active')
        .limit(50)
        .get();
    const contexts = snapshot.docs.flatMap((document) => {
        var _a;
        const data = document.data();
        if (typeof data.companyId !== 'string' ||
            typeof data.entityId !== 'string' ||
            typeof data.jobRoleId !== 'string' ||
            (data.scopeLevel !== 'company' && data.scopeLevel !== 'branch')) {
            console.warn('[getAvailableContexts] ignored malformed projection', {
                scopeId: document.id,
                uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
            });
            return [];
        }
        return [
            {
                scopeId: document.id,
                companyId: data.companyId,
                companyName: typeof data.companyName === 'string' ? data.companyName : 'Empresa',
                entityId: data.entityId,
                entityName: typeof data.entityName === 'string' ? data.entityName : 'Unidad',
                jobRoleId: data.jobRoleId,
                scopeLevel: data.scopeLevel,
            },
        ];
    });
    return { contexts };
});
