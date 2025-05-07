"use client";

import { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, ShoppingCart, Menu, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Crear un contexto para el sidebar
export type SidebarContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

// Proveedor del contexto que se usará en layout.tsx
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook para usar el contexto
export const useSidebar = () => useContext(SidebarContext);

export default function Navigation() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();

  const mainLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/recipes", icon: BookOpen, label: "Recipes" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/shopping", icon: ShoppingCart, label: "Shopping" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b lg:border-none">
      <div className="flex items-center h-16">
        {/* Iconos para móvil */}
        <div className="grid grid-cols-5 w-full px-4 items-center lg:hidden">
          {/* Botón de hamburguesa */}
          <button
            className="flex justify-center items-center"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex justify-center items-center p-2 rounded-lg transition-colors",
                pathname === link.href
                  ? "text-primary"
                  : "text-gray-600 hover:text-primary"
              )}
            >
              <link.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
