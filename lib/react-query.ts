import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos por defecto
      gcTime: 1000 * 60 * 30, // 30 minutos por defecto
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configuración específica para consultas de autenticación
export const authQueryOptions = {
  staleTime: 1000 * 60 * 15, // 15 minutos
  cacheTime: 1000 * 60 * 60, // 1 hora
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};
