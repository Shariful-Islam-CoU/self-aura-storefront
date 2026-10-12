import { Suspense } from "react";
import { TrackOrderView } from "@/features/checkout/components/TrackOrderView";

function TrackOrderViewWrapper() {
  return <TrackOrderView />;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center">Loading...</div>}>
      <TrackOrderViewWrapper />
    </Suspense>
  );
}