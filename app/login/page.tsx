"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <SignIn routing="hash" />
    </div>
  );
}
