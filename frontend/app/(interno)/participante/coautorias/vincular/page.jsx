import { Suspense } from "react";
import VincularCoautoria from "@/components/interno/VincularCoautoria";

export default function PaginaVincularCoautoria() {
  return (
    <Suspense fallback={null}>
      <VincularCoautoria />
    </Suspense>
  );
}
