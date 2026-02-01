import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StarsHistoryChartProps {
  data: { date: string; stars: number }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number | string }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-content1 border border-default-200 rounded-lg p-2 shadow-lg">
        <p className="text-sm text-default-600">{label}</p>
        <p className="text-sm font-semibold text-accent">
          {payload[0]?.value?.toLocaleString()} stars
        </p>
      </div>
    );
  }
  return null;
};

export const StarsHistoryChart: React.FC<StarsHistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, left: 0, right: 0, bottom: 10 }}>
          <Area
            type="monotone"
            dataKey="stars"
            fill="#CB7C5B"
            opacity={0.3}
          />
          <Line
            type="monotone"
            dataKey="stars"
            stroke="#CB7C5B"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: "#CB7C5B" }}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#888" }}
            axisLine={{ stroke: "#e0e0e0" }}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 12, fill: "#888" }}
            axisLine={{ stroke: "#e0e0e0" }}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
