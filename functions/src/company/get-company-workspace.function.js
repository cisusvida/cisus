"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyWorkspace = void 0;
const firebase_admin_1 = require("../shared/firebase-admin");
const define_scoped_callable_1 = require("../security/define-scoped-callable");
exports.getCompanyWorkspace = (0, define_scoped_callable_1.defineScopedCallable)({ permission: 'companies.read' }, async (_data, context) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const [companySnapshot, unitsSnapshot, subscriptionSnapshot, agreementSnapshot] = await Promise.all([
        firebase_admin_1.firestore.collection('companies').doc(context.cid).get(),
        firebase_admin_1.firestore.collection('business_units').where('companyId', '==', context.cid).get(),
        firebase_admin_1.firestore.collection('subscription_entitlements').doc(context.cid).get(),
        firebase_admin_1.firestore.collection('partner_agreements').doc(context.cid).get(),
    ]);
    const visibleUnits = unitsSnapshot.docs
        .filter((document) => context.scopeLevel === 'company' || document.id === context.entityId)
        .map((document) => {
        var _a, _b, _c;
        return ({
            id: document.id,
            name: (_a = document.data().name) !== null && _a !== void 0 ? _a : 'Unidad',
            type: (_b = document.data().type) !== null && _b !== void 0 ? _b : 'branch',
            status: (_c = document.data().status) !== null && _c !== void 0 ? _c : 'inactive',
        });
    });
    const subscription = (_a = subscriptionSnapshot.data()) !== null && _a !== void 0 ? _a : {};
    const agreement = (_b = agreementSnapshot.data()) !== null && _b !== void 0 ? _b : {};
    return {
        company: {
            id: companySnapshot.id,
            name: (_d = (_c = companySnapshot.data()) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : 'Empresa',
            status: (_f = (_e = companySnapshot.data()) === null || _e === void 0 ? void 0 : _e.status) !== null && _f !== void 0 ? _f : 'inactive',
        },
        units: visibleUnits,
        subscription: {
            status: (_g = subscription.status) !== null && _g !== void 0 ? _g : 'inactive',
            planId: (_h = subscription.planId) !== null && _h !== void 0 ? _h : null,
            entitlements: Array.isArray(subscription.entitlements) ? subscription.entitlements : [],
            limits: (_j = subscription.limits) !== null && _j !== void 0 ? _j : {},
            subscriptionVersionNonce: (_k = subscription.subscriptionVersionNonce) !== null && _k !== void 0 ? _k : 0,
        },
        agreement: {
            commercialModels: Array.isArray(agreement.commercialModels)
                ? agreement.commercialModels
                : [],
            pricingAuthority: (_l = agreement.pricingAuthority) !== null && _l !== void 0 ? _l : 'cisus_fixed',
            currency: (_m = agreement.currency) !== null && _m !== void 0 ? _m : 'CLP',
            contractVersion: (_o = agreement.contractVersion) !== null && _o !== void 0 ? _o : 0,
        },
    };
});
