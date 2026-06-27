import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { QuotaStatus } from "@ailt/shared";

export type FullQuotaStatus = QuotaStatus & {
  moderation: {
    strikeCount: number;
    cooldownLevel: number;
    cooldownUntil: string | null;
  };
};

/** Loads quota + moderation status. Exposes a manual refresh for after sends. */
export function useQuotaStatus(enabled: boolean) {
  const [data, setData] = useState<FullQuotaStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await api<FullQuotaStatus>("/api/quota/status");
      setData(res);
    } catch {
      // Soft failure — fall back to null, UI continues
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
