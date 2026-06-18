"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { InventoryForecastTab } from "@/components/assistant/InventoryForecastTab";
import { Chatbot } from "@/components/chat/Chatbot";
import { HistoricalTrendsTab } from "@/components/assistant/HistoricalTrendsTab";
import { SettingsTab } from "@/components/assistant/SettingsTab";
import { AlertsCenter } from "@/components/assistant/AlertsCenter";
import { apiFetch } from "@/lib/api";
import type { InventoryItem } from "@/types/index";

const TABS = [
  "Inventory & Forecasting AI",
  "Operations NLP Assistant",
  "Historical Trends",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];

export default function AIAssistantPage() {
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory")
      .then(setItems)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load inventory"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Analytics & Forecasting AI" />

      <div className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-800/70">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "Inventory & Forecasting AI" && (
          <div className="grid grid-cols-12 gap-4 lg:gap-6">
            <div className="col-span-12 lg:col-span-8">
              <InventoryForecastTab
                items={items}
                loading={loading}
                error={error}
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <AlertsCenter />
            </div>
          </div>
        )}

        {tab === "Operations NLP Assistant" && (
          <div className="max-w-3xl">
            <Chatbot />
          </div>
        )}

        {tab === "Historical Trends" && <HistoricalTrendsTab />}

        {tab === "Settings" && <SettingsTab />}
      </div>
    </>
  );
}
