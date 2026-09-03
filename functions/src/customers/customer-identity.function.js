"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCustomerByRut = exports.updateCustomer = exports.createCustomer = void 0;
const https_1 = require("firebase-functions/v2/https");
const node_crypto_1 = require("node:crypto");
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
function cleanRut(raw) {
    return typeof raw === 'string' ? raw.replace(/[^0-9kK]/g, '').toUpperCase() : '';
}
function validateRut(raw) {
    const cleaned = cleanRut(raw);
    if (cleaned.length < 2)
        return false;
    const body = cleaned.slice(0, -1);
    const verifier = cleaned.slice(-1);
    let multiplier = 2;
    let sum = 0;
    for (let index = body.length - 1; index >= 0; index--) {
        sum += Number.parseInt(body.charAt(index), 10) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expected = 11 - (sum % 11);
    return verifier === (expected === 11 ? '0' : expected === 10 ? 'K' : String(expected));
}
function formatRut(cleaned) {
    const body = cleaned.slice(0, -1);
    const verifier = cleaned.slice(-1);
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`;
}
function normalizePhone(raw) {
    if (raw === null || raw === undefined || raw === '')
        return null;
    if (typeof raw !== 'string')
        throw new https_1.HttpsError('invalid-argument', 'phone is invalid.');
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
        throw new https_1.HttpsError('invalid-argument', 'phone is invalid.');
    }
    return digits;
}
exports.createCustomer = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'customers.create', entitlement: 'customer_identity' }, async (data, context) => {
    var _a, _b;
    const fullName = (_a = data.fullName) === null || _a === void 0 ? void 0 : _a.trim();
    if (!fullName || fullName.length < 3 || fullName.length > 160) {
        throw new https_1.HttpsError('invalid-argument', 'fullName is invalid.');
    }
    const normalizedRut = data.rut ? cleanRut(data.rut) : null;
    if (normalizedRut && !validateRut(normalizedRut)) {
        throw new https_1.HttpsError('invalid-argument', 'RUT is invalid.', { code: 'INVALID_RUT' });
    }
    const phoneNormalized = normalizePhone(data.phone);
    const email = ((_b = data.email) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase()) || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'email is invalid.');
    }
    const documentRef = normalizedRut
        ? firebase_admin_1.firestore.collection('customer_documents').doc(`cl_rut:${normalizedRut}`)
        : undefined;
    const generatedCustomerRef = firebase_admin_1.firestore.collection('customers').doc();
    const customerId = await firebase_admin_1.firestore.runTransaction(async (transaction) => {
        var _a;
        let resolvedCustomerId = generatedCustomerRef.id;
        if (documentRef) {
            const existingDocument = await transaction.get(documentRef);
            if (existingDocument.exists) {
                const existingCustomerId = (_a = existingDocument.data()) === null || _a === void 0 ? void 0 : _a.customerId;
                if (typeof existingCustomerId !== 'string') {
                    throw new https_1.HttpsError('failed-precondition', 'The customer identity registry is invalid.', {
                        code: 'INVALID_CUSTOMER_DOCUMENT',
                    });
                }
                resolvedCustomerId = existingCustomerId;
            }
        }
        const customerRef = firebase_admin_1.firestore.collection('customers').doc(resolvedCustomerId);
        const linkRef = firebase_admin_1.firestore
            .collection('customer_company_links')
            .doc(`${context.cid}__${resolvedCustomerId}`);
        const [customerSnapshot, linkSnapshot] = await Promise.all([
            transaction.get(customerRef),
            transaction.get(linkRef),
        ]);
        if (!customerSnapshot.exists) {
            transaction.create(customerRef, {
                fullName,
                phoneNormalized,
                email,
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
                updatedAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
        }
        transaction.set(linkRef, Object.assign(Object.assign({ companyId: context.cid, customerId: resolvedCustomerId, fullName,
            phoneNormalized, status: 'active', createdBy: context.uid }, (linkSnapshot.exists ? {} : { createdAt: firebase_admin_1.FieldValue.serverTimestamp() })), { updatedAt: firebase_admin_1.FieldValue.serverTimestamp() }), { merge: true });
        if (documentRef && normalizedRut && resolvedCustomerId === generatedCustomerRef.id) {
            transaction.create(documentRef, {
                customerId: resolvedCustomerId,
                type: 'cl_rut',
                normalizedValue: normalizedRut,
                valueHash: (0, node_crypto_1.createHash)('sha256').update(normalizedRut).digest('hex'),
                createdAt: firebase_admin_1.FieldValue.serverTimestamp(),
            });
        }
        return resolvedCustomerId;
    });
    return { customerId };
});
exports.updateCustomer = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'customers.update', entitlement: 'customer_identity' }, async (data, context) => {
    var _a, _b, _c;
    const customerId = (_a = data.customerId) === null || _a === void 0 ? void 0 : _a.trim();
    if (!customerId || !/^[A-Za-z0-9_-]{3,180}$/.test(customerId)) {
        throw new https_1.HttpsError('invalid-argument', 'customerId is invalid.');
    }
    const linkRef = firebase_admin_1.firestore.collection('customer_company_links').doc(`${context.cid}__${customerId}`);
    const link = await linkRef.get();
    if (!link.exists || ((_b = link.data()) === null || _b === void 0 ? void 0 : _b.status) !== 'active') {
        throw new https_1.HttpsError('permission-denied', 'Customer is outside the active company.', {
            code: 'FOREIGN_COMPANY_RESOURCE',
        });
    }
    const updates = { updatedAt: firebase_admin_1.FieldValue.serverTimestamp() };
    if (data.fullName !== undefined) {
        const fullName = data.fullName.trim();
        if (fullName.length < 3 || fullName.length > 160) {
            throw new https_1.HttpsError('invalid-argument', 'fullName is invalid.');
        }
        updates.fullName = fullName;
    }
    if (data.phone !== undefined)
        updates.phoneNormalized = normalizePhone(data.phone);
    if (data.email !== undefined)
        updates.email = ((_c = data.email) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) || null;
    await Promise.all([
        firebase_admin_1.firestore.collection('customers').doc(customerId).set(updates, { merge: true }),
        linkRef.set(updates, { merge: true }),
    ]);
    return { customerId };
});
exports.findCustomerByRut = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'customers.read', entitlement: 'customer_identity' }, async (data, context) => {
    var _a, _b, _c, _d, _e, _f;
    const normalizedRut = cleanRut(data.rut);
    if (!validateRut(normalizedRut)) {
        throw new https_1.HttpsError('invalid-argument', 'RUT is invalid.', { code: 'INVALID_RUT' });
    }
    const document = await firebase_admin_1.firestore.collection('customer_documents').doc(`cl_rut:${normalizedRut}`).get();
    const customerId = (_a = document.data()) === null || _a === void 0 ? void 0 : _a.customerId;
    if (typeof customerId !== 'string')
        return { customer: null };
    const link = await firebase_admin_1.firestore
        .collection('customer_company_links')
        .doc(`${context.cid}__${customerId}`)
        .get();
    if (!link.exists || ((_b = link.data()) === null || _b === void 0 ? void 0 : _b.status) !== 'active')
        return { customer: null };
    return {
        customer: {
            customerId,
            fullName: (_d = (_c = link.data()) === null || _c === void 0 ? void 0 : _c.fullName) !== null && _d !== void 0 ? _d : 'Cliente',
            phone: (_f = (_e = link.data()) === null || _e === void 0 ? void 0 : _e.phoneNormalized) !== null && _f !== void 0 ? _f : null,
            rut: formatRut(normalizedRut),
        },
    };
});
