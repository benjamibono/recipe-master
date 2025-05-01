"use client";

import { useAuthContext } from "../contexts/AuthContext";
import { useRealtimeSubscription } from "@/lib/hooks/useRealtimeSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function RealtimeSubscriptions() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Suscripción a cambios en recetas del usuario
  useRealtimeSubscription(
    "user_recipes",
    {
      table: "recipes",
      filter: user?.id ? `user_id=eq.${user.id}` : "",
    },
    [["recipes"], ["userRecipes", user?.id]]
  );

  // Suscripción a cambios en el perfil del usuario
  useRealtimeSubscription(
    "user_profile",
    {
      table: "profiles",
      filter: user?.id ? `id=eq.${user.id}` : "",
    },
    [["auth", "profile", user?.id]]
  );

  // Suscripción a cambios en recetas compartidas (explore)
  useRealtimeSubscription(
    "shared_recipes",
    {
      table: "recipes",
      filter: user?.id ? `user_id=neq.${user.id}` : "",
    },
    [["sharedRecipes"]]
  );

  // Prefetch periódico de la sesión para mantenerla actualizada en caché
  useEffect(() => {
    // Comprobar y actualizar la sesión cada 10 minutos
    const intervalId = setInterval(async () => {
      if (user) {
        // Solo si hay un usuario activo
        const session = await queryClient.fetchQuery({
          queryKey: ["auth", "session"],
          queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return data.session;
          },
          staleTime: 0, // Forzar la actualización
        });

        // Si la sesión ha caducado, limpiar la caché
        if (!session) {
          queryClient.clear();
        }
      }
    }, 1000 * 60 * 10); // 10 minutos

    return () => clearInterval(intervalId);
  }, [user, queryClient]);

  return null; // Este componente no renderiza nada
}
