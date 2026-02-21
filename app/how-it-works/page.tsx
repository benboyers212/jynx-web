"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const OLIVE = "#556B2F";

export default function HowItWorksPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <MarketingNav />

      <main className="flex-1">
        <div className="px-6 md:px-8">
          <div className="max-w-[1100px] mx-auto">
            {/* Hero Section */}
            <section className="pt-24 pb-16 md:pt-32 md:pb-24">
              <h1
                className="text-[44px] sm:text-[56px] md:text-[64px] font-bold leading-[1.1] mb-6"
                style={{
                  color: "#111111",
                  letterSpacing: "-0.03em",
                }}
              >
                How it works
              </h1>

              <p
                className="text-[15px] mb-8"
                style={{
                  color: "rgba(17,17,17,0.42)",
                  letterSpacing: "0.01em",
                }}
              >
                Three core pillars that work together to bring clarity to your
                time.
              </p>

              {/* Subtle olive accent line */}
              <div
                className="w-14 h-[2px]"
                style={{ background: OLIVE }}
              />
            </section>

            {/* Section 1: Schedule (text left, visual right) */}
            <section className="py-16 md:py-24">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                {/* Text */}
                <div>
                  <h2
                    className="text-[28px] md:text-[32px] font-bold mb-4"
                    style={{
                      color: "#111111",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Schedule
                  </h2>
                  <div
                    className="w-10 h-[2px] mb-6"
                    style={{ background: OLIVE }}
                  />
                  <div className="space-y-5 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                    <p>
                      Schedule is where structure lives.
                    </p>
                    <p>
                      It maps your fixed commitments first — classes, meetings, work, recurring obligations.
                    </p>
                    <p>
                      Then it allocates space intentionally for preparation, deep work, and recovery.
                    </p>
                    <p>
                      It does not just react to what is due tomorrow. It keeps your long-term goals in view while organizing your week realistically.
                    </p>
                    <p>
                      As you use it, it adapts. It recognizes patterns. It becomes more aligned with how you actually operate.
                    </p>
                    <p>
                      This is not auto-filling a calendar. It is structured direction.
                    </p>
                  </div>
                </div>

                {/* Visual placeholder */}
                <div>
                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: "rgba(0,0,0,0.08)",
                      background: "rgba(247,248,250,0.80)",
                      aspectRatio: "4/3",
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "rgba(17,17,17,0.16)" }}
                    >
                      <div className="text-center">
                        <svg
                          className="mx-auto mb-3"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        <div
                          className="text-[12px] font-medium"
                          style={{ color: "rgba(17,17,17,0.22)" }}
                        >
                          Schedule interface
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: My Time (text right, visual left) */}
            <section className="py-16 md:py-24">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                {/* Visual placeholder */}
                <div className="md:order-1">
                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: "rgba(0,0,0,0.08)",
                      background: "rgba(247,248,250,0.80)",
                      aspectRatio: "4/3",
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "rgba(17,17,17,0.16)" }}
                    >
                      <div className="text-center">
                        <svg
                          className="mx-auto mb-3"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        <div
                          className="text-[12px] font-medium"
                          style={{ color: "rgba(17,17,17,0.22)" }}
                        >
                          My Time interface
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="md:order-2">
                  <h2
                    className="text-[28px] md:text-[32px] font-bold mb-4"
                    style={{
                      color: "#111111",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    My Time
                  </h2>
                  <div
                    className="w-10 h-[2px] mb-6"
                    style={{ background: OLIVE }}
                  />
                  <div className="space-y-5 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                    <p>
                      My Time is awareness.
                    </p>
                    <p>
                      It shows you how your time is actually distributed across school, work, preparation, and life.
                    </p>
                    <p>
                      You begin to see patterns. Where you are over-investing. Where you are neglecting. Where effort and outcome disconnect.
                    </p>
                    <p>
                      As you interact with it, the system learns. Not from guesses. From behavior.
                    </p>
                    <p>
                      You learn about yourself. The system learns about you.
                    </p>
                    <p>
                      That alignment compounds.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Groups (text left, visual right) */}
            <section className="py-16 md:py-24">
              <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                {/* Text */}
                <div>
                  <h2
                    className="text-[28px] md:text-[32px] font-bold mb-4"
                    style={{
                      color: "#111111",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Groups
                  </h2>
                  <div
                    className="w-10 h-[2px] mb-6"
                    style={{ background: OLIVE }}
                  />
                  <div className="space-y-5 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                    <p>
                      Groups bring structure to shared effort.
                    </p>
                    <p>
                      Whether it is academic, professional, or interest-based, Groups keep collaboration aligned with your personal structure.
                    </p>
                    <p>
                      Shared commitments show up clearly. Coordination does not require constant context switching.
                    </p>
                    <p>
                      You remain connected without losing direction.
                    </p>
                    <p>
                      It is not just organization. It is aligned momentum.
                    </p>
                  </div>
                </div>

                {/* Visual placeholder */}
                <div>
                  <div
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      borderColor: "rgba(0,0,0,0.08)",
                      background: "rgba(247,248,250,0.80)",
                      aspectRatio: "4/3",
                    }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: "rgba(17,17,17,0.16)" }}
                    >
                      <div className="text-center">
                        <svg
                          className="mx-auto mb-3"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        <div
                          className="text-[12px] font-medium"
                          style={{ color: "rgba(17,17,17,0.22)" }}
                        >
                          Groups interface
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
