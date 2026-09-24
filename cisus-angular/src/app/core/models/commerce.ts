export interface CompanyWorkspace {
  company: { id: string; name: string; status: string };
  units: Array<{ id: string; name: string; type: 'company' | 'branch'; status: string }>;
  subscription: {
    status: string;
    planId: string | null;
    entitlements: string[];
    limits: { seats?: { max?: number } };
    subscriptionVersionNonce: number;
  };
  agreement: {
    commercialModels: string[];
    pricingAuthority: 'cisus_fixed' | 'cisus_bands' | 'company_freedom';
    currency: string;
    contractVersion: number;
  };
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  materialLabel?: string | null;
  shortDescription?: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  sceneImagePath?: string | null;
  sceneImageUrl?: string | null;
  thumbnailImagePath?: string | null;
  thumbnailImageUrl?: string | null;
  relatedImagePath?: string | null;
  relatedImageUrl?: string | null;
  relatedImageSource?: RelatedImageSource;
  sceneLayers?: MediaLayer[];
  sceneAnimation?: MediaAnimation;
  sceneAnimationTarget?: MediaAnimationTarget;
  sceneAnimationLayerKeys?: MediaAnimationLayerKey[];
  customization?: ProductCustomization;
  customizationImagePath?: string | null;
  customizationImageUrl?: string | null;
  basePrice: number;
  currency: string;
  enabled?: boolean;
  commercialModel?: string;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  commissionRate?: number;
}

export type MediaAnimation = 'none' | 'appear' | 'disappear';
export type MediaAnimationTarget = 'first' | 'last' | 'both';
export type MediaAnimationLayerKey =
  | 'hero'
  | 'hero_carving'
  | `hero_layer_${3 | 4 | 5 | 6}`
  | 'product_scene'
  | `product_scene_${2 | 3 | 4 | 5 | 6}`;
export type RelatedImageSource =
  | 'auto'
  | 'product'
  | 'product_scene'
  | 'product_thumbnail'
  | 'product_customization'
  | 'product_related'
  | `product_scene_${2 | 3 | 4 | 5 | 6}`;
export interface MediaAnimationConfiguration {
  animation: MediaAnimation;
  animationLayerKeys: MediaAnimationLayerKey[];
}
export interface ProductCustomization {
  enabled: boolean;
  label: string;
}
export interface MediaLayer {
  kind: PublicMediaKind;
  targetId: string;
  path?: string | null;
  url: string | null;
}
export type PublicMediaKind =
  | 'home'
  | 'process'
  | 'product'
  | 'product_scene'
  | 'product_thumbnail'
  | 'product_customization'
  | 'product_related'
  | `product_scene_${2 | 3 | 4 | 5 | 6}`;

export interface PublicMediaReference {
  kind: PublicMediaKind;
  targetId: string;
  expectedPath: string;
}

export interface PublicMediaUrl {
  key: string;
  path: string;
  url: string;
  expiresAt: number;
  generation: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  branchId: string;
  productId: string;
  quantity: number;
}

export interface SaleSummary {
  id: string;
  companyId: string;
  branchId: string;
  customerId: string | null;
  sellerUid: string;
  status: string;
  total: number;
  currency: string;
  commissionTotal: number;
}

export interface AccessContractSummary {
  id: string;
  uid: string;
  companyId: string;
  scopeUnitId: string;
  jobRoleId: string;
  status: 'active' | 'suspended';
}

export interface PromotionSummary {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  productIds: string[];
  discountPercent: number;
  marginBonusRate: number;
}
