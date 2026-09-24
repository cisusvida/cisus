"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_INTERNAL_ROLES = exports.ROLE_POLICIES = exports.CISUS_ENTITLEMENTS = exports.CISUS_PERMISSIONS = void 0;
exports.canAssignRole = canAssignRole;
exports.isCisusRole = isCisusRole;
exports.CISUS_PERMISSIONS = [
    'companies.read',
    'companies.update',
    'branches.read',
    'branches.manage',
    'access_contracts.read',
    'access_contracts.manage',
    'subscriptions.read',
    'subscriptions.manage',
    'catalog.read',
    'catalog.manage',
    'public_media.manage',
    'pricing.read',
    'pricing.manage',
    'pricing.override',
    'promotions.read',
    'promotions.manage',
    'customers.read',
    'customers.create',
    'customers.update',
    'inventory.read',
    'inventory.receive',
    'inventory.adjust',
    'inventory.transfer',
    'sales.read',
    'sales.create',
    'sales.void',
    'sales.refund',
    'settlements.read',
    'settlements.manage',
    'audit.read',
];
exports.CISUS_ENTITLEMENTS = [
    'multi_branch',
    'customer_identity',
    'advanced_pricing',
    'margin_promotions',
    'stock_transfers',
    'advanced_analytics',
];
const operationalRead = [
    'companies.read',
    'branches.read',
    'catalog.read',
    'pricing.read',
    'promotions.read',
    'customers.read',
    'inventory.read',
    'sales.read',
];
exports.ROLE_POLICIES = {
    platform_admin: { permissions: exports.CISUS_PERMISSIONS, seatRequired: false },
    cisus_commercial_admin: {
        permissions: [
            ...operationalRead,
            'companies.update',
            'subscriptions.read',
            'subscriptions.manage',
            'catalog.manage',
            'public_media.manage',
            'pricing.manage',
            'pricing.override',
            'promotions.manage',
            'settlements.read',
            'settlements.manage',
            'audit.read',
        ],
        seatRequired: true,
    },
    cisus_operations: {
        permissions: [
            ...operationalRead,
            'catalog.manage',
            'public_media.manage',
            'inventory.receive',
            'inventory.adjust',
            'inventory.transfer',
            'sales.void',
            'sales.refund',
            'audit.read',
        ],
        seatRequired: true,
    },
    cisus_designer: {
        permissions: [
            'companies.read',
            'catalog.read',
            'public_media.manage',
        ],
        seatRequired: true,
    },
    company_admin: {
        permissions: [
            ...operationalRead,
            'companies.update',
            'branches.manage',
            'access_contracts.read',
            'access_contracts.manage',
            'subscriptions.read',
            'pricing.manage',
            'promotions.manage',
            'customers.create',
            'customers.update',
            'inventory.receive',
            'inventory.adjust',
            'inventory.transfer',
            'sales.create',
            'sales.void',
            'sales.refund',
            'settlements.read',
            'audit.read',
        ],
        seatRequired: true,
    },
    branch_manager: {
        permissions: [
            ...operationalRead,
            'customers.create',
            'customers.update',
            'inventory.receive',
            'inventory.adjust',
            'inventory.transfer',
            'sales.create',
            'sales.void',
            'sales.refund',
            'settlements.read',
        ],
        seatRequired: true,
    },
    sales_associate: {
        permissions: [
            'companies.read',
            'branches.read',
            'catalog.read',
            'pricing.read',
            'promotions.read',
            'customers.read',
            'customers.create',
            'customers.update',
            'inventory.read',
            'sales.read',
            'sales.create',
        ],
        seatRequired: true,
    },
    inventory_operator: {
        permissions: [
            'companies.read',
            'branches.read',
            'catalog.read',
            'inventory.read',
            'inventory.receive',
            'inventory.adjust',
            'inventory.transfer',
        ],
        seatRequired: true,
    },
    finance_viewer: {
        permissions: [
            'companies.read',
            'branches.read',
            'catalog.read',
            'pricing.read',
            'sales.read',
            'settlements.read',
            'audit.read',
        ],
        seatRequired: true,
    },
};
exports.PLATFORM_INTERNAL_ROLES = new Set([
    'cisus_commercial_admin',
    'cisus_operations',
    'cisus_designer',
]);
function isCisusRole(value) {
    return typeof value === 'string' && value in exports.ROLE_POLICIES;
}
function canAssignRole(actorRole, targetRole) {
    if (!isCisusRole(targetRole) || targetRole === 'platform_admin') return false;
    return !exports.PLATFORM_INTERNAL_ROLES.has(targetRole) || actorRole === 'platform_admin';
}
