"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const https_1 = require("firebase-functions/v2/https");
const scoped_claims_1 = require("./scoped-claims");
const validToken = {
    pv: 3,
    sv: 7,
    cid: 'company-a',
    entityId: 'branch-a',
    jobRoleId: 'sales_associate',
    scopeId: 'scope-a',
    scopeLevel: 'branch',
    permissions: ['sales.create', 'inventory.read'],
};
function errorCode(action) {
    var _a;
    try {
        action();
        return undefined;
    }
    catch (error) {
        strict_1.default.ok(error instanceof https_1.HttpsError);
        return (_a = error.details) === null || _a === void 0 ? void 0 : _a.code;
    }
}
(0, node_test_1.default)('accepts a complete scoped token and granted permission', () => {
    const claims = (0, scoped_claims_1.parseScopedClaims)(validToken);
    strict_1.default.equal(claims.cid, 'company-a');
    strict_1.default.doesNotThrow(() => (0, scoped_claims_1.assertScopedPermission)(claims, 'sales.create'));
});
(0, node_test_1.default)('denies stale or incomplete version claims before domain access', () => {
    strict_1.default.equal(errorCode(() => (0, scoped_claims_1.parseScopedClaims)(Object.assign(Object.assign({}, validToken), { pv: 0 }))), 'INVALID_SCOPED_TOKEN');
    strict_1.default.equal(errorCode(() => (0, scoped_claims_1.parseScopedClaims)(Object.assign(Object.assign({}, validToken), { sv: undefined }))), 'INVALID_SCOPED_TOKEN');
});
(0, node_test_1.default)('denies a resource from a foreign company', () => {
    const claims = (0, scoped_claims_1.parseScopedClaims)(validToken);
    strict_1.default.equal(errorCode(() => (0, scoped_claims_1.assertResourceScope)(claims, { companyId: 'company-b', branchId: 'branch-a' })), 'FOREIGN_COMPANY_RESOURCE');
});
(0, node_test_1.default)('denies a resource from another branch in branch scope', () => {
    const claims = (0, scoped_claims_1.parseScopedClaims)(validToken);
    strict_1.default.equal(errorCode(() => (0, scoped_claims_1.assertResourceScope)(claims, { companyId: 'company-a', branchId: 'branch-b' })), 'FOREIGN_BRANCH_RESOURCE');
});
(0, node_test_1.default)('denies a missing granular permission', () => {
    const claims = (0, scoped_claims_1.parseScopedClaims)(validToken);
    strict_1.default.equal(errorCode(() => (0, scoped_claims_1.assertScopedPermission)(claims, 'sales.refund')), 'PERMISSION_DENIED');
});
