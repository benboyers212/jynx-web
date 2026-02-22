import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { analyzeScheduleHealth } from "@/lib/ai/scheduleAnalysis";

export async function GET(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Get schedule health analysis for next 14 days
    const analysis = await analyzeScheduleHealth(user.id, 14, "all");

    // Transform insights into the format expected by the frontend
    const insights = [];

    // Add summary insight
    insights.push({
      id: "summary",
      type: "summary" as const,
      icon: analysis.score >= 70 ? "✓" : "!",
      title: `Schedule Health: ${analysis.score}/100`,
      description: analysis.summary,
      color: analysis.score >= 90 ? "green" : analysis.score >= 70 ? "blue" : analysis.score >= 50 ? "yellow" : "red",
    });

    // Add pattern insights (group similar insights)
    const highPriorityInsights = analysis.insights.filter((i) => i.severity === "high");
    const mediumPriorityInsights = analysis.insights.filter((i) => i.severity === "medium");

    if (highPriorityInsights.length > 0) {
      insights.push({
        id: "high-priority",
        type: "patterns" as const,
        icon: "⚠",
        title: "Needs Attention",
        description: `Found ${highPriorityInsights.length} high-priority issue${highPriorityInsights.length > 1 ? "s" : ""}: ${highPriorityInsights.map((i) => i.title).join(", ")}`,
        color: "red",
      });
    }

    if (mediumPriorityInsights.length > 0) {
      insights.push({
        id: "medium-priority",
        type: "patterns" as const,
        icon: "💡",
        title: "Optimization Opportunities",
        description: `${mediumPriorityInsights.length} area${mediumPriorityInsights.length > 1 ? "s" : ""} to improve: ${mediumPriorityInsights.map((i) => i.title).join(", ")}`,
        color: "yellow",
      });
    }

    // Add top suggestions
    const allSuggestions = analysis.insights
      .filter((i) => i.suggestions && i.suggestions.length > 0)
      .slice(0, 3) // Top 3 issues with suggestions
      .flatMap((i) => i.suggestions || [])
      .slice(0, 5); // Max 5 suggestions total

    if (allSuggestions.length > 0) {
      insights.push({
        id: "suggestions",
        type: "suggestions" as const,
        icon: "→",
        title: "Suggested Actions",
        description: allSuggestions.join(" • "),
        color: "blue",
      });
    }

    // If no insights generated, add a positive message
    if (insights.length === 1 && analysis.score >= 90) {
      insights.push({
        id: "all-good",
        type: "summary" as const,
        icon: "✨",
        title: "Looking Great",
        description: "Your schedule is well-balanced. Keep up the good work!",
        color: "green",
      });
    }

    return NextResponse.json({ insights, analysis });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json({ insights: [], error: String(error) }, { status: 500 });
  }
}
