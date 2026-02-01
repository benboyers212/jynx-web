"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const JYNX_GREEN = "#1F8A5B";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#ffffff" }}>
      <div className="w-full max-w-md">
        {/* Clickable logo → / */}
        <Link href="/" className="flex justify-center mb-8">
          <img src="/jynx-logo.png" alt="Jynx" className="h-10" style={{ objectFit: "contain" }} />
        </Link>

        {/* Clerk SignUp */}
        <SignUp
          routing="path"
          path="/sign-up"
          appearance={{
            variables: {
              colorPrimary: JYNX_GREEN,
              colorBackground: "#ffffff",
              colorText: "#111111",
              colorMuted: "rgba(17,17,17,0.52)",
              colorBorder: "rgba(0,0,0,0.10)",
              borderRadius: "12px",
              fontFamily: "inherit",
              fontSize: "14px",
            },
            elements: {
              card: {
                boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
                borderRadius: "24px",
                border: "1px solid rgba(0,0,0,0.08)",
              },
              headerTitle: {
                fontSize: "20px",
                fontWeight: 600,
                color: "#111111",
              },
              headerSubtitle: {
                fontSize: "13px",
                color: "rgba(17,17,17,0.50)",
              },
              formButtonPrimary: {
                background: JYNX_GREEN,
                borderRadius: "10px",
                fontWeight: 600,
              },
              buttonText: {
                color: "#111111",
                fontSize: "13px",
              },
              input: {
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(0,0,0,0.02)",
                fontSize: "13px",
              },
              footerAction: {
                fontSize: "12px",
                color: "rgba(17,17,17,0.50)",
              },
              footerActionLink: {
                color: JYNX_GREEN,
                fontWeight: 600,
              },
              footer: {
                display: "none",
              },
            },
          }}
        />
      </div>
    </main>
  );
}
