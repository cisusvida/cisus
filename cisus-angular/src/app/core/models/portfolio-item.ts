/** Editorial grouping only. Product facts and media come from the public catalog. */
export interface ProductFamily {
  id: string;
  label: string;
  heading?: string;
  claim?: string;
  commercialState?: 'available' | 'design_concept';
  conceptLabel?: string;
  imageDisclosure?: string;
  detailNotice?: string;
  types: ProductType[];
}

export interface ProductType {
  id: string;
  label: string;
  icon?: 'paw' | 'relief' | 'knob' | 'handle';
  models: ProductModelReference[];
}

export interface ProductModelReference {
  productId: string;
  metadata?: string;
  sceneObjectFit?: 'contain' | 'cover';
  sceneObjectPosition?: string;
}
