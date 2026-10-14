"use client";

import { createContext, useContext } from "react";

const RatesLiveContext = createContext(false);

/** Whether any bank has rate data yet, decided once per render in the root layout. */
export function RatesLiveProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <RatesLiveContext value={value}>{children}</RatesLiveContext>;
}

export function useRatesLive(): boolean {
  return useContext(RatesLiveContext);
}
