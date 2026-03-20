import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatBytes } from "@/lib/utils"
import { useConfigurationStore, useDirEntryHistoryStore } from "./store"

const chartConfig = {
  size: {
    label: "Size",
    color: "hsla(273, 98%, 25%, 1.00)",
  },
}

import { Card } from "@/components/ui/card"

export function SpaceHistoryChart() {
  const chartData = useDirEntryHistoryStore((s) => s.currentDirEntryHistory);

  const showHistoryFlag = useConfigurationStore((state) => state.ShowHistory);

  const renderContent = () => {
    if (!showHistoryFlag) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
          History graph disabled.
        </div>
      )
    }
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
          Select a directory to view history.
        </div>
      );
    }

    const ticks = chartData.length >= 2
      ? [chartData[0].timestamp, chartData[chartData.length - 1].timestamp]
      : [chartData[0].timestamp];

    return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-full">
        <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="fillSize" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-size)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-size)" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            tickFormatter={(t) => {
              const d = new Date(t);
              return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
            }}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <YAxis
            width={75}
            tickMargin={8}
            tickFormatter={(v) => formatBytes(v)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  if (!payload?.[0]?.payload?.timestamp) return "";
                  const d = new Date(payload[0].payload.timestamp);
                  return d.toLocaleDateString(undefined, { timeZone: "UTC" });
                }}
                formatter={(value) => formatBytes(value)}
              />
            }
          />

          <Area
            dataKey="sizeBytes"
            type="stepAfter"
            stroke="var(--color-size)"
            fill="url(#fillSize)"
            fillOpacity={1}
          />
        </AreaChart>
      </ChartContainer>
    );
  };

  return (
    <Card className="flex flex-col h-[280px] w-full border-border/40 bg-black/20 p-4 shadow-inner mb-4">
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        {renderContent()}
      </div>
    </Card>
  );
}