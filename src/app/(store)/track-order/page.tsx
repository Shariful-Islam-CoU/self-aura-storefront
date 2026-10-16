import { Suspense } from "react";
import { TrackOrderView } from "@/features/checkout/components/TrackOrderView";
import { LoadingState } from "@/components/ui/LoadingState";

function TrackOrderViewWrapper() {
  return <TrackOrderView />;
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading order tracking..." />}>
      <TrackOrderViewWrapper />
    </Suspense>
  );
}