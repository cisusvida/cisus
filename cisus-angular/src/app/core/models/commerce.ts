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
  imagePath: string | null;
  imageUrl: string | null;
  basePrice: number;
  currency: string;
  enabled?: boolean;
  commercialModel?: string;
  fixedPrice?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  commissionRate?: number;
}

export type PublicMediaKind = 'home' | 'product';

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
