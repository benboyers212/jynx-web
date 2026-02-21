"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const OLIVE = "#556B2F";

// Reusable components
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs uppercase font-semibold mb-8"
      style={{
        color: "rgb(100,116,139)",
        letterSpacing: "0.22em",
      }}
    >
      {children}
    </h2>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg px-6 py-5 border-l-[3px]"
      style={{
        background: "rgba(85,107,47,0.05)",
        borderLeftColor: OLIVE,
      }}
    >
      <p
        className="text-[18px]"
        style={{
          color: "rgb(55,65,81)",
          lineHeight: "1.75",
        }}
      >
        {children}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <MarketingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="px-6">
          <div className="max-w-[760px] mx-auto">
            <section className="pt-24 pb-20 md:pt-32 md:pb-28">
              <h1
                className="text-[44px] sm:text-[56px] md:text-[64px] font-bold leading-[1.1] mb-8"
                style={{
                  color: "#111111",
                  letterSpacing: "-0.03em",
                }}
              >
                Clarity without chaos.
                <br />
                Structure without stress.
              </h1>

              <p
                className="text-[15px] mb-8"
                style={{
                  color: "rgba(17,17,17,0.42)",
                  letterSpacing: "0.01em",
                }}
              >
                Modern life is busier than ever. Time is the constraint.
              </p>

              {/* Subtle olive accent line under hero */}
              <div
                className="w-12 h-[2px]"
                style={{ background: OLIVE }}
              />
            </section>
          </div>
        </div>

        {/* Section 1: The Problem (white background) */}
        <div style={{ background: "#ffffff" }}>
          <div className="px-6 py-16 md:py-24">
            <div className="max-w-[760px] mx-auto">
              <SectionLabel>The problem</SectionLabel>

              <div className="space-y-6 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                <p>Life keeps getting busier.</p>

                <p>
                  Students juggle classes, recruiting, internships, workouts, relationships, and long-term ambition. Young professionals balance meetings, deadlines, career development, and personal commitments.
                </p>

                <p>Time is the bottleneck.</p>

                <p>
                  But the deeper issue is not laziness or lack of discipline. It is the absence of a system that helps decide what deserves attention and how much.
                </p>

                <Callout>
                  When everything feels important, everything feels urgent. Without structure around priority, effort becomes scattered.
                </Callout>

                <p>
                  You end the day exhausted. You worked hard. But you are left wondering whether you moved forward on what actually matters.
                </p>

                <p>
                  That is the real problem. Not a lack of ambition. Misalignment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: The Solution (olive tinted background) */}
        <div style={{ background: "rgba(85,107,47,0.04)" }}>
          <div className="px-6 py-16 md:py-24">
            <div className="max-w-[760px] mx-auto">
              <SectionLabel>The solution</SectionLabel>

              <div className="space-y-6 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                <p>
                  Jynx is structured AI. It does not add tasks. It creates structure around priority.
                </p>

                <p>
                  It learns gradually. Your fixed commitments. Your working rhythms. Your long-term direction. Your actual constraints.
                </p>

                <p>
                  At first, you guide it. You adjust. You shape. You correct. Then something shifts. It starts guiding you.
                </p>

                <p>
                  It adapts when your week changes. It reorganizes when priorities shift. It keeps long-term direction in view while organizing day-to-day reality.
                </p>

                <Callout>
                  This is not auto-scheduling. It is a system that learns how you operate and builds clarity around what matters.
                </Callout>

                <p>
                  Less noise. More direction. One place to see what deserves your attention and when.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Why It Works (white background) */}
        <div style={{ background: "#ffffff" }}>
          <div className="px-6 py-16 md:py-24">
            <div className="max-w-[760px] mx-auto">
              <SectionLabel>Why it works</SectionLabel>

              <div className="space-y-6 text-[18px] text-slate-700 pb-16" style={{ lineHeight: "1.75" }}>
                <p>Jynx respects attention.</p>

                <p>
                  It does not overwhelm you with notifications or gamified streaks. It builds clarity without turning life into a checklist.
                </p>

                <p>
                  You see where your time goes. Where you are over-investing. Where you are neglecting. Where effort and outcome disconnect.
                </p>

                <p>
                  Less reactive. More intentional. Clearer decisions.
                </p>

                <p>
                  This is not productivity theater. It is a calm, structured approach to living with direction.
                </p>

                <p className="pt-2">
                  Built by founders who live this pressure every day, Jynx is forward-looking, minimal, and focused.
                </p>

                <p>
                  It is the system we needed. Now it is here for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
