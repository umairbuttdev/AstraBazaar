"use client";

import { useEffect } from "react";
import { track, type AnalyticsValue } from "@/lib/analytics";

export function TrackView({
  name,
  properties,
  onceKey,
  persist = false,
}: {
  name: string;
  properties?: Record<string, AnalyticsValue>;
  onceKey?: string;
  persist?: boolean;
}) {
  const serialized = JSON.stringify(properties ?? {});

  useEffect(() => {
    track(name, JSON.parse(serialized) as Record<string, AnalyticsValue>, {
      onceKey,
      persist,
    });
  }, [name, onceKey, persist, serialized]);

  return null;
}
