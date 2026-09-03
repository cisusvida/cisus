"use strict";
const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
    PLATFORM_MEDIA_ROLES,
    allowedMediaPath,
    parseMediaRequests,
} = require('./public-media-policy');

test('public media requests accept only known home assets and valid product ids', () => {
    assert.deepEqual(parseMediaRequests([
        { kind: 'home', targetId: 'hero' },
        { kind: 'product', targetId: 'product_alpha' },
        { kind: 'product', targetId: 'product_alpha' },
    ]), [
        { kind: 'home', targetId: 'hero' },
        { kind: 'product', targetId: 'product_alpha' },
    ]);
    assert.throws(() => parseMediaRequests([{ kind: 'home', targetId: 'arbitrary' }]));
    assert.throws(() => parseMediaRequests([{ kind: 'product', targetId: '../private' }]));
});

test('public media paths cannot escape their exact asset scope', () => {
    assert.equal(allowedMediaPath('home', 'hero', 'public-media/home/hero/image.webp'), true);
    assert.equal(allowedMediaPath('product', 'product_alpha', 'public-media/products/product_alpha/image.webp'), true);
    assert.equal(allowedMediaPath('product', 'product_alpha', 'public-media/products/product_beta/image.webp'), false);
    assert.equal(allowedMediaPath('home', 'hero', 'companies/company_alpha/private.webp'), false);
});

test('partner-company roles cannot administer platform media', () => {
    assert.equal(PLATFORM_MEDIA_ROLES.has('cisus_operations'), true);
    assert.equal(PLATFORM_MEDIA_ROLES.has('company_admin'), false);
    assert.equal(PLATFORM_MEDIA_ROLES.has('branch_manager'), false);
});
