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

export default function AccountPanel() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch("/api/me", { method: "GET" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed (${res.status})`);
        }

        const json = (await res.json()) as MeResponse;
        if (alive) setData(json);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Something went wrong");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Account</div>
          <div className="text-xs text-neutral-400 mt-1">
            Clerk session + DB user record
          </div>
        </div>

        <div className="text-[11px] text-neutral-300 rounded-full border border-white/10 bg-white/5 px-3 py-1">
          {loading ? "Loading…" : err ? "Error" : "Connected"}
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-sm text-neutral-300">Fetching /api/me…</div>
      )}

      {err && (
        <div className="mt-4 text-sm text-red-300">
          {err}
          <div className="text-xs text-neutral-400 mt-1">
            (If you’re logged out, middleware will redirect you to /login.)
          </div>
        </div>
      )}

      {!loading && !err && data && (
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-neutral-400">Clerk userId</div>
            <div className="mt-1 text-sm text-white break-all">{data.userId}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-neutral-400">Database user</div>
            <div className="mt-2 grid gap-1 text-sm">
              <div>
                <span className="text-neutral-400">id:</span>{" "}
                <span className="text-white break-all">{data.dbUser.id}</span>
              </div>
              <div>
                <span className="text-neutral-400">email:</span>{" "}
                <span className="text-white">{data.dbUser.email ?? "—"}</span>
              </div>
              <div>
                <span className="text-neutral-400">name:</span>{" "}
                <span className="text-white">{data.dbUser.name ?? "—"}</span>
              </div>
              <div>
                <span className="text-neutral-400">onboardingCompleted:</span>{" "}
                <span className="text-white">
                  {String(data.dbUser.onboardingCompleted)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
