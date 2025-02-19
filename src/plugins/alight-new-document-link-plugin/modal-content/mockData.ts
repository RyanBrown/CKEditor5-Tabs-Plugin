// src/plugins/alight-new-document-link-plugin/mock/categories.ts

export interface Category {
  id: string;
  label: string;
  checked?: boolean;
}

export const mockCategories: Category[] = [
  { id: 'benefits', label: 'Benefits' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'hr', label: 'Human Resources' },
  { id: 'wellness', label: 'Wellness Programs' },
  { id: 'training', label: 'Training & Development' },
  { id: 'policies', label: 'Company Policies' },
  { id: 'retirement', label: 'Retirement Plans' },
  { id: 'insurance', label: 'Insurance' }
];