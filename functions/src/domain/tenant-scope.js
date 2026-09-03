"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertBranchInScope = assertBranchInScope;
exports.requiredDocumentId = requiredDocumentId;
exports.requiredPositiveInteger = requiredPositiveInteger;
const https_1 = require("firebase-functions/v2/https");
const firebase_admin_1 = require("../shared/firebase-admin");
async function assertBranchInScope(context, branchId) {
    var _a, _b, _c;
    if (typeof branchId !== 'string' || !/^[A-Za-z0-9_-]{3,180}$/.test(branchId)) {
        throw new https_1.HttpsError('invalid-argument', 'branchId is invalid.', { code: 'INVALID_BRANCH_ID' });
    }
    if (context.scopeLevel === 'branch' && branchId !== context.entityId) {
        throw new https_1.HttpsError('permission-denied', 'Branch is outside the active scope.', {
            code: 'FOREIGN_BRANCH_RESOURCE',
        });
    }
    const branch = await firebase_admin_1.firestore.collection('business_units').doc(branchId).get();
    if (!branch.exists ||
        ((_a = branch.data()) === null || _a === void 0 ? void 0 : _a.companyId) !== context.cid ||
        ((_b = branch.data()) === null || _b === void 0 ? void 0 : _b.type) !== 'branch' ||
        ((_c = branch.data()) === null || _c === void 0 ? void 0 : _c.status) !== 'active') {
        throw new https_1.HttpsError('permission-denied', 'Branch is outside the active company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    return branchId;
}
function requiredDocumentId(value, field) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,180}$/.test(value)) {
        throw new https_1.HttpsError('invalid-argument', `${field} is invalid.`, { code: 'INVALID_ID', field });
    }
    return value;
}
function requiredPositiveInteger(value, field) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) {
        throw new https_1.HttpsError('invalid-argument', `${field} must be a positive integer.`, {
            code: 'INVALID_QUANTITY',
            field,
        });
    }
    return value;
}
