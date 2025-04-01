"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import LogoutButton from "./LogoutButton";
import { ChefHat, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SearchDialog } from "./SearchDialog";

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth state changes
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

  return (
    <>
      <nav className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-xl">
              <ChefHat className="h-6 w-6" />
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  isActive("/") ? "text-primary" : "text-muted-foreground"
                )}
              >
                Home
              </Link>
              <Link
                href="/explore"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  isActive("/explore")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                Explore
              </Link>
              <Link
                href="/shopping"
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  isActive("/shopping")
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                Shopping
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(pathname === "/recipes" || pathname === "/cleaning") && (
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-5 w-5 text-gray-600" />
              </button>
            )}
            {isAuthenticated && <LogoutButton variant="ghost" />}
          </div>
        </div>
      </nav>

      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
