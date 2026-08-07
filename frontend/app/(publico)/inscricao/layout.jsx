"use client";

import { PrimeReactProvider } from "primereact/api";
import ToastProvider from "@/components/publico/ToastProvider";

export default function LayoutInscricao({ children }) {
  return (
    <PrimeReactProvider value={{ unstyled: true }}>
      <ToastProvider>{children}</ToastProvider>
    </PrimeReactProvider>
  );
}
