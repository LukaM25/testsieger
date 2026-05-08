import { beforeEach, describe, expect, it, vi } from 'vitest';

const admin = { id: 'admin_example', role: 'EXAMINER', email: 'admin@example.test' };
const productId = 'prod_example';
const certificateId = 'cert_example';

let certificateRecord: any;
let productRecord: any;

const requireAdminMock = vi.fn(async () => admin);
const logAdminAuditMock = vi.fn(async () => undefined);
const renderHtmlToPdfBufferMock = vi.fn(async () => Buffer.from('rating-pdf'));
const saveBufferToS3Mock = vi.fn(async () => undefined);

const prismaMock = {
  $connect: vi.fn(async () => undefined),
  product: {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.id !== productId) return null;
      return {
        id: productRecord.id,
        name: productRecord.name,
        userId: productRecord.userId,
        processNumber: productRecord.processNumber,
        certificate: certificateRecord
          ? {
              id: certificateRecord.id,
              snapshotData: certificateRecord.snapshotData,
            }
          : null,
      };
    }),
    findMany: vi.fn(async () => [
      {
        id: productRecord.id,
        name: productRecord.name,
        brand: 'Example Brand',
        category: 'Example Category',
        code: null,
        specs: null,
        size: null,
        madeIn: null,
        material: null,
        status: 'PRECHECK',
        processNumber: productRecord.processNumber,
        adminProgress: 'PRECHECK',
        paymentStatus: 'UNPAID',
        createdAt: new Date('2026-05-08T08:00:00.000Z'),
        user: { name: 'Example User', gender: null, company: null, email: 'user@example.test', address: null },
        certificate: {
          id: certificateRecord.id,
          pdfUrl: '',
          reportUrl: null,
          qrUrl: '',
          seal_number: 'seal-example',
          externalReferenceId: null,
          ratingScore: certificateRecord.ratingScore,
          ratingLabel: certificateRecord.ratingLabel,
          snapshotData: certificateRecord.snapshotData,
          sealUrl: null,
        },
        license: null,
      },
    ]),
    count: vi.fn(async () => 1),
    groupBy: vi.fn(async () => [{ status: 'PRECHECK', _count: { _all: 1 } }]),
  },
  order: {
    findMany: vi.fn(async () => []),
  },
  adminAudit: {
    findMany: vi.fn(async () => []),
  },
  certificate: {
    findUnique: vi.fn(async ({ where }: any) => {
      if (where.productId === productId || where.id === certificateId) return certificateRecord;
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      certificateRecord = {
        id: certificateId,
        productId: data.productId,
        pdfUrl: data.pdfUrl,
        qrUrl: data.qrUrl,
        snapshotData: null,
        ratingScore: null,
        ratingLabel: null,
      };
      return certificateRecord;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      if (where.id !== certificateId) throw new Error('Unexpected certificate id');
      certificateRecord = { ...certificateRecord, ...data };
      return certificateRecord;
    }),
  },
  asset: {
    upsert: vi.fn(async () => ({})),
  },
};

vi.mock('@/lib/admin', () => ({
  requireAdmin: requireAdminMock,
  logAdminAudit: logAdminAuditMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/htmlToPdf', () => ({
  renderHtmlToPdfBuffer: renderHtmlToPdfBufferMock,
}));

vi.mock('@/lib/storage', () => ({
  saveBufferToS3: saveBufferToS3Mock,
}));

describe('admin product rating save state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    productRecord = {
      id: productId,
      name: 'Example Pro Product',
      userId: 'user_example',
      processNumber: 'TC-EXAMPLE',
    };
    certificateRecord = {
      id: certificateId,
      productId,
      pdfUrl: '',
      qrUrl: '',
      snapshotData: null,
      ratingScore: null,
      ratingLabel: null,
    };
  });

  it('saves an example product as draft, reloads the draft, then finalizes the rating', async () => {
    const { PUT, GET } = await import('../app/api/admin/products/[id]/rating/route');
    const { RATING_CRITERIA_V1 } = await import('../lib/ratingV1');
    const params = Promise.resolve({ id: productId });

    const draftValues = {
      B2: { score: 8, note: 'Packaging survived the drop test.' },
      B29: { score: 7, note: 'Good appearance, minor finish marks.' },
    };

    const draftResponse = await PUT(
      new Request('http://test.local/api/admin/products/prod_example/rating', {
        method: 'PUT',
        body: JSON.stringify({ mode: 'draft', values: draftValues }),
      }),
      { params },
    );
    const draftJson = await draftResponse.json();

    expect(draftResponse.status).toBe(200);
    expect(draftJson.status).toBe('DRAFT');
    expect(draftJson.csv).toBeNull();
    expect(draftJson.pdf).toBeNull();
    expect(certificateRecord.ratingScore).toBeNull();
    expect(certificateRecord.ratingLabel).toBeNull();
    expect(certificateRecord.snapshotData.ratingV1.status).toBe('DRAFT');
    expect(certificateRecord.snapshotData.ratingV1.values.B2).toEqual(draftValues.B2);
    expect(saveBufferToS3Mock).not.toHaveBeenCalled();
    expect(renderHtmlToPdfBufferMock).not.toHaveBeenCalled();

    const reloadResponse = await GET(new Request('http://test.local/api/admin/products/prod_example/rating'), {
      params,
    });
    const reloadJson = await reloadResponse.json();

    expect(reloadResponse.status).toBe(200);
    expect(reloadJson.status).toBe('DRAFT');
    expect(reloadJson.values.B2).toEqual(draftValues.B2);
    expect(reloadJson.values.B29).toEqual(draftValues.B29);

    const productsModule = await import('../app/api/admin/products/route');
    const productsResponse = await productsModule.GET(new Request('http://test.local/api/admin/products?signed=0'));
    const productsJson = await productsResponse.json();

    expect(productsResponse.status).toBe(200);
    expect(productsJson.products[0].certificate.ratingStatus).toBe('DRAFT');
    expect(productsJson.products[0].certificate.ratingDraftUpdatedAt).toEqual(expect.any(String));
    expect(productsJson.products[0].certificate.ratingScore).toBeNull();

    const finalValues = Object.fromEntries(
      RATING_CRITERIA_V1.map((criterion) => [criterion.id, { score: 9, note: `Checked ${criterion.id}` }]),
    );

    const finalResponse = await PUT(
      new Request('http://test.local/api/admin/products/prod_example/rating', {
        method: 'PUT',
        body: JSON.stringify({ mode: 'final', values: finalValues }),
      }),
      { params },
    );
    const finalJson = await finalResponse.json();

    expect(finalResponse.status).toBe(200);
    expect(finalJson.status).toBe('FINAL');
    expect(finalJson.csv?.key).toContain(`ratings/RATING_${productId}_`);
    expect(finalJson.pdf?.key).toContain(`ratings/RATING_${productId}_`);
    expect(certificateRecord.ratingScore).toBe('1.6');
    expect(certificateRecord.ratingLabel).toBe('Sehr gut');
    expect(certificateRecord.snapshotData.ratingV1.status).toBe('FINAL');
    expect(certificateRecord.snapshotData.ratingV1.finalizedAt).toEqual(expect.any(String));
    expect(saveBufferToS3Mock).toHaveBeenCalledTimes(2);
    expect(renderHtmlToPdfBufferMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.asset.upsert).toHaveBeenCalledTimes(2);
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RATING_SHEET_DRAFT_SAVE', productId }),
    );
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RATING_SHEET_SAVE', productId }),
    );
  });
});
