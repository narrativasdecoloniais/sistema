"use client";

import { PrimeReactProvider } from "primereact/api";

// ToastProvider agora é global (ver app/(publico)/layout.jsx) — este layout
// só precisa mais adicionar o PrimeReactProvider, que fica escopado aqui
// porque é o único trecho do site público que usa PrimeReact (Stepper do
// fluxo de inscrição, ver CLAUDE.md).
export default function LayoutInscricao({ children }) {
  return <PrimeReactProvider value={{ unstyled: true }}>{children}</PrimeReactProvider>;
}
