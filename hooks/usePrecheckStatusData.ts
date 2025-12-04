"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ProductStatusPayload = {
  id: string;
  name: string;
  paymentStatus: "UNPAID" | "PAID" | "MANUAL";
  adminProgress: "PRECHECK" | "RECEIVED" | "ANALYSIS" | "COMPLETION" | "PASS" | "FAIL";
  status: string;
  createdAt?: string;
  brand?: string | null;
  certificate?: { id: string; pdfUrl?: string | null } | null;
  license?: { status: string; plan?: string | null } | null;
};

type Options = {
  initialProductId?: string;
  initialProducts?: ProductStatusPayload[];
};

type StatusError = "UNAUTHORIZED" | "LOAD_FAILED" | null;

export function usePrecheckStatusData(options: Options = {}) {
  const { initialProductId = "", initialProducts = [] } = options;
  const [products, setProducts] = useState<ProductStatusPayload[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || initialProducts[0]?.id || "");
  const [productStatus, setProductStatus] = useState<ProductStatusPayload | null>(() => {
    const preselected = initialProductId ? initialProducts.find((p) => p.id === initialProductId) : null;
    return preselected || initialProducts[0] || null;
  });
  const [productsLoading, setProductsLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<StatusError>(null);

  const selectedRef = useRef<string>(selectedProductId);
  useEffect(() => {
    selectedRef.current = selectedProductId;
  }, [selectedProductId]);

  const fetchProducts = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      setProductsLoading(true);
      setStatusLoading(true);
      setStatusError(null);
      try {
        const res = await fetch("/api/precheck/products", { cache: "no-store", signal: opts?.signal });
        if (!res.ok) {
          setProducts([]);
          setProductStatus(null);
          setStatusError(res.status === 401 ? "UNAUTHORIZED" : "LOAD_FAILED");
          return;
        }
        const data = await res.json();
        const list: ProductStatusPayload[] = data.products || [];
        setProducts(list);

        const preferredId = selectedRef.current || initialProductId || list[0]?.id || "";
        const matched = preferredId ? list.find((p) => p.id === preferredId) || null : null;
        setSelectedProductId(matched ? preferredId : "");
        setProductStatus(matched);
      } catch (err: any) {
        if (opts?.signal?.aborted) return;
        setProducts([]);
        setProductStatus(null);
        setStatusError("LOAD_FAILED");
      } finally {
        if (opts?.signal?.aborted) return;
        setProductsLoading(false);
        setStatusLoading(false);
      }
    },
    [initialProductId]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [fetchProducts]);

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
      setProductStatus(products[0]);
      return;
    }
    const selected = products.find((p) => p.id === selectedProductId) || null;
    setProductStatus(selected);
  }, [products, selectedProductId]);

  return {
    products,
    setProducts,
    selectedProductId,
    setSelectedProductId,
    productStatus,
    productsLoading,
    statusLoading,
    statusError,
    refresh: fetchProducts,
  };
}
