"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAuthorizedUnitPrice = calculateAuthorizedUnitPrice;
const https_1 = require("firebase-functions/v2/https");
function calculateAuthorizedUnitPrice(input) {
    var _a, _b, _c, _d, _e;
    const configured = (_a = input.fixedPrice) !== null && _a !== void 0 ? _a : input.basePrice;
    const requested = (_b = input.requestedPrice) !== null && _b !== void 0 ? _b : configured;
    let price;
    if (input.authority === 'cisus_fixed') {
        price = configured;
    }
    else if (input.authority === 'cisus_bands') {
        const minimum = (_c = input.minPrice) !== null && _c !== void 0 ? _c : configured;
        const maximum = (_d = input.maxPrice) !== null && _d !== void 0 ? _d : configured;
        if (requested < minimum || requested > maximum) {
            throw new https_1.HttpsError('failed-precondition', 'Requested price is outside the authorized band.', {
                code: 'PRICE_OUTSIDE_AUTHORIZED_BAND',
                minimum,
                maximum,
            });
        }
        price = requested;
    }
    else {
        price = requested;
    }
    if (!Number.isSafeInteger(price) || price < 0) {
        throw new https_1.HttpsError('invalid-argument', 'Unit price must be a non-negative integer.');
    }
    const discount = Math.min(Math.max((_e = input.discountPercent) !== null && _e !== void 0 ? _e : 0, 0), 100);
    return Math.round(price * (1 - discount / 100));
}
