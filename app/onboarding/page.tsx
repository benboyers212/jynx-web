import { Suspense } from "react";
import OnboardingClient from "./OnboardingClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
      <OnboardingClient />
    </Suspense>
  );
}
