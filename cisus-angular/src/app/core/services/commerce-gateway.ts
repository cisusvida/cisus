import { inject, Service } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import type {
  CatalogProduct,
  CompanyWorkspace,
  AccessContractSummary,
  InventoryItem,
  PromotionSummary,
  SaleSummary,
} from '../models/commerce';
import { FirebaseClient } from './firebase-client';
import { PublicMediaUrlService } from './public-media-url';

@Service()
export class CommerceGateway {
  private readonly functions = inject(FirebaseClient).functions;
  private readonly publicMedia = inject(PublicMediaUrlService);

  async listPublicProducts(): Promise<CatalogProduct[]> {
    const products = (
      await this.call<undefined, { products: CatalogProduct[] }>('listPublicProducts', undefined)
    ).products;
    try {
      return await this.publicMedia.attachProductUrls(products);
    } catch {
      return products.map((product) => ({ ...product, imageUrl: null }));
    }
  }

  getCompanyWorkspace(): Promise<CompanyWorkspace> {
    return this.call<undefined, CompanyWorkspace>('getCompanyWorkspace', undefined);
  }

  async listCompanyCatalog(): Promise<CatalogProduct[]> {
    const products = (
      await this.call<undefined, { products: CatalogProduct[] }>('listCompanyCatalog', undefined)
    ).products;
    try {
      return await this.publicMedia.attachProductUrls(products);
    } catch {
      return products.map((product) => ({ ...product, imageUrl: null }));
    }
  }

  async listInventory(branchId?: string): Promise<InventoryItem[]> {
    return (
      await this.call<{ branchId?: string }, { inventory: InventoryItem[] }>('listInventory', {
        branchId,
      })
    ).inventory;
  }

  async listSales(branchId?: string): Promise<SaleSummary[]> {
    return (
      await this.call<{ branchId?: string }, { sales: SaleSummary[] }>('listSales', { branchId })
    ).sales;
  }

  receiveInventory(data: {
    branchId: string;
    productId: string;
    quantity: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ movementId: string; quantityAfter: number }> {
    return this.call('receiveInventory', data);
  }

  createCustomer(data: {
    fullName: string;
    rut?: string;
    phone?: string;
    email?: string;
  }): Promise<{ customerId: string }> {
    return this.call('createCustomer', data);
  }

  createSale(data: {
    branchId: string;
    customerId?: string;
    items: Array<{ productId: string; quantity: number; requestedUnitPrice?: number }>;
    idempotencyKey: string;
  }): Promise<{ saleId: string; total: number; currency: string }> {
    return this.call('createSale', data);
  }

  async listAccessContracts(): Promise<AccessContractSummary[]> {
    return (
      await this.call<undefined, { contracts: AccessContractSummary[] }>(
        'listAccessContracts',
        undefined,
      )
    ).contracts;
  }

  manageAccessContract(data: {
    contractId?: string;
    targetUid: string;
    entityId: string;
    jobRoleId: string;
    status: 'active' | 'suspended';
  }): Promise<{ contractId: string; status: string }> {
    return this.call('manageAccessContract', data);
  }

  manageBusinessUnit(data: {
    branchId: string;
    name: string;
    status: 'active' | 'inactive';
  }): Promise<{ branchId: string; status: string }> {
    return this.call('manageBusinessUnit', data);
  }

  manageCompanyProductOffer(data: {
    productId: string;
    enabled: boolean;
    commercialModel: 'wholesale' | 'consignment' | 'commission';
    fixedPrice: number | null;
    minPrice: number | null;
    maxPrice: number | null;
    commissionRate: number;
  }): Promise<{ offerId: string }> {
    return this.call('manageCompanyProductOffer', data);
  }

  uploadPublicMedia(data: {
    kind: 'home' | 'product';
    targetId: string;
    fileBase64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  }): Promise<{ media: { path: string; url: string; expiresAt: number; generation: string } }> {
    return this.call('uploadPublicMedia', data);
  }

  async listPromotions(): Promise<PromotionSummary[]> {
    return (
      await this.call<undefined, { promotions: PromotionSummary[] }>('listPromotions', undefined)
    ).promotions;
  }

  managePromotion(data: {
    name: string;
    status: 'active' | 'inactive';
    productIds: string[];
    discountPercent: number;
    marginBonusRate: number;
  }): Promise<{ promotionId: string; status: string }> {
    return this.call('managePromotion', data);
  }

  adjustInventory(data: {
    branchId: string;
    productId: string;
    quantityDelta: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ movementId: string; quantityAfter: number }> {
    return this.call('adjustInventory', data);
  }

  transferInventory(data: {
    fromBranchId: string;
    toBranchId: string;
    productId: string;
    quantity: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ transferId: string }> {
    return this.call('transferInventory', data);
  }

  refundSale(data: {
    saleId: string;
    reason: string;
    idempotencyKey: string;
  }): Promise<{ saleId: string; status: 'refunded' }> {
    return this.call('refundSale', data);
  }

  findCustomerByRut(rut: string): Promise<{ customer: Record<string, unknown> | null }> {
    return this.call('findCustomerByRut', { rut });
  }

  private async call<Request, Response>(name: string, data: Request): Promise<Response> {
    return (await httpsCallable<Request, Response>(this.functions, name)(data)).data;
  }
}
