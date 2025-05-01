import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authQueryOptions } from "@/lib/react-query";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Consulta para obtener el usuario actual y su perfil
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    ...authQueryOptions,
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["auth", "profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
    ...authQueryOptions,
  });

  // Suscribirse a cambios en la autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Actualizar la caché de React Query cuando cambie la sesión
      queryClient.setQueryData(["auth", "session"], session);

      // Si el usuario cierra sesión, limpiar la caché
      if (!session) {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Funciones de autenticación
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push("/recipes");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      router.push("/auth/verify");
    } catch (error) {
      console.error("Error al registrarse:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  };

  return {
    session,
    profile,
    isLoading: isLoadingSession || isLoadingProfile,
    isAuthenticated: !!session?.user,
    user: session?.user,
    signIn,
    signUp,
    signOut,
  };
}
