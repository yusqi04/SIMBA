"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Barang } from "@/types";

interface Stats {
  totalBarang: number;
  totalSupplier: number;
  totalBarangMasuk: number;
  totalBarangKeluar: number;
  barangMenipis: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBarang: 0,
    totalSupplier: 0,
    totalBarangMasuk: 0,
    totalBarangKeluar: 0,
    barangMenipis: 0,
  });
  const [barangMenipis, setBarangMenipis] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [
        { count: totalBarang },
        { count: totalSupplier },
        { count: totalBarangMasuk },
        { count: totalBarangKeluar },
        { data: barangData },
      ] = await Promise.all([
        supabase.from("barang").select("*", { count: "exact", head: true }),
        supabase.from("supplier").select("*", { count: "exact", head: true }),
        supabase.from("barang_masuk").select("*", { count: "exact", head: true }),
        supabase.from("barang_keluar").select("*", { count: "exact", head: true }),
        supabase.from("barang").select("*, kategori(*), supplier(*)").eq("status", "aktif").order("stok"),
      ]);

      const menipis = (barangData || []).filter((b: Barang) => b.stok <= b.minimal_stok);

      setStats({
        totalBarang: totalBarang || 0,
        totalSupplier: totalSupplier || 0,
        totalBarangMasuk: totalBarangMasuk || 0,
        totalBarangKeluar: totalBarangKeluar || 0,
        barangMenipis: menipis.length,
      });

      setBarangMenipis(menipis.slice(0, 10));
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { title: "Total Barang", value: stats.totalBarang, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Supplier", value: stats.totalSupplier, icon: Truck, color: "text-green-600", bg: "bg-green-50" },
    { title: "Barang Masuk", value: stats.totalBarangMasuk, icon: ArrowDownToLine, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Barang Keluar", value: stats.totalBarangKeluar, icon: ArrowUpFromLine, color: "text-orange-600", bg: "bg-orange-50" },
    { title: "Stok Menipis", value: stats.barangMenipis, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Ringkasan kondisi stok barang</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Barang Stok Menipis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Memuat data...</p>
          ) : barangMenipis.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Semua stok barang aman</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Minimal Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barangMenipis.map((barang, index) => (
                  <TableRow key={barang.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono">{barang.kode}</TableCell>
                    <TableCell>{barang.nama}</TableCell>
                    <TableCell>{barang.kategori?.nama || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{barang.stok}</Badge>
                    </TableCell>
                    <TableCell>{barang.minimal_stok}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
