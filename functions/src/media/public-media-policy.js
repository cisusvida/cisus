"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_MEDIA_ROLES = exports.HOME_ASSETS = void 0;
exports.parseMediaRequests = parseMediaRequests;
exports.allowedMediaPath = allowedMediaPath;

exports.HOME_ASSETS = Object.freeze({ hero: 'heroImagePath' });
exports.PLATFORM_MEDIA_ROLES = new Set([
    'platform_admin',
    'cisus_commercial_admin',
    'cisus_operations',
]);

function validTargetId(value) {
    return typeof value === 'string' && /^[A-Za-z0-9_-]{3,180}$/.test(value);
}

function parseMediaRequests(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 50) {
        throw new TypeError('items must contain between 1 and 50 media references.');
    }
    const unique = new Map();
    for (const raw of value) {
        if (!raw || typeof raw !== 'object') throw new TypeError('Invalid media reference.');
        const kind = raw.kind;
        const targetId = raw.targetId;
        if (kind === 'home') {
            if (typeof targetId !== 'string' || !(targetId in exports.HOME_ASSETS)) {
                throw new TypeError('Unknown home media reference.');
            }
        } else if (kind === 'product') {
            if (!validTargetId(targetId)) throw new TypeError('Invalid product media reference.');
        } else {
            throw new TypeError('Unknown media kind.');
        }
        unique.set(`${kind}:${targetId}`, { kind, targetId });
    }
    return [...unique.values()];
}

function allowedMediaPath(kind, targetId, path) {
    if (typeof path !== 'string' || !path.endsWith('.webp')) return false;
    if (kind === 'home') return path.startsWith(`public-media/home/${targetId}/`);
    if (kind === 'product') return path.startsWith(`public-media/products/${targetId}/`);
    return false;
}
