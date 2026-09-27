export type PurchaseIntent = 'personal' | 'corporate' | 'resale' | 'new_idea';

export interface PurchaseIntentContext {
  readonly productId: string;
  readonly productName: string;
  readonly optionLabels: readonly string[];
  readonly isConcept: boolean;
}

export interface PurchaseIntentChoice {
  readonly intent: PurchaseIntent;
  readonly context: PurchaseIntentContext;
}
