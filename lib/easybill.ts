export type EasybillLine = {
  stripePriceId: string;
  description: string;
  quantity: number;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

type CreateEasybillInvoiceInput = {
  externalId: string;
  customer: {
    name: string;
    email: string;
    address?: string | null;
  };
  lines: EasybillLine[];
};

type EasybillCustomer = {
  id: number;
};

type EasybillDocument = {
  id: number;
  document_number?: string | null;
};

const EASYBILL_BASE_URL =
  process.env.EASYBILL_BASE_URL || "https://api.easybill.de/rest/v1";

function getEasybillApiKey() {
  const apiKey = process.env.EASYBILL_API_KEY;
  if (!apiKey) throw new Error("EASYBILL_API_KEY is missing");
  return apiKey;
}

function getEasybillHeaders() {
  const apiKey = getEasybillApiKey();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function easybillRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${EASYBILL_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getEasybillHeaders(),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Easybill request failed (${response.status}) ${path}: ${text}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function splitName(fullName: string) {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { first_name: "Kunde", last_name: "Unbekannt" };

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "Unbekannt" };
  }

  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function mapAddress(address?: string | null) {
  if (!address) return {};

  const lines = address
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    address_1: lines[0] || "",
    address_2: lines[1] || "",
  };
}

function getBillingCatalog() {
  return {
    [process.env.STRIPE_PRICE_PRECHECK_STANDARD!]: {
      code: "PRECHECK_FEE",
      label: "Grundgebühr Standard",
      vatPercent: Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19"),
    },
    [process.env.STRIPE_PRICE_PRECHECK_PRIORITY!]: {
      code: "PRECHECK_PRIORITY",
      label: "Grundgebühr Priorität",
      vatPercent: Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19"),
    },
    [process.env.STRIPE_PRICE_BASIC!]: {
      code: "BASIC",
      label: "Testsieger BASIC Lizenz",
      vatPercent: Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19"),
    },
    [process.env.STRIPE_PRICE_PREMIUM!]: {
      code: "PREMIUM",
      label: "Testsieger PREMIUM Lizenz",
      vatPercent: Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19"),
    },
    [process.env.STRIPE_PRICE_LIFETIME!]: {
      code: "LIFETIME",
      label: "Testsieger LIFETIME Lizenz",
      vatPercent: Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19"),
    },
  };
}

async function findCustomerByEmail(
  email: string
): Promise<EasybillCustomer | null> {
  const query = new URLSearchParams({ email }).toString();

  try {
    const result = await easybillRequest<{ items?: Array<{ id: number }> }>(
      `/customers?${query}`,
      { method: "GET" }
    );
    const first = result.items?.[0];
    return first ? { id: first.id } : null;
  } catch {
    return null;
  }
}

async function createCustomer(input: CreateEasybillInvoiceInput["customer"]) {
  const { first_name, last_name } = splitName(input.name);

  return easybillRequest<EasybillCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      first_name,
      last_name,
      emails: [input.email],
      ...mapAddress(input.address),
    }),
  });
}

async function getOrCreateCustomer(
  input: CreateEasybillInvoiceInput["customer"]
) {
  const existing = await findCustomerByEmail(input.email);
  if (existing) return existing;
  return createCustomer(input);
}

async function createDocument(params: {
  customerId: number;
  externalId: string;
  lines: EasybillLine[];
}) {
  const catalog = getBillingCatalog();

  const items = params.lines.map((line) => {
    const mapped = catalog[line.stripePriceId as keyof typeof catalog];
    const vatPercent =
      mapped?.vatPercent ??
      Number(process.env.EASYBILL_DEFAULT_VAT_PERCENT || "19");
    const label = mapped?.label ?? line.description;
    const qty = line.quantity || 1;
    const grossPerUnit = line.totalCents / qty / 100;

    return {
      type: "CUSTOM",
      description: label,
      quantity: qty,
      vat_percent: vatPercent,
      single_price_gross: Number(grossPerUnit.toFixed(2)),
    };
  });

  return easybillRequest<EasybillDocument>("/documents", {
    method: "POST",
    body: JSON.stringify({
      type: "INVOICE",
      customer_id: params.customerId,
      external_id: params.externalId,
      currency: "EUR",
      items,
    }),
  });
}

async function finalizeDocument(documentId: number) {
  return easybillRequest<EasybillDocument>(`/documents/${documentId}/done`, {
    method: "PUT",
  });
}

export async function createEasybillInvoiceForPaidCheckout(
  input: CreateEasybillInvoiceInput
) {
  if (!input.lines.length) {
    throw new Error("No invoice lines provided");
  }

  const invalid = input.lines.some(
    (line) => !line.stripePriceId || !Number.isFinite(line.totalCents) || line.totalCents <= 0
  );

  if (invalid) {
    throw new Error("Invalid Easybill line payload");
  }

  const customer = await getOrCreateCustomer(input.customer);
  const draft = await createDocument({
    customerId: customer.id,
    externalId: input.externalId,
    lines: input.lines,
  });
  const finalized = await finalizeDocument(draft.id);

  return {
    customerId: customer.id,
    documentId: finalized.id,
    documentNumber: finalized.document_number ?? null,
  };
}
