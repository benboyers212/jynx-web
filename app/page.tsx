import Link from "next/link";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/schedule", active: true },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white hidden md:flex flex-col">
          {/* Logo placeholder */}
          <div className="px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-xs font-semibold text-neutral-700">
                LOGO
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Jynx</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Your schedule system
                </div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm",
                  t.active
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-neutral-700 hover:bg-neutral-100",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  {t.label === "MyJynx" ? (
                    <div className="h-6 w-6 rounded-full border border-neutral-300 bg-neutral-100 flex items-center justify-center text-[10px] font-semibold text-neutral-700">
                      🙂
                    </div>
                  ) : null}
                  <span>{t.label}</span>
                </div>

                {t.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15">
                    Active
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-500">Signed in as</div>
            <div className="text-sm font-medium text-neutral-900">Ben</div>
          </div>
        </aside>

        {/* Mobile top nav */}
        <header className="md:hidden w-full border-b border-neutral-200 bg-white">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center text-[10px] font-semibold text-neutral-700">
                LOGO
              </div>
              <div className="text-sm font-semibold text-neutral-900">Jynx</div>
            </div>
            <div className="text-sm text-neutral-500">Schedule</div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="border-b border-neutral-200 bg-white">
            <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-center">
              <div className="text-base font-semibold text-neutral-900">
                Schedule
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid grid-cols-12 gap-8">
              {/* Schedule timeline */}
              <section className="col-span-12 lg:col-span-8">
                {/* Today */}
                <div className="text-xs font-medium text-neutral-500 mb-3">
                  Today · Thu, Sep 12
                </div>

                <div className="space-y-4">
                  <TimeBlock
                    time="9:30 AM"
                    title="F305 — Intermediate Investments"
                    meta="Hodge Hall 2056 · Exam 1 review"
                    tag="Class"
                  />
                  <TimeBlock
                    time="11:00 AM"
                    title="Deep Work — Problem Set"
                    meta="Focus block · 90 min"
                    tag="Work"
                  />
                  <TimeBlock
                    time="2:00 PM"
                    title="Gym"
                    meta="Chest + tris · 60 min"
                    tag="Health"
                  />
                  <TimeBlock
                    time="7:00 PM"
                    title="Prep — F305 reading"
                    meta="Ch. 7 · 25 min"
                    tag="Prep"
                  />
                </div>

                {/* Tomorrow preview */}
                <div className="mt-10 pt-6 border-t border-neutral-200">
                  <div className="text-xs font-medium text-neutral-500 mb-3">
                    Tomorrow · Fri, Sep 13
                  </div>

                  <div className="space-y-4">
                    <TimeBlock
                      time="10:00 AM"
                      title="F305 — Lecture"
                      meta="Hodge Hall 2056 · Portfolio theory"
                      tag="Class"
                    />
                    <TimeBlock
                      time="1:00 PM"
                      title="Study — F305"
                      meta="Review notes · 60 min"
                      tag="Study"
                    />
                    <TimeBlock
                      time="6:30 PM"
                      title="Dinner + reset"
                      meta="Light night · 45 min"
                      tag="Life"
                    />
                  </div>
                </div>
              </section>

              {/* Right panel */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="text-sm font-semibold text-neutral-900">
                    Focus snapshot
                  </div>

                  <ul className="mt-3 space-y-2 text-sm text-neutral-700 list-disc pl-5">
                    <li>You get the most productive late morning.</li>
                    <li>Keep hardest tasks before 2 PM when possible.</li>
                    <li>Short prep blocks work better than long sessions.</li>
                  </ul>
                </div>
              </aside>
            </div>

            {/* Mobile bottom nav */}
            <nav className="md:hidden mt-8 border border-neutral-200 bg-white rounded-2xl overflow-hidden">
              <div className="grid grid-cols-5">
                {tabs.map((t) => (
                  <Link
                    key={t.label}
                    href={t.href}
                    className={[
                      "px-2 py-3 text-center text-xs",
                      t.active
                        ? "font-semibold text-neutral-900"
                        : "text-neutral-500 hover:text-neutral-800",
                    ].join(" ")}
                  >
                    {t.label}
                    {t.active && (
                      <div className="mx-auto mt-1 h-[3px] w-6 rounded-full bg-neutral-900" />
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </main>
  );
}

function TimeBlock({
  time,
  title,
  meta,
  tag,
}: {
  time: string;
  title: string;
  meta: string;
  tag: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="w-24 shrink-0">
        <div className="text-sm font-medium text-neutral-900">{time}</div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-neutral-200" />
        <div className="absolute left-[-16px] top-2 h-2 w-2 rounded-full bg-neutral-400" />

        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 hover:bg-neutral-50 transition">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-neutral-900">
                {title}
              </div>
              <div className="mt-1 text-xs text-neutral-500">{meta}</div>
            </div>
            <span className="text-[11px] font-medium text-neutral-600 border border-neutral-200 rounded-full px-2 py-1">
              {tag}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
