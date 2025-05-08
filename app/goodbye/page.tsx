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
    <div className="container max-w-md py-16 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-6">
        {t("goodbye.title", "¡Hasta pronto!")}
      </h1>

      <div className="space-y-6">
        <p>
          {t(
            "goodbye.message",
            "Tu cuenta ha sido eliminada correctamente. Lamentamos verte partir."
          )}
        </p>

        <p>
          {t(
            "goodbye.comeback",
            "Si en algún momento deseas volver, estaremos encantados de tenerte de nuevo con nosotros."
          )}
        </p>

        <div className="pt-6">
          <Link href="/auth/login">
            <Button size="lg">
              {t("goodbye.back_to_login", "Volver a iniciar sesión")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
