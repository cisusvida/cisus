import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, min, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import type {
  CatalogProduct,
  CompanyWorkspace,
  AccessContractSummary,
  InventoryItem,
  PromotionSummary,
  SaleSummary,
} from '../../../../core/models/commerce';
import { Auth } from '../../../../core/services/auth';
import { CommerceGateway } from '../../../../core/services/commerce-gateway';
import { Toast } from '../../../../core/services/toast';

type WorkspaceTab = 'overview' | 'inventory' | 'sales' | 'customers' | 'administration';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly auth = inject(Auth);
  private readonly commerce = inject(CommerceGateway);
  private readonly toast = inject(Toast);
  protected readonly tab = signal<WorkspaceTab>('overview');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly workspace = signal<CompanyWorkspace | undefined>(undefined);
  protected readonly catalog = signal<CatalogProduct[]>([]);
  protected readonly inventory = signal<InventoryItem[]>([]);
  protected readonly sales = signal<SaleSummary[]>([]);
  protected readonly accessContracts = signal<AccessContractSummary[]>([]);
  protected readonly promotions = signal<PromotionSummary[]>([]);
  protected readonly mediaProductId = signal('');
  protected readonly mediaUploading = signal(false);
  protected readonly branchId = signal(this.auth.activeContext()?.entityId ?? '');
  protected readonly stockUnits = computed(() =>
    this.inventory().reduce((total, item) => total + Number(item.quantity || 0), 0),
  );
  protected readonly salesTotal = computed(() =>
    this.sales().reduce((total, sale) => total + Number(sale.total || 0), 0),
  );

  protected readonly saleModel = signal({ productId: '', quantity: 1, customerId: '' });
  protected readonly saleForm = form(this.saleModel, (path) => {
    required(path.productId, { message: 'Selecciona un producto.' });
    min(path.quantity, 1, { message: 'La cantidad mínima es 1.' });
  });
  protected readonly receiptModel = signal({ productId: '', quantity: 1, reason: '' });
  protected readonly receiptForm = form(this.receiptModel, (path) => {
    required(path.productId, { message: 'Selecciona un producto.' });
    min(path.quantity, 1, { message: 'La cantidad mínima es 1.' });
    minLength(path.reason, 3, { message: 'Explica el origen del stock.' });
  });
  protected readonly customerModel = signal({ fullName: '', rut: '', phone: '', email: '' });
  protected readonly customerForm = form(this.customerModel, (path) => {
    minLength(path.fullName, 3, { message: 'Ingresa el nombre del comprador.' });
  });
  protected readonly branchModel = signal({ branchId: '', name: '' });
  protected readonly branchForm = form(this.branchModel, (path) => {
    minLength(path.branchId, 3, { message: 'Usa un identificador de al menos 3 caracteres.' });
    minLength(path.name, 3, { message: 'Ingresa el nombre de la sucursal.' });
  });
  protected readonly accessModel = signal({
    targetUid: '',
    entityId: '',
    jobRoleId: 'sales_associate',
  });
  protected readonly accessForm = form(this.accessModel, (path) => {
    minLength(path.targetUid, 3, { message: 'Ingresa el UID de Firebase.' });
    required(path.entityId, { message: 'Selecciona una unidad.' });
  });
  protected readonly offerModel = signal({
    productId: '',
    commercialModel: 'wholesale' as 'wholesale' | 'consignment' | 'commission',
    fixedPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    commissionRate: 0,
  });
  protected readonly offerForm = form(this.offerModel, (path) => {
    required(path.productId, { message: 'Selecciona un producto.' });
    min(path.fixedPrice, 0);
    min(path.minPrice, 0);
    min(path.maxPrice, 0);
    min(path.commissionRate, 0);
  });
  protected readonly promotionModel = signal({
    name: '',
    productId: '',
    discountPercent: 0,
    marginBonusRate: 0,
  });
  protected readonly promotionForm = form(this.promotionModel, (path) => {
    minLength(path.name, 3, { message: 'Ingresa el nombre de la promoción.' });
    min(path.discountPercent, 0);
    min(path.marginBonusRate, 0);
  });

  constructor() {
    void this.load();
  }

  protected can(permission: string): boolean {
    return this.auth.activeContext()?.permissions.includes(permission) ?? false;
  }

  protected price(value: number, currency = 'CLP'): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  protected productName(productId: string): string {
    return this.catalog().find((product) => product.id === productId)?.name ?? productId;
  }

  protected productSku(productId: string): string {
    return this.catalog().find((product) => product.id === productId)?.sku ?? '';
  }

  protected async changeBranch(event: Event): Promise<void> {
    this.branchId.set((event.target as HTMLSelectElement).value);
    await this.loadOperationalData();
  }

  protected updateMediaProduct(event: Event): void {
    this.mediaProductId.set((event.target as HTMLSelectElement).value);
  }

  protected async uploadMedia(
    event: Event,
    kind: 'home' | 'product',
    targetId: string,
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.mediaUploading()) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.toast.show('Formato no permitido', 'Selecciona una imagen JPG, PNG o WebP.');
      input.value = '';
      return;
    }
    if (!targetId) {
      this.toast.show('Falta el producto', 'Selecciona el producto antes de cargar su imagen.');
      input.value = '';
      return;
    }

    this.mediaUploading.set(true);
    try {
      await this.commerce.uploadPublicMedia({
        kind,
        targetId,
        fileBase64: await this.readAsDataUrl(file),
        mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      });
      this.toast.show(
        'Imagen publicada',
        kind === 'home'
          ? 'La portada se actualizará automáticamente.'
          : 'El catálogo usará la nueva versión.',
      );
      await this.load();
      this.tab.set('administration');
    } catch {
      this.toast.show(
        'No se pudo publicar',
        'Revisa tu permiso, App Check y el tamaño de la imagen.',
      );
    } finally {
      this.mediaUploading.set(false);
      input.value = '';
    }
  }

  protected createSale(): void {
    submit(this.saleForm, async () => {
      const model = this.saleModel();
      const result = await this.commerce.createSale({
        branchId: this.branchId(),
        customerId: model.customerId || undefined,
        items: [{ productId: model.productId, quantity: Number(model.quantity) }],
        idempotencyKey: crypto.randomUUID(),
      });
      this.toast.show(
        'Venta registrada',
        `${result.saleId} · ${this.price(result.total, result.currency)}`,
      );
      this.saleModel.set({ productId: '', quantity: 1, customerId: '' });
      await this.loadOperationalData();
    });
  }

  protected receiveInventory(): void {
    submit(this.receiptForm, async () => {
      const model = this.receiptModel();
      const result = await this.commerce.receiveInventory({
        branchId: this.branchId(),
        productId: model.productId,
        quantity: Number(model.quantity),
        reason: model.reason,
        idempotencyKey: crypto.randomUUID(),
      });
      this.toast.show('Stock recibido', `Nuevo saldo: ${result.quantityAfter} unidades.`);
      this.receiptModel.set({ productId: '', quantity: 1, reason: '' });
      await this.loadOperationalData();
    });
  }

  protected createCustomer(): void {
    submit(this.customerForm, async () => {
      const model = this.customerModel();
      const result = await this.commerce.createCustomer({
        fullName: model.fullName,
        rut: model.rut || undefined,
        phone: model.phone || undefined,
        email: model.email || undefined,
      });
      this.saleModel.update((sale) => ({ ...sale, customerId: result.customerId }));
      this.customerModel.set({ fullName: '', rut: '', phone: '', email: '' });
      this.toast.show('Comprador registrado', 'Quedó seleccionado para la próxima venta.');
      this.tab.set('sales');
    });
  }

  protected createBranch(): void {
    submit(this.branchForm, async () => {
      await this.commerce.manageBusinessUnit({ ...this.branchModel(), status: 'active' });
      this.branchModel.set({ branchId: '', name: '' });
      this.toast.show('Sucursal guardada', 'La nueva unidad ya puede recibir accesos y stock.');
      await this.load();
      this.tab.set('administration');
    });
  }

  protected assignAccess(): void {
    submit(this.accessForm, async () => {
      const model = this.accessModel();
      await this.commerce.manageAccessContract({ ...model, status: 'active' });
      this.accessModel.set({
        targetUid: '',
        entityId: model.entityId,
        jobRoleId: 'sales_associate',
      });
      this.toast.show(
        'Acceso asignado',
        'La proyección y el cupo se actualizarán automáticamente.',
      );
      await this.loadAdministration();
    });
  }

  protected saveOffer(): void {
    submit(this.offerForm, async () => {
      const model = this.offerModel();
      await this.commerce.manageCompanyProductOffer({
        ...model,
        enabled: true,
        fixedPrice: Number(model.fixedPrice) || null,
        minPrice: Number(model.minPrice) || null,
        maxPrice: Number(model.maxPrice) || null,
        commissionRate: Number(model.commissionRate),
      });
      this.toast.show(
        'Precio actualizado',
        'El acuerdo comercial seguirá siendo la autoridad máxima.',
      );
      await this.load();
      this.tab.set('administration');
    });
  }

  protected createPromotion(): void {
    submit(this.promotionForm, async () => {
      const model = this.promotionModel();
      await this.commerce.managePromotion({
        name: model.name,
        status: 'active',
        productIds: model.productId ? [model.productId] : [],
        discountPercent: Number(model.discountPercent),
        marginBonusRate: Number(model.marginBonusRate),
      });
      this.promotionModel.set({ name: '', productId: '', discountPercent: 0, marginBonusRate: 0 });
      this.toast.show('Promoción creada', 'Se aplicará automáticamente al calcular nuevas ventas.');
      await this.loadAdministration();
    });
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [workspace, catalog] = await Promise.all([
        this.commerce.getCompanyWorkspace(),
        this.commerce.listCompanyCatalog(),
      ]);
      this.workspace.set(workspace);
      this.catalog.set(catalog);
      if (this.auth.activeContext()?.scopeLevel === 'company') {
        this.branchId.set(workspace.units.find((unit) => unit.type === 'branch')?.id ?? '');
      }
      await this.loadOperationalData();
      await this.loadAdministration();
    } catch {
      this.error.set(
        'No pudimos cargar la operación. Tu token puede estar vencido o sin permisos.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAdministration(): Promise<void> {
    const [contracts, promotions] = await Promise.all([
      this.can('access_contracts.read') ? this.commerce.listAccessContracts() : Promise.resolve([]),
      this.can('promotions.read') &&
      this.workspace()?.subscription.entitlements.includes('margin_promotions')
        ? this.commerce.listPromotions()
        : Promise.resolve([]),
    ]);
    this.accessContracts.set(contracts);
    this.promotions.set(promotions);
  }

  private async loadOperationalData(): Promise<void> {
    if (!this.branchId()) {
      this.inventory.set([]);
      this.sales.set([]);
      return;
    }
    const [inventory, sales] = await Promise.all([
      this.can('inventory.read')
        ? this.commerce.listInventory(this.branchId())
        : Promise.resolve([]),
      this.can('sales.read') ? this.commerce.listSales(this.branchId()) : Promise.resolve([]),
    ]);
    this.inventory.set(inventory);
    this.sales.set(sales);
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }
}
