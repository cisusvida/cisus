export type UserRole =
  | 'unscoped'
  | 'platform_admin'
  | 'cisus_commercial_admin'
  | 'cisus_operations'
  | 'company_admin'
  | 'branch_manager'
  | 'sales_associate'
  | 'inventory_operator'
  | 'finance_viewer';

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
}

export interface AccessContext {
  scopeId: string;
  companyId: string;
  companyName: string;
  entityId: string;
  entityName: string;
  jobRoleId: Exclude<UserRole, 'unscoped'>;
  scopeLevel: 'company' | 'branch';
}

export interface ActiveAccessContext extends AccessContext {
  pv: number;
  sv: number;
  permissions: string[];
}
