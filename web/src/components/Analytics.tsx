"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { countEndpoint } from "@/lib/analytics/goatcounter";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars: {
        path: string;
        title?: string;
        referrer?: string;
        /** Count as a custom event rather than a pageview. */
        event?: boolean;
      }) => void;
    };
  }
}

// Read at module scope: Next inlines NEXT_PUBLIC_* at build time, so an unset
// variable makes this whole component compile away to `null`.
const endpoint = countEndpoint(process.env.NEXT_PUBLIC_GOATCOUNTER_CODE);

/**
 * Cookie-less GoatCounter pageview counting. Off entirely unless
 * `NEXT_PUBLIC_GOATCOUNTER_CODE` is set — see `src/lib/analytics/goatcounter.ts`.
 *
 * The App Router navigates without reloading the page, so the script's own
 * count-on-load would only ever see the first page someone landed on. It is turned
 * off (`no_onload`) and the effect below counts every path instead, first one included.
 */
export function Analytics() {
  const pathname = usePathname();
  // Set when a path needs counting before the script has finished loading.
  const pending = useRef<string | null>(null);

  const count = useCallback((path: string) => {
    if (window.goatcounter?.count) {
      window.goatcounter.count({ path });
    } else {
      pending.current = path;
    }
  }, []);

  useEffect(() => {
    if (!endpoint) return;
    count(pathname);
  }, [pathname, count]);

  if (!endpoint) return null;

  return (
    <Script
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
      data-goatcounter={endpoint}
      data-goatcounter-settings='{"no_onload":true}'
      onLoad={() => {
        const path = pending.current;
        pending.current = null;
        // Only flush what the effect couldn't send yet; anything after this point
        // goes straight through `count`, so there's no double-counting here.
        if (path) window.goatcounter?.count?.({ path });
      }}
    />
  );
}
