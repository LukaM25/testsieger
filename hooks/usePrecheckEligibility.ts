"use client";

import { useEffect, useState } from "react";

type EligibilityState = {
  hasPrecheck: boolean;
  loading: boolean;
  paidAndPassed: boolean;
  productId: string | null;
  licensePaid: boolean;
};

export function usePrecheckEligibility(): EligibilityState {
  const [hasPrecheck, setHasPrecheck] = useState(false);
  const [paidAndPassed, setPaidAndPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<string | null>(null);
  const [licensePaid, setLicensePaid] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch("/api/precheck/status", { cache: "no-store", signal: controller.signal });
        if (!res.ok) {
          if (!active) return;
          setHasPrecheck(false);
          setPaidAndPassed(false);
          setLicensePaid(false);
          return;
        }
        const data = await res.json();
        if (!active) return;
        const prod = data?.product;
        setHasPrecheck(!!prod);
        setProductId(prod?.id ?? null);
        setLicensePaid(!!data?.licensePaid);
        const paid = prod && ['PAID', 'MANUAL'].includes(prod.paymentStatus);
        const passed =
          prod && (prod.adminProgress === 'PASS' || prod.adminProgress === 'COMPLETION' || prod.status === 'COMPLETED');
        setPaidAndPassed(!!prod && paid && passed);
      } catch {
        if (!active || controller.signal.aborted) return;
        setHasPrecheck(false);
        setPaidAndPassed(false);
        setProductId(null);
        setLicensePaid(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { hasPrecheck, paidAndPassed, loading, productId, licensePaid };
}
