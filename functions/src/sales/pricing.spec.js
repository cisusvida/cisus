"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const https_1 = require("firebase-functions/v2/https");
const pricing_1 = require("./pricing");
(0, node_test_1.default)('Cisus fixed pricing ignores a seller supplied price', () => {
    strict_1.default.equal((0, pricing_1.calculateAuthorizedUnitPrice)({ authority: 'cisus_fixed', basePrice: 10000, requestedPrice: 1 }), 10000);
});
(0, node_test_1.default)('band pricing accepts only values inside the agreement', () => {
    strict_1.default.equal((0, pricing_1.calculateAuthorizedUnitPrice)({
        authority: 'cisus_bands',
        basePrice: 10000,
        minPrice: 9000,
        maxPrice: 12000,
        requestedPrice: 11000,
    }), 11000);
    strict_1.default.throws(() => (0, pricing_1.calculateAuthorizedUnitPrice)({
        authority: 'cisus_bands',
        basePrice: 10000,
        minPrice: 9000,
        maxPrice: 12000,
        requestedPrice: 8000,
    }), https_1.HttpsError);
});
(0, node_test_1.default)('promotion discount is calculated by the backend', () => {
    strict_1.default.equal((0, pricing_1.calculateAuthorizedUnitPrice)({ authority: 'company_freedom', basePrice: 10000, discountPercent: 10 }), 9000);
});
