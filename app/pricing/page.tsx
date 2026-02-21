"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check } from "lucide-react";

const JYNX_GREEN = "#1F8A5B";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Access to core features",
      features: [
        "Schedule planning",
        "My Time insights",
        "Groups coordination",
        "Limited AI chats per month",
        "Full access to structure",
      ],
      cta: "Get started free",
      href: "/sign-up",
      highlighted: false,
    },
    {
      name: "Premium Monthly",
      price: "$20",
      period: "per month",
      description: "Expanded AI and advanced features",
      features: [
        "Everything in Free",
        "Expanded AI chats",
        "Advanced features",
        "Priority improvements",
        "Early access to new tools",
      ],
      cta: "Start Premium",
      href: "/sign-up",
      highlighted: true,
    },
    {
      name: "6 Month Plan",
      price: "$110",
      period: "billed every 6 months",
      description: "Save with longer commitment",
      features: [
        "Everything in Premium",
        "Slight discount",
        "$18.33/month effective rate",
      ],
      cta: "Choose 6 months",
      href: "/sign-up",
      highlighted: false,
    },
    {
      name: "1 Year Plan",
      price: "$200",
      period: "billed annually",
      description: "Best value for committed users",
      features: [
        "Everything in Premium",
        "Best value",
        "$16.67/month effective rate",
      ],
      cta: "Choose 1 year",
      href: "/sign-up",
      highlighted: false,
    },
  ];

  const comparisonFeatures = [
    { name: "Core scheduling", free: true, premium: true },
    { name: "My Time insights", free: true, premium: true },
    { name: "Groups", free: true, premium: true },
    { name: "AI Chat Limits", free: "Limited", premium: "Expanded" },
    { name: "Advanced features", free: false, premium: true },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <MarketingNav />

      <main className="flex-1 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1
              className="text-[48px] font-bold leading-tight mb-4"
              style={{
                color: "#111111",
                letterSpacing: "-0.03em",
              }}
            >
              Simple pricing. Built to help.
            </h1>
            <p
              className="text-[17px]"
              style={{ color: "rgba(17,17,17,0.50)" }}
            >
              Start free. Upgrade when you're ready.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-8 border"
                style={{
                  borderColor: plan.highlighted
                    ? JYNX_GREEN
                    : "rgba(0,0,0,0.08)",
                  background: plan.highlighted
                    ? "rgba(31,138,91,0.02)"
                    : "#ffffff",
                  boxShadow: plan.highlighted
                    ? "0 8px 32px rgba(31,138,91,0.12)"
                    : "0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                {/* Plan Name */}
                <h3
                  className="text-[18px] font-bold mb-1"
                  style={{ color: "#111111" }}
                >
                  {plan.name}
                </h3>
                <p
                  className="text-[13px] mb-6"
                  style={{ color: "rgba(17,17,17,0.45)" }}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span
                    className="text-[42px] font-bold"
                    style={{ color: "#111111", letterSpacing: "-0.02em" }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className="text-[14px] ml-1"
                    style={{ color: "rgba(17,17,17,0.40)" }}
                  >
                    {plan.period}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={plan.href}
                  className="block w-full text-center rounded-full px-6 py-3 text-[13px] font-semibold transition hover:opacity-85 mb-6"
                  style={
                    plan.highlighted
                      ? {
                          background: JYNX_GREEN,
                          color: "white",
                          boxShadow: "0 4px 16px rgba(31,138,91,0.20)",
                        }
                      : {
                          background: "rgba(0,0,0,0.04)",
                          color: "rgba(17,17,17,0.75)",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }
                  }
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check
                        className="shrink-0 mt-0.5"
                        size={16}
                        style={{ color: JYNX_GREEN }}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: "rgba(17,17,17,0.60)" }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-[24px] font-bold mb-8 text-center"
              style={{ color: "#111111", letterSpacing: "-0.02em" }}
            >
              Feature comparison
            </h2>

            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: "rgba(0,0,0,0.08)",
                background: "#ffffff",
              }}
            >
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: "rgba(247,248,250,0.80)",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <th
                      className="text-left px-6 py-4 text-[13px] font-semibold"
                      style={{ color: "rgba(17,17,17,0.60)" }}
                    >
                      Feature
                    </th>
                    <th
                      className="text-center px-6 py-4 text-[13px] font-semibold"
                      style={{ color: "rgba(17,17,17,0.60)" }}
                    >
                      Free
                    </th>
                    <th
                      className="text-center px-6 py-4 text-[13px] font-semibold"
                      style={{ color: "rgba(17,17,17,0.60)" }}
                    >
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr
                      key={feature.name}
                      style={{
                        borderBottom:
                          idx !== comparisonFeatures.length - 1
                            ? "1px solid rgba(0,0,0,0.04)"
                            : "none",
                      }}
                    >
                      <td
                        className="px-6 py-4 text-[14px]"
                        style={{ color: "rgba(17,17,17,0.70)" }}
                      >
                        {feature.name}
                      </td>
                      <td className="text-center px-6 py-4">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Check size={18} style={{ color: JYNX_GREEN, margin: "0 auto" }} />
                          ) : (
                            <span style={{ color: "rgba(17,17,17,0.20)" }}>—</span>
                          )
                        ) : (
                          <span
                            className="text-[13px]"
                            style={{ color: "rgba(17,17,17,0.55)" }}
                          >
                            {feature.free}
                          </span>
                        )}
                      </td>
                      <td className="text-center px-6 py-4">
                        {typeof feature.premium === "boolean" ? (
                          feature.premium ? (
                            <Check size={18} style={{ color: JYNX_GREEN, margin: "0 auto" }} />
                          ) : (
                            <span style={{ color: "rgba(17,17,17,0.20)" }}>—</span>
                          )
                        ) : (
                          <span
                            className="text-[13px]"
                            style={{ color: "rgba(17,17,17,0.55)" }}
                          >
                            {feature.premium}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Messaging */}
            <p
              className="text-center mt-10 text-[15px] max-w-xl mx-auto"
              style={{ color: "rgba(17,17,17,0.50)" }}
            >
              We're here to help. Premium is for power users. Free is not
              crippleware—it's a complete, useful product.
            </p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
