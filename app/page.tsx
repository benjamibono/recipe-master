"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      router.push("/auth/login");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to RecipeMaster
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link
          href="/recipes"
          onClick={handleCardClick}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-2">Cooking Recipes</h2>
          <p className="text-gray-600">
            Explore and manage your favorite cooking recipes
          </p>
        </Link>

        <Link
          href="/cleaning"
          onClick={handleCardClick}
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-2xl font-semibold mb-2">Cleaning Recipes</h2>
          <p className="text-gray-600">
            Discover household cleaning tips and recipes
          </p>
        </Link>
      </div>

      {!isAuthenticated && (
        <div className="mt-12 text-center">
          <Link href="/auth/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
