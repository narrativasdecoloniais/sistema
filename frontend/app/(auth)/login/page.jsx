import { Suspense } from "react";
import { redirect } from "next/navigation";
import { obterUsuarioAtual, temPapel } from "@/lib/auth";
import TelaAutenticacao from "@/components/publico/TelaAutenticacao";
import LoginForm from "@/components/publico/LoginForm";

export default async function PaginaLogin() {
  const usuario = await obterUsuarioAtual();

  if (usuario) {
    redirect(temPapel(usuario, "ADMIN", "ORGANIZADOR") ? "/admin" : "/participante");
  }

  return (
    <TelaAutenticacao
      eyebrow="Área do participante"
      titulo="Entrar"
      subtitulo="Acesse com o CPF cadastrado no Narrativas."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </TelaAutenticacao>
  );
}
