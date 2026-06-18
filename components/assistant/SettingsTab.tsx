"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const card = "rounded-xl border border-slate-800/70 bg-slate-900/40 backdrop-blur-sm p-5";

/**
 * Settings tab. Template AI/forecasting preferences — local state only, no
 * backend persistence yet.
 */
export function SettingsTab() {
  const [horizon, setHorizon] = useState("7");
  const [model, setModel] = useState("gemma-local");
  const [minConfidence, setMinConfidence] = useState("50");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="flex max-w-2xl flex-col gap-4 lg:gap-5">
      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Forecasting Settings
        </h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Forecast horizon (days)
            </span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              {["7", "14", "30"].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Minimum confidence to show forecast (%)
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value)}
              className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-4 text-sm font-semibold text-slate-200">
          Assistant Model
        </h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            NLP model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            <option value="gemma-local">Gemma (local) — mock</option>
            <option value="backend-default">Backend default</option>
          </select>
          <span className="text-xs text-slate-500">
            Connects to the backend /api/chat endpoint.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit">Save settings</Button>
        {saved && (
          <span className="text-sm text-emerald-400">Saved (template)</span>
        )}
      </div>
    </form>
  );
}
