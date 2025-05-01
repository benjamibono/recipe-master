import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type RedirectOptions = {
  ifAuthenticated?: string;
  ifNotAuthenticated?: string;
  message?: {
    authenticated?: string;
    notAuthenticated?: string;
  };
};

/**
 * Hook que verifica el estado de autenticación y redirige según las opciones proporcionadas
 * Utiliza la caché de React Query para evitar llamadas innecesarias a la BD
 */
export function useAuthRedirect(options: RedirectOptions = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Intentar obtener la sesión de la caché primero
      let session = queryClient.getQueryData(["auth", "session"]);

      // Si no está en caché, obtenerla de Supabase y actualizar la caché
      if (session === undefined) {
        const { data } = await supabase.auth.getSession();
        session = data.session;

        // Actualizar la caché con la sesión obtenida
        if (session !== null) {
          queryClient.setQueryData(["auth", "session"], session);
        }
      }

      const isAuthenticated = !!session;

      // Redirigir según el estado de autenticación
      if (isAuthenticated && options.ifAuthenticated) {
        router.push(options.ifAuthenticated);
        if (options.message?.authenticated) {
          toast.info(options.message.authenticated);
        }
      } else if (!isAuthenticated && options.ifNotAuthenticated) {
        router.push(options.ifNotAuthenticated);
        if (options.message?.notAuthenticated) {
          toast.error(options.message.notAuthenticated);
        }
      }
    };

    checkAuthAndRedirect();
  }, [router, queryClient, options]);
}
