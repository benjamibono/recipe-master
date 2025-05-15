"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Compass,
  ShoppingCart,
  X,
  Settings,
  BookOpen,
  Thermometer,
  Sparkles,
  LogOut,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "./Navigation";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

export default function Sidebar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const { t } = useLanguage();

  // Cerrar el sidebar en mobile al cambiar de ruta
  useEffect(() => {
    if (window.innerWidth < 1024) {
      // 1024px = lg en Tailwind
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setIsAuthenticated(true);
      }
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const mainLinks = [
    { href: "/", icon: Home, label: t("common.home") },
    { href: "/recipes", icon: BookOpen, label: t("common.recipes") },
    { href: "/explore", icon: Compass, label: t("common.explore") },
    { href: "/shopping", icon: ShoppingCart, label: t("common.shopping") },
    { href: "/cleaning", icon: Sparkles, label: t("common.cleaning") },
    {
      href: "/meat-temperatures",
      icon: Thermometer,
      label: t("common.meat_temperatures"),
    },
    { href: "/tips", icon: Info, label: t("common.tips") },
    { href: "/settings", icon: Settings, label: t("common.settings") },
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-[100dvh] w-full lg:w-64 bg-white shadow-lg z-50 transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible",
          "lg:opacity-100 lg:visible lg:sticky lg:top-0 lg:z-0 lg:shadow-none lg:translate-x-0",
          !isAuthenticated && "hidden"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 border-b flex items-center justify-between px-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-primary">Recipe</span>Master
            </h1>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Language selector */}
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {t("common.language")}:
            </span>
            <LanguageSelector />
          </div>

          {/* Logout button in sidebar */}
          {isAuthenticated && (
            <div className="p-4 border-t">
              <button
                className="w-full flex items-center justify-start gap-3 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
                onClick={async () => {
                  await supabase.auth.signOut();
                  if (window.innerWidth < 1024) {
                    setIsOpen(false);
                  }
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>{t("common.logout")}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
