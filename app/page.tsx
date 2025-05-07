"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "./contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { truncateText } from "@/lib/string-utils";
import {
  ShoppingCart,
  Info,
  ChevronRight,
  Clock,
  ImageIcon,
  BookOpen,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { englishTips, spanishTips } from "@/app/tips/page";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "./contexts/AuthContext";

export default function Home() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuthContext();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Seleccionar la lista de consejos según el idioma
  const tips = language === "es" ? spanishTips : englishTips;

  // Rotación secuencial de consejos cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 60000); // 60000 ms = 1 minuto

    return () => clearInterval(interval);
  }, [tips.length]);

  // Consulta para el perfil (con caché extendida ya que cambia poco)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hora (caché prolongada)
  });

  // Consulta para recetas recientes
  const { data: recentRecipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["recipes", "recent", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {!profileLoading && isAuthenticated && profile?.username
          ? `${t("home.welcome_back")}, ${profile.username}`
          : t("home.welcome")}
      </h1>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto text-center">
          <p className="mb-6 text-gray-600">{t("home.description")}</p>
          <Link href="/auth/login" className="btn-primary">
            {t("common.login")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">
          {/* Recetas recientes */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t("recipes.your_recipes")}
              </CardTitle>
              <CardDescription>{t("home.recipes_description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {recipesLoading ? (
                <div className="text-center py-8">{t("recipes.loading")}</div>
              ) : recentRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("recipes.no_recipes")}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentRecipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.id}`}
                      className="group block"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                        {recipe.image_url ? (
                          <Image
                            src={recipe.image_url}
                            alt={recipe.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-lg mb-1 line-clamp-1">
                          {recipe.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 gap-4">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {recipe.time} {t("recipes.minutes")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Flame className="h-4 w-4 mr-1" />
                            <span>
                              {recipe.macros_data
                                ? Math.round(
                                    parseInt(
                                      (recipe.macros_data.match(
                                        /Energy value: (\d+) Cal/
                                      ) || [])[1] || "0"
                                    ) / recipe.servings
                                  )
                                : 0}{" "}
                              kcal
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 text-right">
                <Link href="/recipes">
                  <Button variant="outline" size="sm" className="gap-1">
                    <span className="hidden sm:inline">{t("common.more")}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consejo del día */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {t("tips.title")}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Consejos culinarios que cambian cada minuto"
                    : "Culinary tips that change every minute"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-medium">
                    {tips[currentTipIndex].question}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {truncateText(tips[currentTipIndex].answer, 150)}
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <Link href="/tips">
                    <Button variant="outline" size="sm" className="gap-1">
                      <span className="hidden sm:inline">
                        {t("common.more")}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Lista de compras */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  {t("shopping.shopping_list")}
                </CardTitle>
                <CardDescription>
                  {language === "es"
                    ? "Gestiona tu lista de compras de manera inteligente"
                    : "Manage your shopping list intelligently"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {language === "es"
                      ? "Crea tu lista de compras de forma automática a partir de tus recetas favoritas. Añade, edita y organiza ingredientes para hacer tus compras de manera eficiente."
                      : "Create your shopping list automatically from your favorite recipes. Add, edit and organize ingredients to make your shopping efficient."}
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <Link href="/shopping">
                    <Button variant="outline" size="sm" className="gap-1">
                      <span className="hidden sm:inline">
                        {t("common.more")}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
