"use client";

import React, { useEffect, useState, type CSSProperties } from "react";

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

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/** Light brand accent (matches My Time) */
const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

const surfaceStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
};

const surfaceSoftStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
};

const brandSoftStyle: CSSProperties = {
  borderColor: rgbaBrand(0.22),
  boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
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

        const res = await fetch("/api/me", { cache: "no-store" });
        const body = await safeJson(res);

        if (!res.ok) {
          const msg =
            (body && (body.error || body.message)) ||
            (body && body.raw) ||
            `Request failed (${res.status})`;
          throw new Error(msg);
        }

        if (alive) setData(body as MeResponse);
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

  const statusLabel = loading ? "Loading…" : err ? "Error" : "Connected";

  return (
    <section className="rounded-3xl border bg-white p-5" style={surfaceStyle}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Account</div>
          <div className="text-xs text-neutral-500 mt-1">
            Clerk session + DB user record
          </div>
        </div>

        <div
          className="text-[11px] text-neutral-700 rounded-full border bg-white px-3 py-1"
          style={err ? surfaceSoftStyle : brandSoftStyle}
        >
          {statusLabel}
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-sm text-neutral-700">Fetching /api/me…</div>
      )}

      {err && (
        <div className="mt-4 text-sm text-red-600">
          {err}
          <div className="text-xs text-neutral-500 mt-1">
            (If you’re logged out, middleware will redirect you to /login.)
          </div>
        </div>
      )}

      {!loading && !err && data && (
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border bg-white p-4" style={surfaceSoftStyle}>
            <div className="text-xs text-neutral-500">Clerk userId</div>
            <div className="mt-1 text-sm text-neutral-900 break-all">
              {data.userId}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4" style={surfaceSoftStyle}>
            <div className="text-xs text-neutral-500">Database user</div>
            <div className="mt-2 grid gap-1 text-sm">
              <div>
                <span className="text-neutral-500">id:</span>{" "}
                <span className="text-neutral-900 break-all">
                  {data.dbUser.id}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">email:</span>{" "}
                <span className="text-neutral-900">
                  {data.dbUser.email ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">name:</span>{" "}
                <span className="text-neutral-900">
                  {data.dbUser.name ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">onboardingCompleted:</span>{" "}
                <span className="text-neutral-900">
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
