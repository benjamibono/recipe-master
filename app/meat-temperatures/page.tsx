"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MeatTemperature {
  meat: string;
  rare: string;
  mediumRare: string;
  medium: string;
  mediumWell: string;
  wellDone: string;
}

interface SafeTemperature {
  meat: string;
  temperature: string;
}

const redMeatTemperatures: MeatTemperature[] = [
  {
    meat: "Beef",
    rare: "49°C",
    mediumRare: "54°C",
    medium: "60°C",
    mediumWell: "66°C",
    wellDone: "71°C",
  },
  {
    meat: "Pork",
    rare: "❌",
    mediumRare: "63°C",
    medium: "66°C",
    mediumWell: "68°C",
    wellDone: "71°C",
  },
  {
    meat: "Fish",
    rare: "❌",
    mediumRare: "❌",
    medium: "63°C",
    mediumWell: "66°C",
    wellDone: "71°C",
  },
];

const safeTemperatures: SafeTemperature[] = [
  {
    meat: "Chicken / Turkey",
    temperature: "74°C",
  },
  {
    meat: "Ground Meat",
    temperature: "71°C",
  },
];

export default function MeatTemperaturesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Meat Cooking Temperatures</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Red Meat & Fish Cooking Temperatures</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type of Meat</TableHead>
                  <TableHead>Rare</TableHead>
                  <TableHead>Medium Rare</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Medium Well</TableHead>
                  <TableHead>Well Done</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redMeatTemperatures.map((temp) => (
                  <TableRow key={temp.meat}>
                    <TableCell className="font-medium">{temp.meat}</TableCell>
                    <TableCell>{temp.rare}</TableCell>
                    <TableCell>{temp.mediumRare}</TableCell>
                    <TableCell>{temp.medium}</TableCell>
                    <TableCell>{temp.mediumWell}</TableCell>
                    <TableCell>{temp.wellDone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safe Internal Temperatures</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type of Meat</TableHead>
                  <TableHead>Safe Internal Temperature</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeTemperatures.map((temp) => (
                  <TableRow key={temp.meat}>
                    <TableCell className="font-medium">{temp.meat}</TableCell>
                    <TableCell>{temp.temperature}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
