import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";

const PAGE_SIZE = 12;

// Claves de consulta
export const queryKeys = {
  recipes: "recipes",
  recipe: (id: string) => ["recipe", id],
  userRecipes: (userId: string, type?: string) => ["recipes", userId, type],
  profile: (userId: string) => ["profile", userId],
  infiniteRecipes: (
    userId: string | undefined,
    type: string,
    searchTerm: string,
    sortField: string,
    sortOrder: string
  ) => ["recipes", "infinite", userId, type, searchTerm, sortField, sortOrder],
};

// Hook para obtener el perfil del usuario
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile(userId || ""),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Hook para obtener recetas con scroll infinito
export function useInfiniteRecipes({
  userId,
  type = "cooking",
  searchTerm = "",
  sortField = "created_at",
  sortOrder = "desc",
}: {
  userId?: string;
  type?: string;
  searchTerm?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useInfiniteQuery({
    queryKey: queryKeys.infiniteRecipes(
      userId,
      type,
      searchTerm,
      sortField,
      sortOrder
    ),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // Verificar si el usuario está autenticado
        if (!userId) {
          return {
            recipes: [],
            totalCount: 0,
            nextPage: undefined,
          };
        }

        // Primero, obtener las recetas
        const {
          data: recipes,
          error: recipesError,
          count,
        } = await supabase
          .from("recipes")
          .select("*", { count: "exact" })
          .eq("user_id", userId)
          .eq("type", type)
          .order(sortField, { ascending: sortOrder === "asc" })
          .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

        if (recipesError) {
          console.error("Error fetching recipes:", recipesError);
          throw recipesError;
        }

        // Si no hay recetas, retornar array vacío
        if (!recipes || recipes.length === 0) {
          return {
            recipes: [],
            totalCount: 0,
            nextPage: undefined,
          };
        }

        // Obtener los perfiles de los usuarios
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in(
            "id",
            recipes.map((recipe) => recipe.user_id)
          );

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }

        // Combinar recetas con perfiles
        const recipesWithProfiles = recipes.map((recipe) => ({
          ...recipe,
          profiles: profiles?.find((profile) => profile.id === recipe.user_id),
        }));

        return {
          recipes: recipesWithProfiles,
          totalCount: count || 0,
          nextPage: recipes.length === PAGE_SIZE ? pageParam + 1 : undefined,
        };
      } catch (error) {
        console.error("Error in useInfiniteRecipes:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para obtener todas las recetas de un usuario por tipo
export function useUserRecipes(userId: string | undefined, type?: string) {
  return useQuery({
    queryKey: queryKeys.userRecipes(userId || "", type),
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase.from("recipes").select("*").eq("user_id", userId);

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Hook para obtener una receta específica
export function useRecipe(recipeId: string) {
  return useQuery({
    queryKey: queryKeys.recipe(recipeId),
    queryFn: async () => {
      // Obtener la receta
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error("Recipe not found");

      // Obtener el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", recipe.user_id)
        .single();

      if (profileError) throw profileError;

      return {
        ...recipe,
        profiles: profile,
      };
    },
  });
}

// Hook para actualizar una receta
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Recipe> & { id: string }) => {
      const { error } = await supabase
        .from("recipes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipe(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: ["recipes", "infinite"],
      });
      toast.success("Receta actualizada con éxito");
    },
    onError: (error) => {
      console.error("Error updating recipe:", error);
      toast.error("Error al actualizar la receta");
    },
  });
}

// Hook para eliminar una receta
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recipes", "infinite"],
      });
      toast.success("Receta eliminada con éxito");
    },
    onError: (error) => {
      console.error("Error deleting recipe:", error);
      toast.error("Error al eliminar la receta");
    },
  });
}
