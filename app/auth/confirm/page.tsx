"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/app/contexts/LanguageContext";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [message, setMessage] = useState<string>(
    t("auth.confirming", "Confirmando...")
  );
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const handleConfirmation = async () => {
      try {
        // Obtener parámetros de la URL
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const next = searchParams.get("next") || "/auth/login";
        const redirectTo = searchParams.get("redirect_to");

        if (!tokenHash || !type) {
          setError(true);
          setMessage(t("auth.invalid_link", "Enlace de confirmación inválido"));
          return;
        }

        // Para cambio de email
        if (type === "email_change") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email_change",
          });

          if (verifyError) {
            console.error("Error al verificar email:", verifyError);
            setError(true);
            setMessage(
              t(
                "auth.email_verification_failed",
                "La verificación del email falló"
              )
            );
            return;
          }

          // Redirigir a login con un mensaje de éxito
          setMessage(
            t(
              "auth.email_changed_login_required",
              "Email actualizado. Por favor, inicia sesión con tu nuevo email."
            )
          );
          setTimeout(() => {
            const destination =
              redirectTo ||
              "/auth/login?message=" +
                encodeURIComponent(
                  t(
                    "auth.email_changed_login_required",
                    "Email actualizado. Por favor, inicia sesión con tu nuevo email."
                  )
                );
            router.push(destination);
          }, 2000);
          return;
        }

        // Para registro o confirmación de email normal
        if (type === "signup" || type === "email") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type === "signup" ? "signup" : "email",
          });

          if (verifyError) {
            console.error("Error al verificar email:", verifyError);
            setError(true);
            setMessage(
              t(
                "auth.email_verification_failed",
                "La verificación del email falló"
              )
            );
            return;
          }

          // Éxito - Redirigir
          setMessage(
            t(
              "auth.email_verification_success",
              "Email verificado correctamente. Redirigiendo..."
            )
          );
          setTimeout(() => {
            router.push(next);
          }, 2000);
          return;
        }

        setError(true);
        setMessage(
          t(
            "auth.unknown_verification_type",
            "Tipo de verificación desconocido"
          )
        );
      } catch (error) {
        console.error("Error en la confirmación:", error);
        setError(true);
        setMessage(
          t("auth.email_verification_failed", "La verificación del email falló")
        );
      }
    };

    handleConfirmation();
  }, [searchParams, router, t]);

  return (
    <div className="container max-w-md py-16 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4">
        {error
          ? t("auth.error", "Error")
          : t("auth.email_verification", "Verificación de email")}
      </h1>
      <p className={`text-lg ${error ? "text-red-500" : "text-green-500"}`}>
        {message}
      </p>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-md py-16 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold mb-4">Verificación de email</h1>
          <p className="text-lg">Cargando...</p>
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
