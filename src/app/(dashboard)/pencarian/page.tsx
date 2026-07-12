"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MobileCard, MobileCardField } from "@/components/ui/mobile-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search as SearchIcon,
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Barang, Supplier, BarangMasuk, BarangKeluar } from "@/types";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "barang", label: "Barang", icon: Package, color: "text-blue-600 dark:text-blue-400" },
  { value: "supplier", label: "Supplier", icon: Truck, color: "text-emerald-600 dark:text-emerald-400" },
  { value: "masuk", label: "Masuk", icon: ArrowDownToLine, color: "text-violet-600 dark:text-violet-400" },
  { value: "keluar", label: "Keluar", icon: ArrowUpFromLine, color: "text-amber-600 dark:text-amber-400" },
];

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PencarianPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("barang");
  const [allBarang, setAllBarang] = useState<Barang[]>([]);
  const [allSupplier, setAllSupplier] = useState<Supplier[]>([]);
  const [allMasuk, setAllMasuk] = useState<BarangMasuk[]>([]);
  const [allKeluar, setAllKeluar] = useState<BarangKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [barangRes, supplierRes, masukRes, keluarRes] = await Promise.all([
      supabase
        .from("barang")
        .select("*, kategori(*), supplier(*)")
        .order("created_at", { ascending: false }),
      supabase.from("supplier").select("*").order("created_at", { ascending: false }),
      supabase
        .from("barang_masuk")
        .select("*, barang(*), supplier(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("barang_keluar")
        .select("*, barang(*)")
        .order("created_at", { ascending: false }),
    ]);
    setAllBarang(barangRes.data || []);
    setAllSupplier(supplierRes.data || []);
    setAllMasuk(masukRes.data || []);
    setAllKeluar(keluarRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const q = query.toLowerCase().trim();

  // Search across ALL fields in EACH category
  const filteredBarang = q
    ? allBarang.filter(
        (b) =>
          b.nama.toLowerCase().includes(q) ||
          b.kode.toLowerCase().includes(q) ||
          b.kategori?.nama.toLowerCase().includes(q) ||
          b.supplier?.nama.toLowerCase().includes(q) ||
          b.satuan.toLowerCase().includes(q) ||
          String(b.harga_beli).includes(q) ||
          String(b.stok).includes(q)
      )
    : allBarang;

  const filteredSupplier = q
    ? allSupplier.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.telepon?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.alamat?.toLowerCase().includes(q)
      )
    : allSupplier;

  const filteredMasuk = q
    ? allMasuk.filter(
        (t) =>
          t.nomor_transaksi.toLowerCase().includes(q) ||
          t.tanggal.toLowerCase().includes(q) ||
          t.barang?.nama.toLowerCase().includes(q) ||
          t.barang?.kode.toLowerCase().includes(q) ||
          t.supplier?.nama.toLowerCase().includes(q) ||
          t.supplier?.telepon?.toLowerCase().includes(q) ||
          t.supplier?.email?.toLowerCase().includes(q) ||
          String(t.jumlah).includes(q)
      )
    : allMasuk;

  const filteredKeluar = q
    ? allKeluar.filter(
        (t) =>
          t.nomor_transaksi.toLowerCase().includes(q) ||
          t.tanggal.toLowerCase().includes(q) ||
          t.barang?.nama.toLowerCase().includes(q) ||
          t.barang?.kode.toLowerCase().includes(q) ||
          t.tujuan.toLowerCase().includes(q) ||
          String(t.jumlah).includes(q)
      )
    : allKeluar;

  // Auto-switch tab based on query content
  useEffect(() => {
    if (!q) {
      setActiveTab("barang");
      return;
    }

    if (q.startsWith("bm") || q.startsWith("bm-")) {
      setActiveTab("masuk");
    } else if (q.startsWith("bk") || q.startsWith("bk-")) {
      setActiveTab("keluar");
    } else if (filteredMasuk.length > 0 && filteredMasuk.length >= filteredBarang.length && filteredMasuk.length >= filteredSupplier.length && filteredMasuk.length >= filteredKeluar.length) {
      setActiveTab("masuk");
    } else if (filteredKeluar.length > 0 && filteredKeluar.length >= filteredBarang.length && filteredKeluar.length >= filteredSupplier.length) {
      setActiveTab("keluar");
    } else if (filteredSupplier.length > 0 && filteredSupplier.length >= filteredBarang.length) {
      setActiveTab("supplier");
    } else {
      setActiveTab("barang");
    }
  }, [q, filteredBarang.length, filteredSupplier.length, filteredMasuk.length, filteredKeluar.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tabCounts = {
    barang: filteredBarang.length,
    supplier: filteredSupplier.length,
    masuk: filteredMasuk.length,
    keluar: filteredKeluar.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/50">
            <SearchIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pencarian</h1>
            <p className="text-sm text-muted-foreground">
              Cari data barang, supplier, dan transaksi
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Cari nomor transaksi, tanggal, nama barang, kode, supplier, tujuan, alamat, email, telepon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pl-12 pr-20 rounded-xl text-base bg-muted/30"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query ? (
              <button
                onClick={() => setQuery("")}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <kbd className="px-2 py-1 rounded-lg bg-muted border border-border/50 text-xs font-mono text-muted-foreground">
                Ctrl+K
              </kbd>
            )}
          </div>
        </div>
        {query && (
          <p className="text-xs text-muted-foreground mt-2">
            Menampilkan hasil untuk &quot;{query}&quot; di semua kategori
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.value
                ? "bg-card border border-border/50 shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon
              className={cn(
                "h-4 w-4",
                activeTab === tab.value ? tab.color : ""
              )}
            />
            {tab.label}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.value
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tabCounts[tab.value as keyof typeof tabCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="p-4">
            {/* Barang Tab */}
            {activeTab === "barang" && (
              <>
                {filteredBarang.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      {query ? "Tidak ada barang yang cocok" : "Tidak ada data barang"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {query ? "Coba kata kunci lain" : "Belum ada data barang"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Kode</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-center">Stok</TableHead>
                            <TableHead>Harga</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBarang.map((b, i) => (
                            <TableRow key={b.id}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {b.kode}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  {b.nama}
                                </div>
                              </TableCell>
                              <TableCell>{b.kategori?.nama || "-"}</TableCell>
                              <TableCell>{b.supplier?.nama || "-"}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={
                                    b.stok <= b.minimal_stok
                                      ? "text-red-600 font-bold"
                                      : ""
                                  }
                                >
                                  {b.stok}
                                </span>
                              </TableCell>
                              <TableCell>{formatRupiah(b.harga_beli)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    b.status === "aktif" ? "default" : "secondary"
                                  }
                                >
                                  {b.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden space-y-2">
                      {filteredBarang.map((b) => (
                        <MobileCard key={b.id}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {b.kode}
                              </p>
                              <p className="font-medium">{b.nama}</p>
                            </div>
                            <Badge
                              variant={
                                b.status === "aktif" ? "default" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {b.status}
                            </Badge>
                          </div>
                          <MobileCardField label="Kategori">
                            {b.kategori?.nama || "-"}
                          </MobileCardField>
                          <MobileCardField label="Supplier">
                            {b.supplier?.nama || "-"}
                          </MobileCardField>
                          <MobileCardField label="Stok">
                            <span
                              className={
                                b.stok <= b.minimal_stok
                                  ? "text-red-600 font-bold"
                                  : ""
                              }
                            >
                              {b.stok}
                            </span>
                          </MobileCardField>
                          <MobileCardField label="Harga">
                            {formatRupiah(b.harga_beli)}
                          </MobileCardField>
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Supplier Tab */}
            {activeTab === "supplier" && (
              <>
                {filteredSupplier.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <Truck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      {query
                        ? "Tidak ada supplier yang cocok"
                        : "Tidak ada data supplier"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {query ? "Coba kata kunci lain" : "Belum ada data supplier"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Telepon</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Alamat</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSupplier.map((s, i) => (
                            <TableRow key={s.id}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                                    <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  </div>
                                  {s.nama}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  {s.telepon}
                                </div>
                              </TableCell>
                              <TableCell>
                                {s.email ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {s.email}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                {s.alamat ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate">{s.alamat}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden space-y-2">
                      {filteredSupplier.map((s) => (
                        <MobileCard key={s.id}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{s.nama}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {s.email || s.telepon}
                              </p>
                            </div>
                          </div>
                          {s.alamat && (
                            <MobileCardField label="Alamat">
                              <span className="truncate text-right max-w-[180px] inline-block">
                                {s.alamat}
                              </span>
                            </MobileCardField>
                          )}
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Masuk Tab */}
            {activeTab === "masuk" && (
              <>
                {filteredMasuk.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <ArrowDownToLine className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      {query
                        ? "Tidak ada transaksi yang cocok"
                        : "Tidak ada data barang masuk"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {query ? "Coba kata kunci lain" : "Belum ada transaksi masuk"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>No Transaksi</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Barang</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead className="text-center">Jumlah</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMasuk.map((t, i) => (
                            <TableRow key={t.id}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {t.nomor_transaksi}
                              </TableCell>
                              <TableCell>{t.tanggal}</TableCell>
                              <TableCell>{t.barang?.nama || "-"}</TableCell>
                              <TableCell>{t.supplier?.nama || "-"}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                                  +{t.jumlah}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden space-y-2">
                      {filteredMasuk.map((t) => (
                        <MobileCard key={t.id}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {t.nomor_transaksi}
                              </p>
                              <p className="font-medium">
                                {t.barang?.nama || "-"}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                              +{t.jumlah}
                            </span>
                          </div>
                          <MobileCardField label="Supplier">
                            {t.supplier?.nama || "-"}
                          </MobileCardField>
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Keluar Tab */}
            {activeTab === "keluar" && (
              <>
                {filteredKeluar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <ArrowUpFromLine className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      {query
                        ? "Tidak ada transaksi yang cocok"
                        : "Tidak ada data barang keluar"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {query ? "Coba kata kunci lain" : "Belum ada transaksi keluar"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>No Transaksi</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Barang</TableHead>
                            <TableHead className="text-center">Jumlah</TableHead>
                            <TableHead>Tujuan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredKeluar.map((t, i) => (
                            <TableRow key={t.id}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {t.nomor_transaksi}
                              </TableCell>
                              <TableCell>{t.tanggal}</TableCell>
                              <TableCell>{t.barang?.nama || "-"}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                                  -{t.jumlah}
                                </span>
                              </TableCell>
                              <TableCell>{t.tujuan}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden space-y-2">
                      {filteredKeluar.map((t) => (
                        <MobileCard key={t.id}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-mono text-xs text-muted-foreground">
                                {t.nomor_transaksi}
                              </p>
                              <p className="font-medium">
                                {t.barang?.nama || "-"}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                              -{t.jumlah}
                            </span>
                          </div>
                          <MobileCardField label="Tujuan">
                            {t.tujuan}
                          </MobileCardField>
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
