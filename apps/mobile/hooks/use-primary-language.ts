import { useEffect, useState } from "react";
import type { LanguageCode, AccentCode, CefrLevel } from "@ailt/shared";
import { supabase } from "@/lib/supabase";

export type PrimaryLanguage = {
  language: LanguageCode;
  accent: AccentCode;
  level: CefrLevel;
};

/** Returns the user's primary learning language + accent + level, or null until loaded. */
export function usePrimaryLanguage(userId: string | undefined): PrimaryLanguage | null | undefined {
  const [data, setData] = useState<PrimaryLanguage | null | undefined>(undefined);

  useEffect(() => {
    if (!userId) {
      setData(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_languages")
      .select("language, accent, current_level")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        if (!row) return setData(null);
        setData({
          language: row.language as LanguageCode,
          accent: row.accent as AccentCode,
          level: row.current_level as CefrLevel,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return data;
}
