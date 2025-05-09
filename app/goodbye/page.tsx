"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";

export default function GoodbyePage() {
  const { t } = useLanguage();

  // Redirigir si el usuario está autenticado
  useAuthRedirect({
    ifAuthenticated: "/", // Redirige a la página principal si está autenticado
    message: {
      authenticated: t(
        "goodbye.already_logged_in",
        "Esta página solo es accesible después de eliminar la cuenta"
      ),
    },
  });

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 text-center">
      <h1 className="text-3xl font-bold mb-6">¡Hasta pronto!</h1>

      <div className="max-w-md mb-8">
        <p className="mb-4">
          Tu cuenta ha sido eliminada correctamente. Lamentamos verte partir y
          esperamos que hayas disfrutado usando nuestra aplicación.
        </p>
        <p>
          Si cambias de opinión, siempre puedes crear una nueva cuenta y volver
          a disfrutar de nuestros servicios.
        </p>
      </div>

      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
