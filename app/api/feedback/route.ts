import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Read env vars at request time for serverless compatibility
    const apiKey = process.env.RESEND_API_KEY;
    const feedbackEmails = process.env.FEEDBACK_EMAILS?.split(",").map((e) => e.trim()) ?? [];

    console.log("Feedback API called");
    console.log("API key exists:", !!apiKey);
    console.log("Feedback emails:", feedbackEmails.length > 0 ? feedbackEmails : "NONE");

    if (!apiKey) {
      console.error("RESEND_API_KEY not set");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    if (feedbackEmails.length === 0) {
      console.error("FEEDBACK_EMAILS environment variable not set");
      return NextResponse.json({ error: "Feedback recipient not configured" }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const { userId } = await auth();
    const user = userId ? await currentUser() : null;

    const body = await req.json();
    const { like, dislike, improve } = body;

    if (!like && !dislike && !improve) {
      return NextResponse.json({ error: "No feedback provided" }, { status: 400 });
    }

    const userName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : "Anonymous User";
    const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "Not logged in";

    const timestamp = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1F8A5B; margin-bottom: 24px;">New Jynx Feedback</h2>

        <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>From:</strong> ${userName}<br/>
            <strong>Email:</strong> ${userEmail}<br/>
            <strong>Submitted:</strong> ${timestamp}
          </p>
        </div>

        ${like ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; font-size: 14px; margin-bottom: 8px;">What they like:</h3>
            <p style="background: #e8f5e9; border-radius: 8px; padding: 12px; margin: 0; color: #2e7d32;">${like}</p>
          </div>
        ` : ""}

        ${dislike ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; font-size: 14px; margin-bottom: 8px;">What doesn't work:</h3>
            <p style="background: #ffebee; border-radius: 8px; padding: 12px; margin: 0; color: #c62828;">${dislike}</p>
          </div>
        ` : ""}

        ${improve ? `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333; font-size: 14px; margin-bottom: 8px;">Suggestions for improvement:</h3>
            <p style="background: #e3f2fd; border-radius: 8px; padding: 12px; margin: 0; color: #1565c0;">${improve}</p>
          </div>
        ` : ""}

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; margin: 0;">
          This feedback was submitted through the Jynx app.
        </p>
      </div>
    `;

    const textContent = `
New Jynx Feedback

From: ${userName}
Email: ${userEmail}
Submitted: ${timestamp}

${like ? `What they like:\n${like}\n\n` : ""}${dislike ? `What doesn't work:\n${dislike}\n\n` : ""}${improve ? `Suggestions for improvement:\n${improve}\n` : ""}
---
This feedback was submitted through the Jynx app.
    `.trim();

    console.log("Sending email to:", feedbackEmails);

    const { data, error } = await resend.emails.send({
      from: "Jynx Feedback <feedback@jynxapp.com>",
      to: feedbackEmails,
      subject: `Jynx Feedback from ${userName}`,
      html: htmlContent,
      text: textContent,
    });

    console.log("Resend response - data:", data, "error:", error);

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
