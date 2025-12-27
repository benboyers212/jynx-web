"use client";
import Link from "next/link";
import { useState } from "react";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/", active: true },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
  { label: "Files", href: "/files" },
];

const OLIVE = "#556B2F";

function getTagStyle(tag: string) {
  const base = {
    borderColor: "rgba(17,17,17,0.10)",
    color: "#111111",
    backgroundColor: "rgba(85,107,47,0.10)",
  };

  const map: Record<
    string,
    { backgroundColor: string; color: string; borderColor: string }
  > = {
    Class: {
      backgroundColor: "rgba(85,107,47,0.12)",
      color: "#2F3A1F",
      borderColor: "rgba(85,107,47,0.25)",
    },
    Work: {
      backgroundColor: "rgba(17,17,17,0.06)",
      color: "#111111",
      borderColor: "rgba(17,17,17,0.12)",
    },
    Health: {
      backgroundColor: "rgba(85,107,47,0.16)",
      color: "#243016",
      borderColor: "rgba(85,107,47,0.30)",
    },
    Prep: {
      backgroundColor: "rgba(85,107,47,0.08)",
      color: "#33401F",
      borderColor: "rgba(85,107,47,0.20)",
    },
    Study: {
      backgroundColor: "rgba(17,17,17,0.05)",
      color: "#111111",
      borderColor: "rgba(17,17,17,0.10)",
    },
    Life: {
      backgroundColor: "rgba(85,107,47,0.09)",
      color: "#2F3A1F",
      borderColor: "rgba(85,107,47,0.20)",
    },
  };

  return map[tag] ?? base;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Pulse is ONLY for the outer ring. The dot itself stays visible. */}
      <style>{`
        @keyframes jynxRing {
          0%   { transform: scale(1);   opacity: 0.22; }
          70%  { transform: scale(2.8); opacity: 0.00; }
          100% { transform: scale(2.8); opacity: 0.00; }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white hidden md:flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center text-xs font-semibold">
                LOGO
              </div>
              <div>
                <div className="text-sm font-semibold">Jynx</div>
                <div className="text-xs text-neutral-500">Your schedule system</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition"
                style={
                  t.active
                    ? { backgroundColor: OLIVE, color: "white", fontWeight: 600 }
                    : { color: "#404040" }
                }
              >
                <span>{t.label}</span>
                {t.active && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.18)" }}
                  >
                    Active
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <header className="border-b border-neutral-200 bg-white">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                {/* Dot inline with title */}
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-2.5 w-2.5">
                    {/* animated ring */}
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: OLIVE,
                        animation: "jynxRing 2.8s ease-out infinite",
                      }}
                    />
                    {/* solid dot (always visible) */}
                    <span
                      className="relative rounded-full h-2.5 w-2.5"
                      style={{ backgroundColor: OLIVE }}
                    />
                  </span>

                  <div className="text-lg font-semibold leading-tight">Schedule</div>
                </div>

                <div className="text-xs text-neutral-500">Today · Optimized for focus</div>
              </div>
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-6 py-7 grid grid-cols-12 gap-8">
            {/* Schedule */}
            <section className="col-span-12 lg:col-span-8">
              <Section title="Today · Thu, Sep 12">
                <TimeBlock
                  olive={OLIVE}
                  time="9:30 AM"
                  title="F305 — Intermediate Investments"
                  meta="Hodge Hall 2056 · Exam 1 review"
                  tag="Class"
                />
                <TimeBlock
                  olive={OLIVE}
                  time="11:00 AM"
                  title="Deep Work — Problem Set"
                  meta="Focus block · 90 min"
                  tag="Work"
                />
                <TimeBlock
                  olive={OLIVE}
                  time="2:00 PM"
                  title="Gym"
                  meta="Chest + tris · 60 min"
                  tag="Health"
                />
                <TimeBlock
                  olive={OLIVE}
                  time="7:00 PM"
                  title="Prep — F305 reading"
                  meta="Ch. 7 · 25 min"
                  tag="Prep"
                />
              </Section>

              <Section title="Tomorrow · Fri, Sep 13">
                <TimeBlock
                  olive={OLIVE}
                  time="10:00 AM"
                  title="F305 — Lecture"
                  meta="Portfolio theory"
                  tag="Class"
                />
                <TimeBlock
                  olive={OLIVE}
                  time="1:00 PM"
                  title="Study — F305"
                  meta="Review notes · 60 min"
                  tag="Study"
                />
                <TimeBlock
                  olive={OLIVE}
                  time="6:30 PM"
                  title="Dinner + reset"
                  meta="Light night · 45 min"
                  tag="Life"
                />
              </Section>
            </section>

            {/* Right column */}
            <aside className="col-span-12 lg:col-span-4 space-y-6">
              {/* NEW: Today’s focus (olive tint) */}
              <div
                className="rounded-2xl border border-neutral-200 p-5"
                style={{ background: "rgba(85,107,47,0.04)" }}
              >
                <div className="text-sm font-semibold mb-2">Today’s focus</div>
                <div className="text-sm text-neutral-700 leading-relaxed">
                  Your most demanding work is earlier today. Protect that window and keep
                  distractions low.
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="text-sm font-semibold mb-4">Patterns</div>

                <ul className="space-y-3 text-sm list-disc pl-5">
                  <li>Most productive in the late morning</li>
                  <li>Schedule hardest tasks before 2 PM</li>
                  <li>Short prep blocks beat long sessions</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold">Quick chat</div>
                  <div className="text-xs text-neutral-500">AI assistant</div>
                </div>

                <div className="text-sm text-neutral-700 leading-relaxed">
                  Ask anything about your schedule — changes, conflicts, what to focus on next,
                  or what you should prep for today.
                </div>

                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                  Example: Move my gym after class, and add a 45-min F305 study block before
                  dinner.
                </div>

                <div className="mt-4 flex justify-center">
                  <button className="text-sm px-6 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50">
                    Clear
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="text-xs font-medium text-neutral-500 mb-4">{title}</div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function TimeBlock({
  time,
  title,
  meta,
  tag,
  olive,
}: {
  time: string;
  title: string;
  meta: string;
  tag: string;
  olive: string;
}) {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="flex gap-6">
      {/* Time */}
      <div className="w-24 text-sm font-semibold flex items-center text-neutral-900">
        {time}
      </div>

      <div className="relative flex-1">
        {/* Timeline spine */}
        <div className="absolute left-[-20px] top-0 bottom-0 w-[2px] bg-neutral-200/70" />

        {/* Timeline dot (always visible) */}
        <button
          type="button"
          onClick={() => setCompleted((v) => !v)}
          className="absolute left-[-27px] top-1/2 -translate-y-1/2 h-[14px] w-[14px] rounded-full ring-[5px] ring-white shadow-sm transition z-10"
          style={{
            backgroundColor: completed ? "#CBD5E1" : olive,
            cursor: "pointer",
          }}
          aria-label={completed ? "Mark as not complete" : "Mark as complete"}
          title={completed ? "Mark as not complete" : "Mark as complete"}
        >
          {/* pulsing ring ONLY when not completed */}
          {!completed && (
            <span
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: olive,
                animation: "jynxRing 2.8s ease-out infinite",
              }}
            />
          )}

          {completed && (
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="relative h-[10px] w-[10px] mx-auto text-white"
              style={{ marginTop: "1px" }}
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.9a1 1 0 011.4-1.4l3 3 6.7-6.7a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Card */}
        <div
          className="rounded-2xl border border-neutral-200/80 bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          style={{
            opacity: completed ? 0.92 : 1,
            filter: completed ? "saturate(0.95)" : "none",
          }}
        >
          <div className="flex justify-between items-center gap-4">
            <div>
              <div className="text-sm font-semibold text-neutral-900">{title}</div>
              <div className="text-xs text-neutral-500 mt-1">{meta}</div>
            </div>

            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide"
              style={getTagStyle(tag)}
            >
              {tag}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
