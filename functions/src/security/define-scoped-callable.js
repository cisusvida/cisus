"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineScopedCallable = defineScopedCallable;
const https_1 = require("firebase-functions/v2/https");
const scoped_authorization_1 = require("./scoped-authorization");
function defineScopedCallable(policy, handler) {
    var _a;
    return (0, https_1.onCall)({
        region: 'southamerica-west1',
        memory: '256MiB',
        timeoutSeconds: (_a = policy.timeoutSeconds) !== null && _a !== void 0 ? _a : 30,
        concurrency: 20,
        enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
    }, async (request) => {
        const context = await (0, scoped_authorization_1.resolveFreshScopedContext)(request, {
            permission: policy.permission,
            entitlement: policy.entitlement,
        });
        return handler(request.data, context, request);
    });
}
