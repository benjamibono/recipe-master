"use client";

import React from "react";
import { Toaster } from "sonner";
import Navigation, { SidebarProvider } from "./Navigation";
import Sidebar from "./Sidebar";

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export default function RootLayoutContent({
  children,
}: RootLayoutContentProps) {
  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navigation />
            <main className="flex-1 bg-gray-50 p-4 lg:p-6">
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}
