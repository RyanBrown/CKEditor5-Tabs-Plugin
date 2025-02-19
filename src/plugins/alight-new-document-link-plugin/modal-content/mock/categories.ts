// export interface Category {
//   id: string;
//   label: string;
// }

// export const mockCategories: Category[] = [
//   // Add your mock categories here
//   { id: 'cat1', label: 'Category 1' },
//   { id: 'cat2', label: 'Category 2' },
//   // ... more categories
// ]; 

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