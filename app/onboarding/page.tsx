"use client";

import { useEffect, useState } from "react";

type MeResponse = {
  ok: boolean;
  userId: string;
  dbUser: {
    id: string;
    clerkUserId: string;
    email: string | null;
    name: string | null;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export default function OnboardingPage() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadMe() {
    const res = await fetch("/api/me", { method: "GET" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load /api/me (${res.status})`);
    }
    return (await res.json()) as MeResponse;
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const me = await loadMe();
        if (alive) setData(me);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function markComplete() {
    try {
      setSaving(true);
      setErr(null);

      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save (${res.status})`);
      }

      const me = await loadMe();
      setData(me);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="bg-neutral-950 text-neutral-100 min-h-screen">
      <div className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <p className="text-sm text-neutral-400 mt-2">
          This page flips <span className="text-neutral-200">onboardingCompleted</span> in your DB user record.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          {loading ? (
            <div className="text-sm text-neutral-300">Loading…</div>
          ) : err ? (
            <div className="text-sm text-red-300 whitespace-pre-wrap">{err}</div>
          ) : data ? (
            <>
              <div className="text-xs text-neutral-400">Current status</div>
              <div className="mt-2 text-sm">
                onboardingCompleted:{" "}
                <span className="text-white font-semibold">
                  {String(data.dbUser.onboardingCompleted)}
                </span>
              </div>

              <button
                onClick={markComplete}
                disabled={saving || data.dbUser.onboardingCompleted}
                className="mt-4 rounded-2xl border border-white/12 bg-white/10 hover:bg-white/14 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {data.dbUser.onboardingCompleted
                  ? "Already completed"
                  : saving
                  ? "Saving…"
                  : "Mark onboarding complete"}
              </button>

              <div className="mt-4 text-xs text-neutral-500">
                After this flips to true, verify it in{" "}
                <span className="text-neutral-200">Profile → Settings → Account</span>.
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
