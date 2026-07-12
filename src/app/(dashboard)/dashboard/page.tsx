"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  ShoppingCart,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Barang, BarangMasuk, BarangKeluar } from "@/types";

interface Stats {
  totalBarang: number;
  totalSupplier: number;
  totalBarangMasuk: number;
  totalBarangKeluar: number;
  barangMenipis: number;
}

interface ChartData {
  bulan: string;
  masuk: number;
  keluar: number;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function getMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function getLast6Months(): { start: string; label: string }[] {
  const months: { start: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      start: d.toISOString().slice(0, 10),
      label: getMonthLabel(d),
    });
  }
  return months;
}

function getMonthIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  const diff =
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return 5 - diff;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalBarang: 0,
    totalSupplier: 0,
    totalBarangMasuk: 0,
    totalBarangKeluar: 0,
    barangMenipis: 0,
  });
  const [barangMenipis, setBarangMenipis] = useState<Barang[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const last6Months = useMemo(() => getLast6Months(), []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const sixMonthsAgo = last6Months[0].start;

      const [
        { count: totalBarang },
        { count: totalSupplier },
        { count: totalBarangMasuk },
        { count: totalBarangKeluar },
        { data: barangData },
        { data: masukData },
        { data: keluarData },
      ] = await Promise.all([
        supabase
          .from("barang")
          .select("*", { count: "exact", head: true })
          .eq("status", "aktif"),
        supabase.from("supplier").select("*", { count: "exact", head: true }),
        supabase.from("barang_masuk").select("*", { count: "exact", head: true }),
        supabase.from("barang_keluar").select("*", { count: "exact", head: true }),
        supabase
          .from("barang")
          .select("*, kategori(*), supplier(*)")
          .eq("status", "aktif")
          .order("stok"),
        supabase
          .from("barang_masuk")
          .select("tanggal, jumlah")
          .gte("tanggal", sixMonthsAgo),
        supabase
          .from("barang_keluar")
          .select("tanggal, jumlah")
          .gte("tanggal", sixMonthsAgo),
      ]);

      const menipis = (barangData || []).filter(
        (b: Barang) => b.stok <= b.minimal_stok
      );
      setStats({
        totalBarang: totalBarang || 0,
        totalSupplier: totalSupplier || 0,
        totalBarangMasuk: totalBarangMasuk || 0,
        totalBarangKeluar: totalBarangKeluar || 0,
        barangMenipis: menipis.length,
      });
      setBarangMenipis(menipis.slice(0, 8));

      // Build chart data
      const masukPerMonth = new Array(6).fill(0);
      const keluarPerMonth = new Array(6).fill(0);

      (masukData || []).forEach((item) => {
        const idx = getMonthIndex(item.tanggal);
        if (idx >= 0 && idx < 6) masukPerMonth[idx] += item.jumlah;
      });

      (keluarData || []).forEach((item) => {
        const idx = getMonthIndex(item.tanggal);
        if (idx >= 0 && idx < 6) keluarPerMonth[idx] += item.jumlah;
      });

      const chartResult = last6Months.map((m, i) => ({
        bulan: m.label,
        masuk: masukPerMonth[i],
        keluar: keluarPerMonth[i],
      }));
      setChartData(chartResult);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [last6Months]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: "Total Barang",
      value: stats.totalBarang,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Total Supplier",
      value: stats.totalSupplier,
      icon: Truck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    },
    {
      title: "Barang Masuk",
      value: stats.totalBarangMasuk,
      icon: TrendingUp,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
      iconBg: "bg-violet-100 dark:bg-violet-900/50",
    },
    {
      title: "Barang Keluar",
      value: stats.totalBarangKeluar,
      icon: TrendingDown,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
    },
    {
      title: "Stok Menipis",
      value: stats.barangMenipis,
      icon: AlertTriangle,
      color:
        stats.barangMenipis > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-muted-foreground",
      bg:
        stats.barangMenipis > 0
          ? "bg-rose-50 dark:bg-rose-950/50"
          : "bg-muted/50",
      iconBg:
        stats.barangMenipis > 0
          ? "bg-rose-100 dark:bg-rose-900/50"
          : "bg-muted",
    },
  ];

  const quickActions = [
    {
      title: "Barang Masuk",
      description: "Catat barang masuk",
      href: "/barang-masuk",
      icon: ArrowDownToLine,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-950",
    },
    {
      title: "Barang Keluar",
      description: "Catat barang keluar",
      href: "/barang-keluar",
      icon: ArrowUpFromLine,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-950",
    },
    {
      title: "Stok Barang",
      description: "Kelola stok",
      href: "/barang",
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-950",
    },
    {
      title: "Laporan",
      description: "Lihat laporan",
      href: "/laporan",
      icon: FileText,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-950",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {profile?.nama?.split(" ")[0] || "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Berikut ringkasan kondisi stok barang hari ini
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Perbarui
        </button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              className="border-border/50 hover:border-border transition-colors"
            >
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${stat.iconBg}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight mt-0.5">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Aksi Cepat
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border border-border/50 transition-all cursor-pointer group ${action.bg}`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl bg-background/80 border border-border/30 ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Chart - Transaksi 6 Bulan Terakhir */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50">
              <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-base">
              Transaksi 6 Bulan Terakhir
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[280px] w-full rounded-xl" />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="bulan"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "13px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="masuk"
                    name="Barang Masuk"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="keluar"
                    name="Barang Keluar"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <CardTitle className="text-base">Stok Menipis</CardTitle>
            </div>
            {barangMenipis.length > 0 && (
              <Link
                href="/barang"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
              >
                Lihat semua
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : barangMenipis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-3">
                <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-medium">Semua stok barang aman</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tidak ada barang yang perlu diprioritaskan
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {barangMenipis.map((barang) => (
                <div
                  key={barang.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50">
                    <Package className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {barang.nama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {barang.kategori?.nama || "-"} &middot; {barang.kode}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="font-mono">
                      {barang.stok}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      min. {barang.minimal_stok}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
