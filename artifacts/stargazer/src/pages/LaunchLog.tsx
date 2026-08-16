import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, Users, RefreshCw, DollarSign, Zap } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ─── Dataset ────────────────────────────────────────────────────────────────
const RAW = [
  { year:1957,total_launches:3,successful:2,launch_failures:1,human_missions:1,total_crew_launched:7,booster_recoveries:0,avg_payload_kg:3329.33,total_cost_million_usd:538.0,unique_rockets:3,success_rate_pct:66.7 },
  { year:1958,total_launches:5,successful:2,launch_failures:2,human_missions:0,total_crew_launched:0,booster_recoveries:0,avg_payload_kg:1643.8,total_cost_million_usd:754.0,unique_rockets:4,success_rate_pct:40.0 },
  { year:1959,total_launches:3,successful:1,launch_failures:1,human_missions:1,total_crew_launched:3,booster_recoveries:0,avg_payload_kg:3259.67,total_cost_million_usd:263.4,unique_rockets:3,success_rate_pct:33.3 },
  { year:1960,total_launches:29,successful:23,launch_failures:2,human_missions:6,total_crew_launched:19,booster_recoveries:0,avg_payload_kg:3300.93,total_cost_million_usd:4001.1,unique_rockets:14,success_rate_pct:79.3 },
  { year:1961,total_launches:16,successful:12,launch_failures:2,human_missions:2,total_crew_launched:13,booster_recoveries:0,avg_payload_kg:3289.38,total_cost_million_usd:2755.5,unique_rockets:9,success_rate_pct:75.0 },
  { year:1962,total_launches:18,successful:12,launch_failures:3,human_missions:5,total_crew_launched:14,booster_recoveries:0,avg_payload_kg:2915.33,total_cost_million_usd:2494.4,unique_rockets:9,success_rate_pct:66.7 },
  { year:1963,total_launches:24,successful:14,launch_failures:4,human_missions:6,total_crew_launched:19,booster_recoveries:0,avg_payload_kg:2835.46,total_cost_million_usd:3305.1,unique_rockets:11,success_rate_pct:58.3 },
  { year:1964,total_launches:18,successful:13,launch_failures:4,human_missions:3,total_crew_launched:11,booster_recoveries:0,avg_payload_kg:3094.83,total_cost_million_usd:2506.1,unique_rockets:11,success_rate_pct:72.2 },
  { year:1965,total_launches:47,successful:41,launch_failures:4,human_missions:8,total_crew_launched:29,booster_recoveries:0,avg_payload_kg:3108.0,total_cost_million_usd:6540.8,unique_rockets:16,success_rate_pct:87.2 },
  { year:1966,total_launches:64,successful:54,launch_failures:4,human_missions:17,total_crew_launched:68,booster_recoveries:0,avg_payload_kg:2869.92,total_cost_million_usd:8096.4,unique_rockets:15,success_rate_pct:84.4 },
  { year:1967,total_launches:59,successful:56,launch_failures:2,human_missions:12,total_crew_launched:34,booster_recoveries:0,avg_payload_kg:3290.98,total_cost_million_usd:6705.5,unique_rockets:14,success_rate_pct:94.9 },
  { year:1968,total_launches:50,successful:48,launch_failures:0,human_missions:10,total_crew_launched:42,booster_recoveries:0,avg_payload_kg:2877.08,total_cost_million_usd:6353.8,unique_rockets:16,success_rate_pct:96.0 },
  { year:1969,total_launches:51,successful:44,launch_failures:3,human_missions:13,total_crew_launched:40,booster_recoveries:0,avg_payload_kg:2991.92,total_cost_million_usd:7062.3,unique_rockets:16,success_rate_pct:86.3 },
  { year:1970,total_launches:92,successful:77,launch_failures:7,human_missions:13,total_crew_launched:36,booster_recoveries:0,avg_payload_kg:2817.04,total_cost_million_usd:11173.2,unique_rockets:19,success_rate_pct:83.7 },
  { year:1971,total_launches:90,successful:79,launch_failures:6,human_missions:7,total_crew_launched:21,booster_recoveries:0,avg_payload_kg:2171.67,total_cost_million_usd:11376.5,unique_rockets:20,success_rate_pct:87.8 },
  { year:1972,total_launches:111,successful:91,launch_failures:10,human_missions:14,total_crew_launched:44,booster_recoveries:0,avg_payload_kg:2588.8,total_cost_million_usd:13309.7,unique_rockets:25,success_rate_pct:82.0 },
  { year:1973,total_launches:97,successful:88,launch_failures:5,human_missions:10,total_crew_launched:31,booster_recoveries:0,avg_payload_kg:2239.81,total_cost_million_usd:12346.2,unique_rockets:19,success_rate_pct:90.7 },
  { year:1974,total_launches:82,successful:75,launch_failures:1,human_missions:6,total_crew_launched:18,booster_recoveries:0,avg_payload_kg:2870.49,total_cost_million_usd:10091.2,unique_rockets:21,success_rate_pct:91.5 },
  { year:1975,total_launches:95,successful:87,launch_failures:3,human_missions:12,total_crew_launched:44,booster_recoveries:0,avg_payload_kg:2843.58,total_cost_million_usd:11871.1,unique_rockets:22,success_rate_pct:91.6 },
  { year:1976,total_launches:97,successful:88,launch_failures:5,human_missions:6,total_crew_launched:19,booster_recoveries:0,avg_payload_kg:2229.59,total_cost_million_usd:13130.9,unique_rockets:19,success_rate_pct:90.7 },
  { year:1977,total_launches:91,successful:84,launch_failures:6,human_missions:9,total_crew_launched:39,booster_recoveries:0,avg_payload_kg:2944.14,total_cost_million_usd:10058.8,unique_rockets:18,success_rate_pct:92.3 },
  { year:1978,total_launches:90,successful:81,launch_failures:4,human_missions:10,total_crew_launched:33,booster_recoveries:0,avg_payload_kg:2871.79,total_cost_million_usd:10153.9,unique_rockets:23,success_rate_pct:90.0 },
  { year:1979,total_launches:93,successful:85,launch_failures:5,human_missions:16,total_crew_launched:52,booster_recoveries:0,avg_payload_kg:3117.3,total_cost_million_usd:11639.4,unique_rockets:20,success_rate_pct:91.4 },
  { year:1980,total_launches:112,successful:102,launch_failures:4,human_missions:12,total_crew_launched:35,booster_recoveries:0,avg_payload_kg:2321.51,total_cost_million_usd:12739.0,unique_rockets:27,success_rate_pct:91.1 },
  { year:1981,total_launches:113,successful:103,launch_failures:5,human_missions:11,total_crew_launched:45,booster_recoveries:0,avg_payload_kg:2707.35,total_cost_million_usd:14543.3,unique_rockets:28,success_rate_pct:91.2 },
  { year:1982,total_launches:133,successful:124,launch_failures:5,human_missions:10,total_crew_launched:42,booster_recoveries:0,avg_payload_kg:2481.67,total_cost_million_usd:17657.1,unique_rockets:28,success_rate_pct:93.2 },
  { year:1983,total_launches:125,successful:108,launch_failures:6,human_missions:15,total_crew_launched:54,booster_recoveries:0,avg_payload_kg:2372.19,total_cost_million_usd:15888.8,unique_rockets:25,success_rate_pct:86.4 },
  { year:1984,total_launches:101,successful:86,launch_failures:10,human_missions:9,total_crew_launched:32,booster_recoveries:0,avg_payload_kg:2612.83,total_cost_million_usd:12905.8,unique_rockets:24,success_rate_pct:85.1 },
  { year:1985,total_launches:91,successful:88,launch_failures:1,human_missions:10,total_crew_launched:37,booster_recoveries:0,avg_payload_kg:2694.44,total_cost_million_usd:11101.2,unique_rockets:26,success_rate_pct:96.7 },
  { year:1986,total_launches:126,successful:115,launch_failures:7,human_missions:9,total_crew_launched:27,booster_recoveries:0,avg_payload_kg:2388.44,total_cost_million_usd:16164.3,unique_rockets:30,success_rate_pct:91.3 },
  { year:1987,total_launches:117,successful:111,launch_failures:3,human_missions:10,total_crew_launched:36,booster_recoveries:0,avg_payload_kg:2495.31,total_cost_million_usd:16109.0,unique_rockets:28,success_rate_pct:94.9 },
  { year:1988,total_launches:120,successful:109,launch_failures:7,human_missions:15,total_crew_launched:52,booster_recoveries:0,avg_payload_kg:2382.72,total_cost_million_usd:16075.1,unique_rockets:30,success_rate_pct:90.8 },
  { year:1989,total_launches:108,successful:101,launch_failures:5,human_missions:8,total_crew_launched:25,booster_recoveries:0,avg_payload_kg:2111.89,total_cost_million_usd:14112.9,unique_rockets:26,success_rate_pct:93.5 },
  { year:1990,total_launches:70,successful:65,launch_failures:2,human_missions:5,total_crew_launched:15,booster_recoveries:0,avg_payload_kg:2943.44,total_cost_million_usd:8329.2,unique_rockets:27,success_rate_pct:92.9 },
  { year:1991,total_launches:85,successful:81,launch_failures:4,human_missions:7,total_crew_launched:23,booster_recoveries:0,avg_payload_kg:2235.6,total_cost_million_usd:11052.8,unique_rockets:30,success_rate_pct:95.3 },
  { year:1992,total_launches:85,successful:77,launch_failures:3,human_missions:6,total_crew_launched:22,booster_recoveries:0,avg_payload_kg:2895.22,total_cost_million_usd:10545.9,unique_rockets:30,success_rate_pct:90.6 },
  { year:1993,total_launches:84,successful:77,launch_failures:4,human_missions:8,total_crew_launched:33,booster_recoveries:0,avg_payload_kg:2462.1,total_cost_million_usd:11295.5,unique_rockets:29,success_rate_pct:91.7 },
  { year:1994,total_launches:85,successful:74,launch_failures:6,human_missions:8,total_crew_launched:36,booster_recoveries:0,avg_payload_kg:2456.11,total_cost_million_usd:11377.4,unique_rockets:32,success_rate_pct:87.1 },
  { year:1995,total_launches:87,successful:83,launch_failures:2,human_missions:13,total_crew_launched:46,booster_recoveries:0,avg_payload_kg:2791.63,total_cost_million_usd:10965.0,unique_rockets:32,success_rate_pct:95.4 },
  { year:1996,total_launches:77,successful:73,launch_failures:3,human_missions:4,total_crew_launched:20,booster_recoveries:0,avg_payload_kg:2416.68,total_cost_million_usd:9651.3,unique_rockets:31,success_rate_pct:94.8 },
  { year:1997,total_launches:79,successful:79,launch_failures:0,human_missions:8,total_crew_launched:25,booster_recoveries:0,avg_payload_kg:2166.08,total_cost_million_usd:9408.6,unique_rockets:35,success_rate_pct:100.0 },
  { year:1998,total_launches:80,successful:80,launch_failures:0,human_missions:8,total_crew_launched:30,booster_recoveries:0,avg_payload_kg:2816.98,total_cost_million_usd:9413.4,unique_rockets:33,success_rate_pct:100.0 },
  { year:1999,total_launches:73,successful:73,launch_failures:0,human_missions:4,total_crew_launched:15,booster_recoveries:0,avg_payload_kg:2045.97,total_cost_million_usd:8776.7,unique_rockets:26,success_rate_pct:100.0 },
  { year:2000,total_launches:67,successful:66,launch_failures:1,human_missions:8,total_crew_launched:19,booster_recoveries:0,avg_payload_kg:2928.18,total_cost_million_usd:8216.9,unique_rockets:36,success_rate_pct:98.5 },
  { year:2001,total_launches:63,successful:61,launch_failures:1,human_missions:4,total_crew_launched:10,booster_recoveries:0,avg_payload_kg:2633.17,total_cost_million_usd:8389.7,unique_rockets:31,success_rate_pct:96.8 },
  { year:2002,total_launches:57,successful:56,launch_failures:0,human_missions:5,total_crew_launched:23,booster_recoveries:0,avg_payload_kg:3008.51,total_cost_million_usd:7801.1,unique_rockets:30,success_rate_pct:98.2 },
  { year:2003,total_launches:61,successful:60,launch_failures:1,human_missions:6,total_crew_launched:22,booster_recoveries:0,avg_payload_kg:2445.52,total_cost_million_usd:8106.5,unique_rockets:25,success_rate_pct:98.4 },
  { year:2004,total_launches:57,successful:54,launch_failures:3,human_missions:6,total_crew_launched:28,booster_recoveries:0,avg_payload_kg:2794.96,total_cost_million_usd:7403.8,unique_rockets:26,success_rate_pct:94.7 },
  { year:2005,total_launches:72,successful:71,launch_failures:1,human_missions:2,total_crew_launched:9,booster_recoveries:0,avg_payload_kg:2106.88,total_cost_million_usd:9305.9,unique_rockets:31,success_rate_pct:98.6 },
  { year:2006,total_launches:69,successful:67,launch_failures:1,human_missions:4,total_crew_launched:10,booster_recoveries:0,avg_payload_kg:2644.14,total_cost_million_usd:8746.6,unique_rockets:29,success_rate_pct:97.1 },
  { year:2007,total_launches:68,successful:67,launch_failures:0,human_missions:4,total_crew_launched:16,booster_recoveries:0,avg_payload_kg:2148.43,total_cost_million_usd:8675.6,unique_rockets:31,success_rate_pct:98.5 },
  { year:2008,total_launches:63,successful:59,launch_failures:1,human_missions:8,total_crew_launched:21,booster_recoveries:0,avg_payload_kg:3080.0,total_cost_million_usd:8501.1,unique_rockets:32,success_rate_pct:93.7 },
  { year:2009,total_launches:79,successful:77,launch_failures:0,human_missions:11,total_crew_launched:39,booster_recoveries:0,avg_payload_kg:2908.51,total_cost_million_usd:11262.1,unique_rockets:31,success_rate_pct:97.5 },
  { year:2010,total_launches:87,successful:82,launch_failures:2,human_missions:8,total_crew_launched:27,booster_recoveries:0,avg_payload_kg:2341.1,total_cost_million_usd:10729.6,unique_rockets:35,success_rate_pct:94.3 },
  { year:2011,total_launches:105,successful:104,launch_failures:1,human_missions:7,total_crew_launched:26,booster_recoveries:0,avg_payload_kg:1964.11,total_cost_million_usd:13337.1,unique_rockets:40,success_rate_pct:99.0 },
  { year:2012,total_launches:91,successful:89,launch_failures:1,human_missions:2,total_crew_launched:6,booster_recoveries:0,avg_payload_kg:2127.62,total_cost_million_usd:11730.6,unique_rockets:40,success_rate_pct:97.8 },
  { year:2013,total_launches:86,successful:85,launch_failures:1,human_missions:4,total_crew_launched:13,booster_recoveries:0,avg_payload_kg:2148.59,total_cost_million_usd:10722.2,unique_rockets:34,success_rate_pct:98.8 },
  { year:2014,total_launches:70,successful:68,launch_failures:2,human_missions:2,total_crew_launched:6,booster_recoveries:0,avg_payload_kg:2081.76,total_cost_million_usd:8734.6,unique_rockets:32,success_rate_pct:97.1 },
  { year:2015,total_launches:103,successful:98,launch_failures:3,human_missions:6,total_crew_launched:22,booster_recoveries:9,avg_payload_kg:2208.26,total_cost_million_usd:13702.5,unique_rockets:38,success_rate_pct:95.1 },
  { year:2016,total_launches:99,successful:97,launch_failures:0,human_missions:2,total_crew_launched:4,booster_recoveries:12,avg_payload_kg:1957.4,total_cost_million_usd:12257.8,unique_rockets:39,success_rate_pct:98.0 },
  { year:2017,total_launches:101,successful:97,launch_failures:3,human_missions:5,total_crew_launched:11,booster_recoveries:11,avg_payload_kg:2111.03,total_cost_million_usd:12518.1,unique_rockets:37,success_rate_pct:96.0 },
  { year:2018,total_launches:100,successful:98,launch_failures:0,human_missions:8,total_crew_launched:34,booster_recoveries:16,avg_payload_kg:2439.73,total_cost_million_usd:13004.5,unique_rockets:36,success_rate_pct:98.0 },
  { year:2019,total_launches:113,successful:110,launch_failures:0,human_missions:6,total_crew_launched:21,booster_recoveries:22,avg_payload_kg:2511.88,total_cost_million_usd:15565.9,unique_rockets:39,success_rate_pct:97.3 },
  { year:2020,total_launches:155,successful:152,launch_failures:1,human_missions:5,total_crew_launched:11,booster_recoveries:36,avg_payload_kg:1856.6,total_cost_million_usd:19208.7,unique_rockets:42,success_rate_pct:98.1 },
  { year:2021,total_launches:130,successful:126,launch_failures:1,human_missions:14,total_crew_launched:46,booster_recoveries:24,avg_payload_kg:1770.09,total_cost_million_usd:16656.8,unique_rockets:39,success_rate_pct:96.9 },
  { year:2022,total_launches:183,successful:179,launch_failures:1,human_missions:7,total_crew_launched:26,booster_recoveries:36,avg_payload_kg:1948.01,total_cost_million_usd:24184.4,unique_rockets:42,success_rate_pct:97.8 },
  { year:2023,total_launches:199,successful:193,launch_failures:3,human_missions:14,total_crew_launched:42,booster_recoveries:62,avg_payload_kg:2177.42,total_cost_million_usd:25446.4,unique_rockets:40,success_rate_pct:97.0 },
  { year:2024,total_launches:224,successful:220,launch_failures:1,human_missions:18,total_crew_launched:59,booster_recoveries:42,avg_payload_kg:2115.25,total_cost_million_usd:29977.7,unique_rockets:43,success_rate_pct:98.2 },
  { year:2025,total_launches:255,successful:251,launch_failures:1,human_missions:26,total_crew_launched:89,booster_recoveries:55,avg_payload_kg:2660.38,total_cost_million_usd:32492.7,unique_rockets:41,success_rate_pct:98.4 },
  { year:2026,total_launches:197,successful:194,launch_failures:2,human_missions:24,total_crew_launched:79,booster_recoveries:37,avg_payload_kg:2423.01,total_cost_million_usd:25341.6,unique_rockets:43,success_rate_pct:98.5 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function era(year: number) {
  if (year < 1970) return 'Space Race';
  if (year < 1992) return 'Cold War';
  if (year < 2010) return 'Post-USSR';
  return 'NewSpace';
}

const ERA_COLORS: Record<string, string> = {
  'Space Race': '#f59e0b',
  'Cold War':   '#6366f1',
  'Post-USSR':  '#22d3ee',
  'NewSpace':   '#10b981',
};

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

// ─── Custom tooltip wrappers ─────────────────────────────────────────────────
function LaunchesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">{Number(p.value).toFixed(1)}%</span>
        </p>
      ))}
    </div>
  );
}

function CostTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground font-mono">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">${fmt(p.value)}M</span>
        </p>
      ))}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  return (
    <Card className="bg-card/60 border-border/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-md ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-mono font-bold text-lg leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function LaunchLog() {
  const [eraTick] = useState<string[]>(['1957','1965','1970','1975','1980','1985','1990','1995','2000','2005','2010','2015','2020','2026']);

  const totals = useMemo(() => ({
    launches: RAW.reduce((s, r) => s + r.total_launches, 0),
    humans: RAW.reduce((s, r) => s + r.total_crew_launched, 0),
    recoveries: RAW.reduce((s, r) => s + r.booster_recoveries, 0),
    cost: RAW.reduce((s, r) => s + r.total_cost_million_usd, 0),
    peakYear: RAW.reduce((a, b) => b.total_launches > a.total_launches ? b : a).year,
    peakLaunches: RAW.reduce((a, b) => b.total_launches > a.total_launches ? b : a).total_launches,
  }), []);

  // Chart A: stacked area — successful vs failed
  const launchData = useMemo(() =>
    RAW.map(r => ({
      year: r.year,
      Successful: r.successful,
      Failed: r.launch_failures,
      era: era(r.year),
    })), []);

  // Chart B: success rate line
  const rateData = useMemo(() =>
    RAW.map(r => ({ year: r.year, 'Success Rate': r.success_rate_pct })), []);

  // Chart C: booster recoveries (2015+)
  const recoveryData = useMemo(() =>
    RAW.filter(r => r.year >= 2013).map(r => ({
      year: r.year,
      Launches: r.total_launches,
      Recovered: r.booster_recoveries,
    })), []);

  // Chart D: human spaceflight
  const humanData = useMemo(() =>
    RAW.filter(r => r.human_missions > 0).map(r => ({
      year: r.year,
      'Human Missions': r.human_missions,
      'Crew Members': r.total_crew_launched,
    })), []);

  // Chart E: total cost over time
  const costData = useMemo(() =>
    RAW.map(r => ({
      year: r.year,
      'Total Cost ($M)': Math.round(r.total_cost_million_usd),
    })), []);

  const xAxisStyle = { fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' };
  const yAxisStyle = { fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' };
  const gridStyle = { stroke: 'hsl(var(--border))', strokeDasharray: '3 3', strokeOpacity: 0.5 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-8"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Rocket className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">Launch Log</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            70 years of human spaceflight — 1957 to 2026 — across {fmt(totals.launches)} launches from 13 spacefaring nations.
          </p>
        </div>
      </div>

      {/* Era badges */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ERA_COLORS).map(([name, color]) => (
          <Badge key={name} variant="outline" className="font-mono text-xs" style={{ borderColor: color, color }}>
            {name}
          </Badge>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Rocket} label="Total Launches" value={fmt(totals.launches)} sub={`Peak: ${totals.peakYear} (${totals.peakLaunches})`} color="bg-primary/10 text-primary" />
        <StatCard icon={Users} label="Humans to Space" value={fmt(totals.humans)} sub="across all missions" color="bg-cyan-500/10 text-cyan-400" />
        <StatCard icon={RefreshCw} label="Boosters Recovered" value={fmt(totals.recoveries)} sub="since 2015" color="bg-emerald-500/10 text-emerald-400" />
        <StatCard icon={DollarSign} label="Total Spend" value={`$${fmt(Math.round(totals.cost / 1000))}B`} sub="estimated, all years" color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={Zap} label="Avg Success Rate" value={`${(RAW.reduce((s,r)=>s+r.success_rate_pct,0)/RAW.length).toFixed(1)}%`} sub="across 70 years" color="bg-violet-500/10 text-violet-400" />
      </div>

      {/* Chart A — Launches per year */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Launches Per Year
          </CardTitle>
          <CardDescription>Successful launches (green) vs failures (red) — 1957–2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={launchData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="year" ticks={eraTick.map(Number)} tick={xAxisStyle} />
                <YAxis tick={yAxisStyle} width={32} />
                <Tooltip content={<LaunchesTooltip />} />
                <ReferenceLine x={1969} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Apollo 11', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine x={1991} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'USSR end', fill: '#6366f1', fontSize: 9 }} />
                <ReferenceLine x={2015} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'NewSpace', fill: '#10b981', fontSize: 9 }} />
                <Area type="monotone" dataKey="Successful" stroke="#10b981" strokeWidth={1.5} fill="url(#gradSuccess)" />
                <Area type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={1.5} fill="url(#gradFailed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart B + C — side by side on large screens */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Chart B — success rate */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono">Mission Success Rate</CardTitle>
            <CardDescription>% of launches that succeeded, by year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rateData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="year" ticks={[1957,1970,1985,2000,2015,2026]} tick={xAxisStyle} />
                  <YAxis domain={[30, 102]} tick={yAxisStyle} width={36} unit="%" />
                  <Tooltip content={<PercentTooltip />} />
                  <ReferenceLine y={90} stroke="#6366f1" strokeDasharray="3 3" label={{ value: '90%', fill: '#6366f1', fontSize: 9, position: 'insideLeft' }} />
                  <Line type="monotone" dataKey="Success Rate" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart C — booster recovery */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-mono flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" /> Reusability Revolution
            </CardTitle>
            <CardDescription>Booster recoveries vs total launches — 2013 to 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recoveryData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="year" tick={xAxisStyle} />
                  <YAxis tick={yAxisStyle} width={32} />
                  <Tooltip content={<LaunchesTooltip />} />
                  <Bar dataKey="Launches" fill="#6366f1" opacity={0.5} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Recovered" fill="#10b981" radius={[2, 2, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart D — human spaceflight */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Human Spaceflight
          </CardTitle>
          <CardDescription>Crewed missions and total crew members launched per year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={humanData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCrew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="year" ticks={[1957,1965,1975,1985,1995,2005,2015,2026]} tick={xAxisStyle} />
                <YAxis tick={yAxisStyle} width={32} />
                <Tooltip content={<LaunchesTooltip />} />
                <ReferenceLine x={1972} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Last Apollo', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine x={2011} stroke="#6366f1" strokeDasharray="3 3" label={{ value: 'Shuttle end', fill: '#6366f1', fontSize: 9 }} />
                <Bar dataKey="Crew Members" fill="url(#gradCrew)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Human Missions" fill="#f59e0b" opacity={0.7} radius={[2, 2, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Chart E — total cost */}
      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-mono flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" /> Annual Space Spending
          </CardTitle>
          <CardDescription>Estimated total mission cost (USD millions) per year — all spacefaring nations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="year" ticks={[1957,1970,1985,2000,2010,2020,2026]} tick={xAxisStyle} />
                <YAxis tick={yAxisStyle} width={40} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CostTooltip />} />
                <ReferenceLine x={1991} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Cold War end', fill: '#6366f1', fontSize: 9 }} />
                <Area type="monotone" dataKey="Total Cost ($M)" stroke="#f59e0b" strokeWidth={2} fill="url(#gradCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-2">
        Source: Global Space Mission Database (1957–2026) · 6,230 records · 13 spacefaring nations · 46 rocket families
      </p>
    </motion.div>
  );
}
