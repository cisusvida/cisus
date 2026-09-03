"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseScopedClaims = parseScopedClaims;
exports.assertResourceScope = assertResourceScope;
exports.assertScopedPermission = assertScopedPermission;
const https_1 = require("firebase-functions/v2/https");
function requiredString(value, claim) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new https_1.HttpsError('failed-precondition', `Scoped claim ${claim} is missing or invalid.`, {
            code: 'INVALID_SCOPED_TOKEN',
            claim,
        });
    }
    return value;
}
function requiredVersion(value, claim) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
        throw new https_1.HttpsError('failed-precondition', `Scoped claim ${claim} is missing or invalid.`, {
            code: 'INVALID_SCOPED_TOKEN',
            claim,
        });
    }
    return value;
}
function parseScopedClaims(token) {
    const scopeLevel = token.scopeLevel;
    if (scopeLevel !== 'company' && scopeLevel !== 'branch') {
        throw new https_1.HttpsError('failed-precondition', 'Scoped claim scopeLevel is missing or invalid.', {
            code: 'INVALID_SCOPED_TOKEN',
            claim: 'scopeLevel',
        });
    }
    if (!Array.isArray(token.permissions) || token.permissions.some((item) => typeof item !== 'string')) {
        throw new https_1.HttpsError('failed-precondition', 'Scoped permissions are missing or invalid.', {
            code: 'INVALID_SCOPED_TOKEN',
            claim: 'permissions',
        });
    }
    return {
        pv: requiredVersion(token.pv, 'pv'),
        sv: requiredVersion(token.sv, 'sv'),
        cid: requiredString(token.cid, 'cid'),
        entityId: requiredString(token.entityId, 'entityId'),
        jobRoleId: requiredString(token.jobRoleId, 'jobRoleId'),
        scopeId: requiredString(token.scopeId, 'scopeId'),
        scopeLevel,
        permissions: Array.from(new Set(token.permissions)),
    };
}
function assertResourceScope(claims, resource, options = {}) {
    if (resource.companyId !== claims.cid) {
        throw new https_1.HttpsError('permission-denied', 'Resource is outside the active company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    if (claims.scopeLevel === 'branch' &&
        (typeof resource.branchId !== 'string' || resource.branchId !== claims.entityId)) {
        throw new https_1.HttpsError('permission-denied', 'Resource is outside the active branch.', {
            code: 'FOREIGN_BRANCH_RESOURCE',
        });
    }
    if (options.requireOwnerId && resource.ownerId !== options.requireOwnerId) {
        throw new https_1.HttpsError('permission-denied', 'Resource ownership does not match the caller.', {
            code: 'RESOURCE_OWNER_MISMATCH',
        });
    }
}
function assertScopedPermission(claims, requiredPermission) {
    if (!claims.permissions.includes(requiredPermission)) {
        throw new https_1.HttpsError('permission-denied', 'The active scope does not grant this operation.', {
            code: 'PERMISSION_DENIED',
            requiredPermission,
        });
    }
}
