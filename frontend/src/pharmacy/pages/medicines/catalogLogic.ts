
export const PRODUCT_CATEGORIES = [
  'Pharmaceutical Medicines',
  'Medical & Surgical Supplies',
  'Medical Devices & Diagnostics',
  'Ayurvedic & Traditional Products',
  'Cosmetics & Personal Care',
  'Vitamins, Minerals & Supplements',
  'Mother & Baby Care',
  'Oral & Dental Care',
  'Hygiene & Sanitation',
  'Family Planning & Sexual Health',
  'Veterinary Medicines & Animal Care',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface CatalogItem {
  id: string;
  medicineCode: string;
  medicineName: string;
  genericName: string;
  productName: string;
  brandTradeName: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  category: ProductCategory;
  manufacturer: string;
  status: ProductStatus;
  hasLinkedHistory: boolean;
}

export type CatalogForm = Pick<CatalogItem,
  'genericName'|'productName'|'brandTradeName'|'dosageForm'|'strength'|'packSize'|'category'|'manufacturer'>;

export type CatalogErrors = Partial<Record<keyof CatalogForm|'duplicate',string>>;

export const EMPTY_CATALOG_FORM: CatalogForm = {
  genericName: '', productName: '', brandTradeName: '', dosageForm: 'Tablet',
  strength: '', packSize: '', category: 'Pharmaceutical Medicines', manufacturer: '',
};

export function isMedicine(category: ProductCategory): boolean {
  return category === 'Pharmaceutical Medicines';
}

export function displayName(product: CatalogForm): string {
  if (!isMedicine(product.category)) return product.productName.trim();
  return [product.genericName, product.dosageForm, product.strength]
    .map(v => v.trim()).filter(Boolean).join(' ');
}

export function validateCatalogForm(
  values: CatalogForm, items: CatalogItem[], editingId?: string
): CatalogErrors {
  const errors: CatalogErrors = {};
  if (!PRODUCT_CATEGORIES.includes(values.category)) errors.category = 'Select a product category.';
  if (!values.manufacturer.trim()) errors.manufacturer = 'Manufacturer is required.';
  if (!values.packSize.trim()) errors.packSize = 'Pack size is required.';
  if (isMedicine(values.category)) {
    if (!values.genericName.trim()) errors.genericName = 'Generic name is required.';
    if (!values.dosageForm.trim()) errors.dosageForm = 'Dosage form is required.';
    if (!values.strength.trim()) errors.strength = 'Strength is required (e.g., 500 mg).';
  } else if (!values.productName.trim()) {
    errors.productName = 'Product name is required.';
  }
  if (Object.keys(errors).length) return errors;

  const normalize = (text: string) => text.trim().toLocaleLowerCase();
  const desired = [displayName(values), values.brandTradeName, values.packSize, values.manufacturer]
    .map(normalize).join('|');
  if (items.some(row => row.id !== editingId && row.status === 'ACTIVE' &&
    [row.medicineName, row.brandTradeName, row.packSize, row.manufacturer]
      .map(normalize).join('|') === desired)) {
    errors.duplicate = 'This product, brand, pack size and manufacturer already exist.';
  }
  return errors;
}

export function searchCatalog(items: CatalogItem[], search: string, category: string, manufacturer: string): CatalogItem[] {
  const query = search.trim().toLocaleLowerCase();
  const maker = manufacturer.trim().toLocaleLowerCase();
  return items.filter(item => item.status === 'ACTIVE' &&
    (!query || [item.genericName, item.brandTradeName, item.productName, item.medicineName]
      .some(text => text.toLocaleLowerCase().includes(query))) &&
    (!category || item.category === category) &&
    (!maker || item.manufacturer.toLocaleLowerCase().includes(maker)));
}
