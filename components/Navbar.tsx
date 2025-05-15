"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";

export function Navbar() {
  const { isAuthenticated } = useAuthContext();
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Recipe Master
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated && (
              <>
                <Link href="/auth/register">
                  <Button className="w-[120px]">{t("auth.register")}</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-[120px]">
                    {t("auth.login")}
                  </Button>
                </Link>
              </>
            )}
            <LanguageSelector />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
}
