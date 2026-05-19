'use client';

import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { WidgetProps, LineChartData, LineChartConfig } from '@/lib/types';

function formatYValue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
}

function formatFullCurrency(value: number): string {
  return 'Revenue: $' + value.toLocaleString('en-US');
}

function detectKeys(series: Record<string, string | number>[]): { xKey: string; yKey: string } {
  const first = series[0] ?? {};
  let xKey = 'month';
  let yKey = 'revenue';
  for (const [k, v] of Object.entries(first)) {
    if (typeof v === 'string') xKey = k;
    if (typeof v === 'number') yKey = k;
  }
  return { xKey, yKey };
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      boxShadow: 'var(--shadow-tooltip)',
      padding: '10px 14px',
    }}>
      <div style={{ color: 'var(--text3)', marginBottom: 4, fontFamily: 'var(--mono)', fontSize: 10.5 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 14, fontFamily: 'var(--display)' }}>
        ${payload[0].value.toLocaleString('en-US')}
      </div>
    </div>
  );
}

export default function LineChart({ data: rawData, config: rawConfig }: WidgetProps) {
  const data = rawData as unknown as LineChartData;
  const config = (rawConfig ?? {}) as unknown as LineChartConfig;

  const { xKey, yKey } = detectKeys(data.series as Record<string, string | number>[]);
  const chartType: 'line' | 'area' | 'bar' = config.chartType === 'bar' ? 'bar' : config.showArea ? 'area' : 'line';
  const showArea = chartType === 'area';
  const showDots = config.showDataPoints !== false && chartType !== 'bar';

  const dotProps = showDots
    ? { r: 4, fill: 'var(--surface)', stroke: 'var(--primary-70)', strokeWidth: 2 }
    : { r: 0 };

  const activeDotProps = showDots
    ? { r: 5, fill: 'var(--primary-70)', stroke: 'var(--surface)', strokeWidth: 2 }
    : { r: 0 };

  const sharedLineProps = {
    type: 'monotone' as const,
    dataKey: yKey,
    stroke: 'var(--primary-70)',
    strokeWidth: 2,
    dot: dotProps,
    activeDot: activeDotProps,
    isAnimationActive: true,
    animationDuration: 1200,
  };

  const chart = chartType === 'bar' ? (
    <BarChart data={data.series}>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        angle={-45}
        textAnchor="end"
        height={48}
      />
      <YAxis
        tickFormatter={formatYValue}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        width={52}
      />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey={yKey} fill="var(--primary-70)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
    </BarChart>
  ) : showArea ? (
    <AreaChart data={data.series}>
      <defs>
        <linearGradient id="kai-area-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--primary-70)" stopOpacity={0.2} />
          <stop offset="95%" stopColor="var(--primary-70)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        angle={-45}
        textAnchor="end"
        height={48}
      />
      <YAxis
        tickFormatter={formatYValue}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        width={52}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area {...sharedLineProps} fill="url(#kai-area-gradient)" />
    </AreaChart>
  ) : (
    <RechartsLineChart data={data.series}>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        angle={-45}
        textAnchor="end"
        height={48}
      />
      <YAxis
        tickFormatter={formatYValue}
        tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }}
        tickLine={false}
        axisLine={false}
        width={52}
      />
      <Tooltip content={<CustomTooltip />} />
      <Line {...sharedLineProps} />
    </RechartsLineChart>
  );

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-chart)',
      padding: '24px',
      boxShadow: 'var(--shadow-chart)',
      position: 'relative',
      overflow: 'clip',
    }}>
      {/* Top gradient accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'linear-gradient(90deg, transparent, var(--ai-accent), transparent)',
      }} />

      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', fontFamily: 'var(--display)' }}>
        {data.title}
      </h3>
      {config.subtitle && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>
          {config.subtitle}
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
