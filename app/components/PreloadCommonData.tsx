"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "../contexts/AuthContext";

export function PreloadCommonData() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user) return;

    // Precargar datos comunes
    const preloadData = async () => {
      // Precargar categorías
      queryClient.prefetchQuery({
        queryKey: ["categories"],
        queryFn: async () => {
          const { data } = await supabase.from("categories").select("*");
          return data;
        },
      });

      // Precargar unidades de medida
      queryClient.prefetchQuery({
        queryKey: ["units"],
        queryFn: async () => {
          const { data } = await supabase.from("units").select("*");
          return data;
        },
      });

      // Precargar ingredientes comunes
      queryClient.prefetchQuery({
        queryKey: ["common_ingredients"],
        queryFn: async () => {
          const { data } = await supabase
            .from("ingredients")
            .select("*")
            .eq("is_common", true);
          return data;
        },
      });

      // Precargar configuraciones globales
      queryClient.prefetchQuery({
        queryKey: ["settings"],
        queryFn: async () => {
          const { data } = await supabase
            .from("settings")
            .select("*")
            .eq("user_id", user.id)
            .single();
          return data;
        },
      });
    };

    preloadData();
  }, [queryClient, user]);

  return null;
}
