"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoIcon, ThermometerIcon } from "lucide-react";

interface MeatTemperature {
  meat: string;
  rare: string;
  mediumRare: string;
  medium: string;
  mediumWell: string;
  wellDone: string;
  tip?: string;
}

interface SafeTemperature {
  meat: string;
  temperature: string;
  tip?: string;
}

const redMeatTemperatures: MeatTemperature[] = [
  {
    meat: "beef",
    rare: "49°C",
    mediumRare: "54°C",
    medium: "60°C",
    mediumWell: "66°C",
    wellDone: "71°C",
    tip: "beef_tip",
  },
  {
    meat: "pork",
    rare: "❌",
    mediumRare: "63°C",
    medium: "66°C",
    mediumWell: "68°C",
    wellDone: "71°C",
    tip: "pork_tip",
  },
  {
    meat: "fish",
    rare: "❌",
    mediumRare: "❌",
    medium: "63°C",
    mediumWell: "66°C",
    wellDone: "71°C",
    tip: "fish_tip",
  },
];

const safeTemperatures: SafeTemperature[] = [
  {
    meat: "chicken_turkey",
    temperature: "74°C",
    tip: "poultry_tip",
  },
  {
    meat: "ground_meat",
    temperature: "71°C",
  },
];

export default function MeatTemperaturesPage() {
  const { t } = useLanguage();

  // Usar el hook para redirigir a usuarios no autenticados
  useAuthRedirect({
    ifNotAuthenticated: "/auth/login",
    message: {
      notAuthenticated: t(
        "auth.login_required",
        "Debes iniciar sesión para acceder a esta página"
      ),
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-2">
          <ThermometerIcon className="w-8 h-8 mr-3 text-red-500" />
          <h1 className="text-3xl font-bold text-center">
            {t("meatTemps.title")}
          </h1>
        </div>
        <p className="text-center text-gray-600 mb-10">
          {t("meatTemps.subtitle")}
        </p>

        <div className="space-y-8">
          {/* Versión para pantalla grande - Carnes rojas y pescado */}
          <div className="hidden md:block">
            <Card className="shadow-md border-t-4 border-t-red-500">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center">
                  {t("meatTemps.red_meat_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[150px] border">
                          {t("meatTemps.type")}
                        </TableHead>
                        <TableHead className="border text-center bg-red-50">
                          {t("meatTemps.rare")}
                        </TableHead>
                        <TableHead className="border text-center bg-pink-50">
                          {t("meatTemps.medium_rare")}
                        </TableHead>
                        <TableHead className="border text-center bg-orange-50">
                          {t("meatTemps.medium")}
                        </TableHead>
                        <TableHead className="border text-center bg-amber-50">
                          {t("meatTemps.medium_well")}
                        </TableHead>
                        <TableHead className="border text-center bg-yellow-50">
                          {t("meatTemps.well_done")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redMeatTemperatures.map((temp) => (
                        <TableRow key={temp.meat} className="hover:bg-gray-50">
                          <TableCell className="font-medium border">
                            {t(`meatTemps.${temp.meat}`)}
                          </TableCell>
                          <TableCell
                            className={`border text-center ${
                              temp.rare === "❌"
                                ? "text-gray-400"
                                : "font-semibold text-red-700"
                            }`}
                          >
                            {temp.rare}
                          </TableCell>
                          <TableCell
                            className={`border text-center ${
                              temp.mediumRare === "❌"
                                ? "text-gray-400"
                                : "font-semibold text-pink-700"
                            }`}
                          >
                            {temp.mediumRare}
                          </TableCell>
                          <TableCell
                            className={`border text-center ${
                              temp.medium === "❌"
                                ? "text-gray-400"
                                : "font-semibold text-orange-700"
                            }`}
                          >
                            {temp.medium}
                          </TableCell>
                          <TableCell
                            className={`border text-center ${
                              temp.mediumWell === "❌"
                                ? "text-gray-400"
                                : "font-semibold text-amber-700"
                            }`}
                          >
                            {temp.mediumWell}
                          </TableCell>
                          <TableCell
                            className={`border text-center ${
                              temp.wellDone === "❌"
                                ? "text-gray-400"
                                : "font-semibold text-yellow-700"
                            }`}
                          >
                            {temp.wellDone}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 grid md:grid-cols-3 gap-4">
                  {redMeatTemperatures.map(
                    (temp) =>
                      temp.tip && (
                        <div
                          key={temp.meat}
                          className="flex bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="font-bold text-gray-700">
                                {t(`meatTemps.${temp.meat}`).charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-700">
                              {t(`meatTemps.${temp.meat}`)}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {t(`meatTemps.${temp.tip}`)}
                            </p>
                          </div>
                        </div>
                      )
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-4 flex items-center">
                  <InfoIcon className="h-4 w-4 mr-2" />{" "}
                  {t("meatTemps.temperature_note")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Versión para móvil - Carnes rojas y pescado */}
          <div className="md:hidden">
            <h2 className="text-xl font-semibold mb-4">
              {t("meatTemps.red_meat_title")}
            </h2>
            <div className="space-y-6">
              {redMeatTemperatures.map((temp) => (
                <Card key={temp.meat} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-gray-50">
                    <CardTitle className="text-lg">
                      {t(`meatTemps.${temp.meat}`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {temp.rare !== "❌" && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">
                            {t("meatTemps.rare")}
                          </span>
                          <span className="text-base">{temp.rare}</span>
                        </div>
                      )}
                      {temp.mediumRare !== "❌" && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">
                            {t("meatTemps.medium_rare")}
                          </span>
                          <span className="text-base">{temp.mediumRare}</span>
                        </div>
                      )}
                      {temp.medium !== "❌" && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">
                            {t("meatTemps.medium")}
                          </span>
                          <span className="text-base">{temp.medium}</span>
                        </div>
                      )}
                      {temp.mediumWell !== "❌" && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">
                            {t("meatTemps.medium_well")}
                          </span>
                          <span className="text-base">{temp.mediumWell}</span>
                        </div>
                      )}
                      {temp.wellDone !== "❌" && (
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">
                            {t("meatTemps.well_done")}
                          </span>
                          <span className="text-base">{temp.wellDone}</span>
                        </div>
                      )}
                    </div>

                    {temp.tip && (
                      <p className="text-sm text-gray-600 mt-3 italic">
                        {t(`meatTemps.${temp.tip}`)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 flex items-center">
              <InfoIcon className="h-4 w-4 mr-2" />{" "}
              {t("meatTemps.temperature_note")}
            </p>
          </div>

          {/* Versión escritorio - Temperaturas seguras */}
          <div className="hidden md:block">
            <Card className="shadow-md border-t-4 border-t-blue-500">
              <CardHeader className="bg-gray-50">
                <CardTitle>{t("meatTemps.safe_temps")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <Table className="border-collapse">
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-[200px] border">
                          {t("meatTemps.type")}
                        </TableHead>
                        <TableHead className="border text-center bg-blue-50">
                          {t("meatTemps.safe_temp")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeTemperatures.map((temp) => (
                        <TableRow key={temp.meat} className="hover:bg-gray-50">
                          <TableCell className="font-medium border">
                            {t(`meatTemps.${temp.meat}`)}
                          </TableCell>
                          <TableCell className="border text-center font-semibold text-blue-700">
                            {temp.temperature}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 space-y-4">
                  {safeTemperatures.map(
                    (temp) =>
                      temp.tip && (
                        <div
                          key={`tip-${temp.meat}`}
                          className="flex bg-blue-50 p-3 rounded-md"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="font-bold text-blue-700">
                                {t(`meatTemps.${temp.meat}`).charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-700">
                              {t(`meatTemps.${temp.meat}`)}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {t(`meatTemps.${temp.tip}`)}
                            </p>
                          </div>
                        </div>
                      )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Versión móvil - Temperaturas seguras */}
          <div className="md:hidden">
            <h2 className="text-xl font-semibold mb-4">
              {t("meatTemps.safe_temps")}
            </h2>
            <div className="space-y-4">
              {safeTemperatures.map((temp) => (
                <Card key={temp.meat} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-gray-50">
                    <CardTitle className="text-lg">
                      {t(`meatTemps.${temp.meat}`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">
                        {t("meatTemps.safe_temp")}
                      </span>
                      <span className="text-xl font-semibold">
                        {temp.temperature}
                      </span>
                    </div>

                    {temp.tip && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {t(`meatTemps.${temp.tip}`)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
