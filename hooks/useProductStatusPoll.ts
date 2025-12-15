"use client";

import { useEffect, useRef, useState } from "react";

export type ProductStatusApiResponse = {
  productStatus: string;
  adminProgress: string;
  certificateStatus: string | null;
  certificateId: string | null;
  pdfUrl: string | null;
  reportUrl: string | null;
  sealUrl: string | null;
};

type Options = {
  enabled?: boolean;
  intervalMs?: number;
};

export function useProductStatusPoll(productId: string | null | undefined, options: Options = {}) {
  const { enabled = true, intervalMs = 7000 } = options;
  const [data, setData] = useState<ProductStatusApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!productId || !enabled) {
      setData(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let cancelled = false;

    const tick = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
        const json = (await res.json()) as ProductStatusApiResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) console.warn("PRODUCT_STATUS_POLL_ERROR", err);
      } finally {
        if (!cancelled) setLoading(false);
        if (!cancelled) {
          timerRef.current = setTimeout(tick, intervalMs);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [productId, enabled, intervalMs]);

  return { data, loading };
}
