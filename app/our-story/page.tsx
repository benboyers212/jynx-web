"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const OLIVE = "#556B2F";

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md px-6 py-5 border-l-[3px]"
      style={{
        background: "rgba(85,107,47,0.04)",
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

export default function OurStoryPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <MarketingNav />

      <main className="flex-1">
        <div className="px-6 md:px-8">
          <div className="max-w-[800px] mx-auto">
            {/* Hero Section */}
            <section className="pt-24 pb-16 md:pt-32 md:pb-24">
              <h1
                className="text-[44px] sm:text-[56px] md:text-[64px] font-bold leading-[1.1] mb-6"
                style={{
                  color: "#111111",
                  letterSpacing: "-0.03em",
                }}
              >
                Our Story
              </h1>

              <p
                className="text-[15px] mb-8"
                style={{
                  color: "rgba(17,17,17,0.42)",
                  letterSpacing: "0.01em",
                }}
              >
                Why we built Jynx.
              </p>

              {/* Subtle olive accent line */}
              <div
                className="w-14 h-[2px]"
                style={{ background: OLIVE }}
              />
            </section>

            {/* Story Body */}
            <section className="pb-24 md:pb-32">
              <div className="space-y-6 text-[18px] text-slate-700" style={{ lineHeight: "1.75" }}>
                <p>
                  Jynx began during a season of our lives when everything felt
                  important.
                </p>

                <p>
                  We were finance students at a highly competitive business
                  school, surrounded by ambition. Everyone was building something.
                  Careers. Résumés. Networks. Futures. Each year raised the bar.
                </p>

                <p>
                  The classes got harder. The recruiting timelines got tighter.
                  The expectations got heavier. We took on more because that is
                  what you do when you are trying to make something of yourself.
                  And for a while, it felt productive. Until it didn't.
                </p>

                <p>
                  From the outside, our schedules looked full and impressive.
                  Inside, it felt different. You wake up ready to work. You move from task to task. You
                  answer emails. Study. Prepare. Plan. Push forward. And at the
                  end of the day, when the noise finally quiets, a thought creeps
                  in.
                </p>

                {/* Visual pause */}
                <p
                  className="text-[19px] md:text-[20px] font-medium mt-12 mb-12"
                  style={{
                    color: "rgb(30,41,59)",
                  }}
                >
                  Why do I still feel behind?
                </p>

                <p>
                  It wasn't laziness. It wasn't lack of discipline. We were
                  working constantly.
                </p>

                <p>It was misalignment.</p>

                <p>
                  We had school. Work. Interview preparation. Clubs.
                  Relationships. Each one mattered. Each one deserved attention.
                  But there was no clear way to decide what deserved attention
                  first. When everything feels important, everything feels urgent.
                </p>

                <p>
                  The tools didn't solve that. They only tracked it. Calendars in
                  one place. Tasks in another. Notes somewhere else. Everything
                  technically organized, but no system deciding how much time each
                  part of your life should actually receive. That is what made us feel behind.
                </p>

                <p>Not a lack of effort.</p>

                <p>A lack of structure around priority.</p>

                <Callout>
                  The tools meant to help us manage our time were quietly taking
                  it.
                </Callout>

                <p>And that was the breaking point. Because we knew something deeper was at stake.</p>

                <p>
                  We were not just working for ourselves. We were thinking about
                  the people who had supported us. The ones who believed in us.
                  The ones we hoped to make proud. The ones we wanted to be able
                  to show up for in meaningful ways.
                </p>

                <p className="font-medium mt-8 mb-2">
                  Ambition, for us, was never only personal.
                </p>

                <p className="font-medium mb-8">It carried responsibility.</p>

                <p>
                  We cared about building strong careers. We cared about doing
                  something significant. But we also cared about being present.
                  About the relationships that actually matter. About not looking
                  back one day and realizing we optimized for achievement and
                  neglected everything else.
                </p>

                <p>
                  Growing up is not just about landing the job. It is about the
                  people you love. The relationships you build. The moments you
                  choose not to miss. That is where the tension lives.
                </p>

                <p>
                  You work hard today because you care about your future and the
                  people in it. But without clarity, the effort starts to blur.
                  Everything feels urgent. Everything feels important. And you
                  slowly begin sacrificing the very presence you are working to
                  protect.
                </p>

                <p>Working hard should not mean feeling perpetually behind. But that is how it felt.</p>

                <p>
                  When AI became widely accessible, we saw possibility. We started
                  experimenting with schedule generation. It was impressive on the
                  surface. It could build something structured. But it didn't understand us.
                </p>

                <p>
                  It didn't know which deadlines were real and which were
                  flexible. It didn't adapt when life shifted. It didn't account
                  for how we actually worked. The more information we gave it, the
                  more generic it felt.
                </p>

                <p>We realized the problem wasn't effort.</p>

                <p>It wasn't intelligence.</p>

                <p>It wasn't even technology.</p>

                <p>It was direction.</p>

                <Callout>AI without structure becomes noise.</Callout>

                <p>So we decided to build the structure.</p>

                <p>
                  We built a system that learns gradually. That adapts. That pays
                  attention to what actually matters. Something that starts as a
                  tool, but over time begins to feel like a partner. At first, you guide it. Then it begins to guide you.
                </p>

                <p>That is Jynx.</p>

                <p>
                  We are building it for people in the middle of becoming
                  something. Students. Young professionals. People with ambition
                  who also want to live fully.
                </p>

                <p>
                  We are not anonymous because we lack conviction. We simply
                  believe the idea matters more than we do.
                </p>

                <p>
                  We live this pressure every day. We understand the weight of
                  expectations. We understand the feeling of being capable but
                  scattered. Jynx is our answer to that.
                </p>

                {/* Ending moment - emotional exhale */}
                <div className="mt-20">
                  <p
                    className="text-[19px] md:text-[20px] font-medium mb-6"
                    style={{ color: "rgb(30,41,59)" }}
                  >
                    Not to help you do more.
                  </p>

                  <p
                    className="text-[19px] md:text-[20px] font-medium mb-6"
                    style={{ color: "rgb(30,41,59)" }}
                  >
                    But to help you feel clear.
                  </p>

                  <p
                    className="text-[19px] md:text-[20px] font-medium pb-8"
                    style={{ color: "rgb(30,41,59)" }}
                  >
                    And when you feel clear, everything changes.
                  </p>
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
