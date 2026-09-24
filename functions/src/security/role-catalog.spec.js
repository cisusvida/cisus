"use strict";
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { canAssignRole, ROLE_POLICIES } = require('./role-catalog');

test('designer has only the permissions required to manage public media', () => {
    assert.deepEqual(ROLE_POLICIES.cisus_designer.permissions, [
        'companies.read',
        'catalog.read',
        'public_media.manage',
    ]);
    assert.equal(ROLE_POLICIES.cisus_designer.seatRequired, true);
});

test('only platform administrators can assign internal Cisus roles', () => {
    assert.equal(canAssignRole('platform_admin', 'cisus_designer'), true);
    assert.equal(canAssignRole('company_admin', 'cisus_designer'), false);
    assert.equal(canAssignRole('company_admin', 'cisus_operations'), false);
    assert.equal(canAssignRole('company_admin', 'sales_associate'), true);
    assert.equal(canAssignRole('platform_admin', 'platform_admin'), false);
    assert.equal(canAssignRole('platform_admin', 'unknown_role'), false);
});
