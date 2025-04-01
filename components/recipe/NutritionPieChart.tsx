import React, { PureComponent } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

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

export default class NutritionPieChart extends PureComponent<NutritionPieChartProps> {
  render() {
    const { macros } = this.props;

    // Parse macros string into data array and filter out energy value
    const data = macros
      .split("\n")
      .map((line) => {
        const [name, value] = line.split(":").map((part) => part.trim());
        return {
          name,
          value: parseFloat(value.replace(/,/g, "")),
        };
      })
      .filter((item) => item.name.toLowerCase() !== "energy value");

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
              formatter={(value: string) => {
                // Format the nutrient names to be more readable
                return value
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
