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
  Sparkles,
  Users,
  LayoutDashboard,
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
            <section className="py-10 sm:py-12 md:py-20 flex flex-col items-center text-center">
              <div className="mb-8 relative">
                <ChefHat className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-primary" />
                <Sparkles className="absolute top-0 right-0 h-6 w-6 text-amber-400" />
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
                {t("home.hero_title", "Master Your Kitchen with Recipe Master")}
              </h1>

              <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-gray-700">
                {t(
                  "home.description",
                  "The ultimate platform to organize your recipes, plan your meals, create shopping lists, and discover new culinary delights. Effortlessly manage your cooking journey from inspiration to a delicious meal."
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
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
                <div className="max-w-4xl mx-auto relative aspect-[16/10] rounded-xl overflow-hidden shadow-2xl border-2 border-primary/20 bg-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 bg-red-400 rounded-full"></span>
                        <span className="h-3 w-3 bg-yellow-400 rounded-full"></span>
                        <span className="h-3 w-3 bg-green-400 rounded-full"></span>
                      </div>
                      <div className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                        {t("home.app_preview.header_title", "RecipeMaster.app")}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1 bg-white/70 rounded-md p-3 shadow-sm">
                        <LayoutDashboard className="h-6 w-6 text-primary mb-1.5" />
                        <div className="h-2 w-3/4 bg-gray-300 rounded-full mb-1"></div>
                        <div className="h-2 w-1/2 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="sm:col-span-2 bg-white/70 rounded-md p-3 shadow-sm">
                        <ImageIcon className="h-6 w-6 text-pink-400 mb-1.5" />
                        <div className="h-2 w-full bg-gray-300 rounded-full mb-1"></div>
                        <div className="h-2 w-3/4 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="sm:col-span-2 bg-white/70 rounded-md p-3 shadow-sm">
                        <ListChecks className="h-6 w-6 text-blue-400 mb-1.5" />
                        <div className="h-2 w-full bg-gray-300 rounded-full mb-1"></div>
                        <div className="h-2 w-2/3 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="sm:col-span-1 bg-white/70 rounded-md p-3 shadow-sm">
                        <ShoppingCart className="h-6 w-6 text-green-400 mb-1.5" />
                        <div className="h-2 w-3/4 bg-gray-300 rounded-full mb-1"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <ChefHat className="h-10 w-10 text-primary/50 opacity-50" />
                  </div>
                </div>
              </div>
            </section>

            {/* Características principales */}
            <section className="py-16 lg:py-20 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 lg:mb-16">
                  {t("home.main_features")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
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

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
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

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
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
            <section className="py-16 lg:py-20">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
                  {t("home.how_it_works.title")}
                </h2>
                <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12 lg:mb-16 text-lg">
                  {t(
                    "home.how_it_works.description_detailed",
                    "Getting started is simple! Just follow these easy steps to begin your culinary adventure with Recipe Master."
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative ring-2 ring-primary/20">
                      <Search className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
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

                  <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative ring-2 ring-primary/20">
                      <Timer className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
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

                  <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative ring-2 ring-primary/20">
                      <ListChecks className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
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

                  <div className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-primary/5 transition-colors">
                    <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 relative ring-2 ring-primary/20">
                      <Flame className="h-7 w-7 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md">
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
            <section className="py-16 lg:py-20 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 lg:mb-16">
                  {t("home.testimonials.title")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg mr-4 shadow-md">
                        {t("home.testimonials.testimonial1.initials", "AM")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {t("home.testimonials.testimonial1.name")}
                        </h4>
                        <p className="text-primary text-sm font-medium">
                          {t("home.testimonials.testimonial1.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 italic flex-grow">
                      {t("home.testimonials.testimonial1.text")}
                    </p>
                    <Users className="w-5 h-5 text-blue-500 mt-4 self-start" />
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-lg mr-4 shadow-md">
                        {t("home.testimonials.testimonial2.initials", "JR")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {t("home.testimonials.testimonial2.name")}
                        </h4>
                        <p className="text-primary text-sm font-medium">
                          {t("home.testimonials.testimonial2.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 italic flex-grow">
                      {t("home.testimonials.testimonial2.text")}
                    </p>
                    <Users className="w-5 h-5 text-green-500 mt-4 self-start" />
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg mr-4 shadow-md">
                        {t("home.testimonials.testimonial3.initials", "LP")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {t("home.testimonials.testimonial3.name")}
                        </h4>
                        <p className="text-primary text-sm font-medium">
                          {t("home.testimonials.testimonial3.role")}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 italic flex-grow">
                      {t("home.testimonials.testimonial3.text")}
                    </p>
                    <Users className="w-5 h-5 text-purple-500 mt-4 self-start" />
                  </div>
                </div>
              </div>
            </section>

            {/* CTA final */}
            <section className="py-16 lg:py-24 bg-gradient-to-br from-primary to-primary/80">
              <div className="container mx-auto px-4 text-center">
                <ChefHat className="h-16 w-16 text-white mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                  {t(
                    "home.cta.title_strong",
                    "Ready to Transform Your Cooking Experience?"
                  )}
                </h2>
                <p className="text-white/90 max-w-2xl mx-auto mb-10 text-lg">
                  {t(
                    "home.cta.description_compelling",
                    "Sign up today and join a growing community of food lovers."
                  )}
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
                ? `${t("home.welcome_back")}, ${profile.username}!`
                : t("home.welcome")}
            </h1>

            {/* Recetas recientes */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BookOpen className="h-5 w-5 text-primary" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentRecipes.map((recipe) => (
                      <Link
                        key={recipe.id}
                        href={`/recipes/${recipe.id}`}
                        className="group block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {recipe.image_url ? (
                            <Image
                              src={recipe.image_url}
                              alt={recipe.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted">
                              <ImageIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                            {recipe.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 gap-4 mb-1">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-orange-500" />
                              <span>
                                {recipe.time}{" "}
                                {t("recipes.minutes_short", "min")}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Flame className="h-4 w-4 mr-1 text-orange-500" />
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
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {recipe.description ||
                              t(
                                "recipes.default_short_desc",
                                "A delicious recipe to try."
                              )}
                          </p>
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
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Info className="h-5 w-5 text-primary" />
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
              <Card className="shadow-md border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ShoppingCart className="h-5 w-5 text-primary" />
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
            <Card className="col-span-1 md:col-span-2 lg:col-span-1 shadow-md border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Thermometer className="h-5 w-5 text-primary" />
                  {t("home.cooking_temperatures")}
                </CardTitle>
                <CardDescription>{t("meatTemps.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-1 rounded bg-red-100">
                  <div className="w-full h-2 bg-red-500 rounded mb-1"></div>
                  <span className="text-xs text-red-700 font-medium">
                    {t("meatTemps.rare")}
                  </span>
                </div>
                <div className="text-center p-1 rounded bg-pink-100">
                  <div className="w-full h-2 bg-pink-500 rounded mb-1"></div>
                  <span className="text-xs text-pink-700 font-medium">
                    {t("meatTemps.medium_rare")}
                  </span>
                </div>
                <div className="text-center p-1 rounded bg-orange-100">
                  <div className="w-full h-2 bg-orange-500 rounded mb-1"></div>
                  <span className="text-xs text-orange-700 font-medium">
                    {t("meatTemps.medium")}
                  </span>
                </div>
                <div className="text-center p-1 rounded bg-amber-100">
                  <div className="w-full h-2 bg-amber-500 rounded mb-1"></div>
                  <span className="text-xs text-amber-700 font-medium">
                    {t("meatTemps.medium_well")}
                  </span>
                </div>
                <div className="text-center p-1 rounded bg-yellow-100">
                  <div className="w-full h-2 bg-yellow-500 rounded mb-1"></div>
                  <span className="text-xs text-yellow-700 font-medium">
                    {t("meatTemps.well_done")}
                  </span>
                </div>

                <div className="mt-6 text-right">
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
