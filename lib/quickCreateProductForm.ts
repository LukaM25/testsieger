export type QuickCreateProductForm = {
  productName: string;
  brand: string;
  category: string;
  code: string;
  specs: string;
  sizeLength: string;
  sizeWidth: string;
  sizeHeight: string;
  madeIn: string;
  material: string;
};

export type QuickCreateProductPayload = {
  productName: string;
  brand: string;
  category: string;
  code: string;
  specs: string;
  size: string;
  madeIn: string;
  material: string;
};

export const createEmptyQuickCreateProductForm = (): QuickCreateProductForm => ({
  productName: "",
  brand: "",
  category: "",
  code: "",
  specs: "",
  sizeLength: "",
  sizeWidth: "",
  sizeHeight: "",
  madeIn: "",
  material: "",
});

export const QUICK_CREATE_CATEGORY_OPTIONS = [
  "Ausbildung",
  "Auto & Motorrad",
  "Baby",
  "Baumarkt",
  "Beleuchtung",
  "Bücher",
  "Bürobedarf & Schreibwaren",
  "Computer & Zubehör",
  "DVD & Blu-ray",
  "Elektro-Großgeräte",
  "Elektronik & Foto",
  "Garten",
  "Gewerbe, Industrie & Wissenschaft",
  "Handgefertigte Produkte",
  "Haustierbedarf",
  "Kamera & Foto",
  "Kosmetik & Pflege",
  "Küche, Haushalt & Wohnen",
  "Lebensmittel & Getränke",
  "Mode",
  "Musikinstrumente & DJ-Equipment",
  "Software",
  "Spiele & Gaming",
  "Spielzeug",
  "Sport & Freizeit",
  "Uhren & Schmuck",
  "Wohnen",
] as const;

export const QUICK_CREATE_MADE_IN_OPTIONS = [
  { de: "Deutschland", en: "Germany" },
  { de: "Österreich", en: "Austria" },
  { de: "Schweiz", en: "Switzerland" },
  { de: "Niederlande", en: "Netherlands" },
  { de: "Polen", en: "Poland" },
  { de: "Frankreich", en: "France" },
  { de: "Italien", en: "Italy" },
  { de: "Spanien", en: "Spain" },
  { de: "Vereinigtes Königreich", en: "United Kingdom" },
  { de: "USA", en: "USA" },
  { de: "China", en: "China" },
  { de: "Indien", en: "India" },
  { de: "Vietnam", en: "Vietnam" },
  { de: "Türkei", en: "Turkey" },
  { de: "Sonstiges", en: "Other" },
] as const;

export const QUICK_CREATE_REQUIRED_FIELDS = [
  { key: "productName", label: { de: "Produktname", en: "Product name" }, min: 2 },
  { key: "brand", label: { de: "Marke", en: "Brand" }, min: 1 },
  { key: "category", label: { de: "Kategorie", en: "Category" }, min: 1 },
  { key: "code", label: { de: "Artikelnummer", en: "Item code" }, min: 2 },
  { key: "specs", label: { de: "Spezifikationen", en: "Specs" }, min: 5 },
  { key: "sizeLength", label: { de: "Länge", en: "Length" }, min: 1 },
  { key: "sizeWidth", label: { de: "Breite", en: "Width" }, min: 1 },
  { key: "sizeHeight", label: { de: "Höhe", en: "Height" }, min: 1 },
  { key: "madeIn", label: { de: "Hergestellt in", en: "Made in" }, min: 2 },
  { key: "material", label: { de: "Material", en: "Material" }, min: 2 },
] as const;

export const findInvalidQuickCreateField = (form: QuickCreateProductForm) =>
  QUICK_CREATE_REQUIRED_FIELDS.find((field) => form[field.key].trim().length < field.min) || null;

export const toQuickCreateProductPayload = (form: QuickCreateProductForm): QuickCreateProductPayload => ({
  productName: form.productName.trim(),
  brand: form.brand.trim(),
  category: form.category.trim(),
  code: form.code.trim(),
  specs: form.specs.trim(),
  size: [form.sizeLength, form.sizeWidth, form.sizeHeight].map((value) => value.trim()).join("x"),
  madeIn: form.madeIn.trim(),
  material: form.material.trim(),
});
