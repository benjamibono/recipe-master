import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useLanguage } from "@/app/contexts/LanguageContext";

// Colors representing:
// Red for proteins (meat association)
// Yellow/amber for carbohydrates (grains/cereals)
// Blue for fats (common nutrition chart convention)
const COLORS = ["#FF6B6B", "#FFB946", "#4299E1"];

const RADIAN = Math.PI / 180;
interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomizedLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface NutritionPieChartProps {
  macros: string;
}

// Helper function to normalize nutrition terms
const getNormalizedKey = (term: string): string => {
  // Convert to lowercase for case-insensitive comparison
  const lowerTerm = term.toLowerCase();

  // Map variant terms to their standardized keys
  if (lowerTerm === "carbs") return "carbohydrates";
  if (lowerTerm === "fats") return "fat";

  // Default case: return the term as is
  return lowerTerm;
};

// Convert class component to function component to use hooks
export default function NutritionPieChart({ macros }: NutritionPieChartProps) {
  const { t } = useLanguage();

  // Parse macros string into data array and filter out energy value
  const data = macros
    .split("\n")
    .map((line) => {
      const [name, value] = line.split(":").map((part) => part.trim());
      return {
        name,
        value: parseFloat(value.replace(/,/g, "")),
        // Store original name for translation lookup
        originalName: name,
      };
    })
    .filter((item) => item.originalName.toLowerCase() !== "energy value");

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: "20px",
              fontSize: "14px",
            }}
            formatter={(value: string, entry: unknown, index: number) => {
              // Use the original name from data to get translation key
              const originalName = data[index].originalName;

              // Normalize the nutrition term to match translation keys
              const normalizedKey = getNormalizedKey(originalName);

              // Get translation key by converting to lowercase and replacing spaces with underscores
              const translationKey = `nutrition.${normalizedKey.replace(
                / /g,
                "_"
              )}`;

              // Return translated value or fallback to formatting original name
              return t(translationKey, originalName);
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
