export type ClientProjectStatus = 'quoted' | 'confirmed' | 'in_production' | 'ready' | 'delivered';
export type ClientProjectTimelineStatus = 'completed' | 'current' | 'upcoming';

export interface ClientProjectTimelineStage {
  id: string;
  title: string;
  detail: string;
  date: string;
  status: ClientProjectTimelineStatus;
  fileIds: string[];
}

export interface ClientProjectActivity {
  id: string;
  author: string;
  title: string;
  message: string;
  date: string;
  status: Exclude<ClientProjectTimelineStatus, 'upcoming'>;
  source: string;
  fileId: string;
}

export interface ClientProjectFile {
  fileId: string;
  projectId: string;
  name: string;
  category: string;
  categoryLabel: string;
  contentType: string;
  size: number;
  documentDate: string;
  sortOrder: number;
}

export interface ClientProject {
  projectId: string;
  projectCode: string;
  companyName: string;
  title: string;
  summary: string;
  status: ClientProjectStatus;
  quantity: number;
  unitLabel: string;
  currentStage: string;
  lastConfirmedAt: string;
  dates: {
    order: string;
    invoice: string;
    payment: string;
    delivery: string;
  };
  financial: {
    currency: string;
    net: number;
    tax: number;
    total: number;
    paymentStatus: 'paid' | 'pending';
    paymentTerms: string;
  };
  clientTimeline: ClientProjectTimelineStage[];
  clientActivity: ClientProjectActivity[];
  files: ClientProjectFile[];
}
