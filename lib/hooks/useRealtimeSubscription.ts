import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

type SubscriptionConfig = {
  table: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
};

export function useRealtimeSubscription(
  channelName: string,
  config: SubscriptionConfig | SubscriptionConfig[],
  queryKeysToInvalidate: (string | undefined)[][]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      // Iniciar con la configuración del canal
      channel = supabase.channel(channelName);

      // Manejar múltiples configuraciones o una sola
      const configs = Array.isArray(config) ? config : [config];

      configs.forEach((cfg) => {
        channel = channel.on(
          "postgres_changes",
          {
            event: cfg.event || "*",
            schema: cfg.schema || "public",
            table: cfg.table,
            filter: cfg.filter,
          },
          async () => {
            // Invalidar todas las consultas afectadas
            for (const queryKey of queryKeysToInvalidate) {
              // Filtrar los valores undefined del queryKey
              const validQueryKey = queryKey.filter(
                (key): key is string => key !== undefined
              );
              if (validQueryKey.length > 0) {
                await queryClient.invalidateQueries({
                  queryKey: validQueryKey,
                });
              }
            }
          }
        );
      });

      // Suscribirse al canal
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to ${channelName}`);
        }
        if (status === "CLOSED") {
          console.log(`Channel ${channelName} closed`);
          // Intentar reconectar después de un tiempo
          setTimeout(setupSubscription, 5000);
        }
        if (status === "CHANNEL_ERROR") {
          console.error(`Error in channel ${channelName}`);
          // Intentar reconectar después de un tiempo
          setTimeout(setupSubscription, 5000);
        }
      });
    };

    // Configurar la suscripción inicial
    setupSubscription();

    // Limpieza al desmontar
    return () => {
      if (channel) {
        console.log(`Unsubscribing from ${channelName}`);
        supabase.removeChannel(channel);
      }
    };
  }, [channelName, config, queryClient, queryKeysToInvalidate]);
}
