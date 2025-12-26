import Link from "next/link";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/", active: true },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50">
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
                <div className="text-xs text-neutral-500">
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
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  t.active
                    ? "bg-neutral-900 text-white font-semibold"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>{t.label}</span>
                {t.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15">
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
            <div className="max-w-6xl mx-auto px-6 py-4 text-center text-lg font-semibold">
              Schedule
            </div>
          </header>

          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-12 gap-10">
            {/* Schedule */}
            <section className="col-span-12 lg:col-span-8">
              <Section title="Today · Thu, Sep 12">
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
              </Section>

              <Section title="Tomorrow · Fri, Sep 13">
                <TimeBlock
                  time="10:00 AM"
                  title="F305 — Lecture"
                  meta="Portfolio theory"
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
              </Section>
            </section>

            {/* Focus snapshot */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="text-sm font-semibold mb-4">
                  Focus snapshot
                </div>

                <ul className="space-y-3 text-sm list-disc pl-5">
                  <li>Most productive in the late morning</li>
                  <li>Schedule hardest tasks before 2 PM</li>
                  <li>Short prep blocks beat long sessions</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="text-xs font-medium text-neutral-500 mb-4">
        {title}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
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
    <div className="flex gap-6">
      <div className="w-24 text-sm font-semibold">{time}</div>

      <div className="relative flex-1">
        <div className="absolute left-[-20px] top-0 bottom-0 w-[2px] bg-neutral-300" />
        <div className="absolute left-[-26px] top-3 h-4 w-4 rounded-full bg-neutral-900" />

        <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4">
          <div className="flex justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-neutral-500 mt-1">{meta}</div>
            </div>
            <span className="text-[11px] border border-neutral-200 rounded-full px-2 py-1">
              {tag}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
