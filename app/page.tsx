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
  Thermometer,
  ChefHat,
  Timer,
  ListChecks,
  Search,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { englishTips, spanishTips } from "@/app/tips/page";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "./contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuthContext();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [recipeLimit, setRecipeLimit] = useState(3);

  // Actualizar el límite de recetas según el ancho de la pantalla
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        // lg breakpoint (3 columnas)
        setRecipeLimit(6);
      } else if (window.innerWidth >= 640) {
        // sm breakpoint (2 columnas)
        setRecipeLimit(4);
      } else {
        // 1 columna
        setRecipeLimit(3);
      }
    }

    // Inicializar
    handleResize();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener("resize", handleResize);

    // Limpiar
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    queryKey: ["recipes", "recent", user?.id, recipeLimit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(recipeLimit);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-16">
        {!isAuthenticated ? (
          <div className="w-full">
            {/* Hero Section */}
            <section className="py-12 md:py-20 flex flex-col items-center text-center">
              <div className="mb-8 relative">
                <div className="relative w-24 h-24">
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                    <ChefHat className="h-14 w-14 text-primary" />
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Recipe Master
              </h1>

              <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-700">
                {t("home.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="rounded-full px-8 font-medium">
                    {t("auth.register")}
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 font-medium"
                  >
                    {t("auth.login")}
                  </Button>
                </Link>
              </div>

              <div className="mt-12 bg-gradient-to-b from-transparent to-gray-50 w-full pt-12 pb-4">
                <div className="max-w-4xl mx-auto relative aspect-video rounded-lg overflow-hidden shadow-2xl border">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-full flex items-center justify-center">
                    <div className="text-center px-6">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">{t("home.app_preview")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Características principales */}
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">
                  {t("home.main_features")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {t("home.features.organize.title")}
                    </h3>
                    <p className="text-gray-600">
                      {t("home.features.organize.description")}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {t("home.features.shopping.title")}
                    </h3>
                    <p className="text-gray-600">
                      {t("home.features.shopping.description")}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <LineChart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {t("home.features.nutrition.title")}
                    </h3>
                    <p className="text-gray-600">
                      {t("home.features.nutrition.description")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Cómo funciona */}
            <section className="py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-4">
                  {t("home.how_it_works.title")}
                </h2>
                <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
                  {t("home.how_it_works.description")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                      <Search className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("home.how_it_works.step1.title")}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t("home.how_it_works.step1.description")}
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                      <Timer className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("home.how_it_works.step2.title")}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t("home.how_it_works.step2.description")}
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                      <ListChecks className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("home.how_it_works.step3.title")}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t("home.how_it_works.step3.description")}
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative">
                      <Flame className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        4
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("home.how_it_works.step4.title")}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t("home.how_it_works.step4.description")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonios */}
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">
                  {t("home.testimonials.title")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        AM
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("home.testimonials.testimonial1.name")}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {t("home.testimonials.testimonial1.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {t("home.testimonials.testimonial1.text")}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        JR
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("home.testimonials.testimonial2.name")}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {t("home.testimonials.testimonial2.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {t("home.testimonials.testimonial2.text")}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3">
                        LP
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {t("home.testimonials.testimonial3.name")}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          {t("home.testimonials.testimonial3.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      {t("home.testimonials.testimonial3.text")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA final */}
            <section className="py-16 bg-gradient-to-br from-primary/80 to-primary">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {t("home.cta.title")}
                </h2>
                <p className="text-white/90 max-w-2xl mx-auto mb-8">
                  {t("home.cta.description")}
                </p>
                <Link href="/auth/register">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="rounded-full px-8 font-medium"
                  >
                    {t("auth.register")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">
              {!profileLoading && isAuthenticated && profile?.username
                ? `${t("home.welcome_back")}, ${profile.username}`
                : t("home.welcome")}
            </h1>

            {/* Recetas recientes */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t("recipes.your_recipes")}
                </CardTitle>
                <CardDescription>
                  {t("home.recipes_description")}
                </CardDescription>
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
                      <span className="">{t("common.more")}</span>
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
                    {t("home.tips_rotation_description")}
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
                        <span className="">{t("common.more")}</span>
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
                    {t("home.shopping_description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {t("home.shopping_detail")}
                    </p>
                  </div>
                  <div className="mt-4 text-right">
                    <Link href="/shopping">
                      <Button variant="outline" size="sm" className="gap-1">
                        <span className="">{t("common.more")}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Temperaturas de carnes */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  {t("home.cooking_temperatures")}
                </CardTitle>
                <CardDescription>{t("meatTemps.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <div className="text-center">
                    <div className="w-full h-2 bg-red-500 rounded mb-1"></div>
                    <span className="text-xs text-gray-600">
                      {t("meatTemps.rare")}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-2 bg-pink-500 rounded mb-1"></div>
                    <span className="text-xs text-gray-600">
                      {t("meatTemps.medium_rare")}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-2 bg-orange-500 rounded mb-1"></div>
                    <span className="text-xs text-gray-600">
                      {t("meatTemps.medium")}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-2 bg-amber-500 rounded mb-1"></div>
                    <span className="text-xs text-gray-600">
                      {t("meatTemps.medium_well")}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="w-full h-2 bg-yellow-500 rounded mb-1"></div>
                    <span className="text-xs text-gray-600">
                      {t("meatTemps.well_done")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <span className="font-medium text-sm">
                    {t("meatTemps.beef")}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-700 text-xs font-semibold">
                      49°C
                    </span>
                    <span>-</span>
                    <span className="text-yellow-700 text-xs font-semibold">
                      71°C
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <span className="font-medium text-sm">
                    {t("meatTemps.chicken_turkey")}
                  </span>
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">
                      74°C
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-right">
                  <Link href="/meat-temperatures">
                    <Button variant="outline" size="sm" className="gap-1">
                      <span className="inline">{t("common.more")}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
