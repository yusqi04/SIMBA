"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MobileCard, MobileCardField } from "@/components/ui/mobile-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  FileSpreadsheet,
  File,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  TrendingDown,
  X,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Barang, BarangMasuk, BarangKeluar, Kategori, Supplier } from "@/types";
import { cn } from "@/lib/utils";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function LaporanPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [masukList, setMasukList] = useState<BarangMasuk[]>([]);
  const [keluarList, setKeluarList] = useState<BarangKeluar[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("stok");
  const [filterKategori, setFilterKategori] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterTanggalAwal, setFilterTanggalAwal] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [barangRes, masukRes, keluarRes, kategoriRes, supplierRes] =
        await Promise.all([
          supabase
            .from("barang")
            .select("*, kategori(*), supplier(*)")
            .order("nama"),
          supabase
            .from("barang_masuk")
            .select("*, barang(*), supplier(*)")
            .order("tanggal", { ascending: false }),
          supabase
            .from("barang_keluar")
            .select("*, barang(*)")
            .order("tanggal", { ascending: false }),
          supabase.from("kategori").select("*").order("nama"),
          supabase.from("supplier").select("*").order("nama"),
        ]);
      setBarangList(barangRes.data || []);
      setMasukList(masukRes.data || []);
      setKeluarList(keluarRes.data || []);
      setKategoriList(kategoriRes.data || []);
      setSupplierList(supplierRes.data || []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function filterByDate<T extends { tanggal: string }>(items: T[]): T[] {
    return items.filter((item) => {
      if (filterTanggalAwal && item.tanggal < filterTanggalAwal) return false;
      if (filterTanggalAkhir && item.tanggal > filterTanggalAkhir) return false;
      return true;
    });
  }

  const filteredBarang = barangList.filter((b) => {
    if (filterKategori !== "all" && b.kategori_id !== filterKategori)
      return false;
    if (filterSupplier !== "all" && b.supplier_id !== filterSupplier)
      return false;
    return true;
  });

  const filteredMasuk = filterByDate(
    masukList.filter((t) => {
      if (filterSupplier !== "all" && t.supplier_id !== filterSupplier)
        return false;
      return true;
    })
  );

  const filteredKeluar = filterByDate(
    keluarList.filter((t) => {
      if (filterKategori !== "all" && t.barang?.kategori_id !== filterKategori)
        return false;
      return true;
    })
  );

  const hasActiveFilter =
    filterKategori !== "all" ||
    filterSupplier !== "all" ||
    filterTanggalAwal ||
    filterTanggalAkhir;

  function clearFilters() {
    setFilterKategori("all");
    setFilterSupplier("all");
    setFilterTanggalAwal("");
    setFilterTanggalAkhir("");
  }

  function exportCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            return typeof val === "string" && val.includes(",")
              ? `"${val}"`
              : val;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    toast.success("CSV berhasil diunduh");
  }

  function exportExcel(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    import("xlsx").then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success("Excel berhasil diunduh");
    });
  }

  async function exportPDF(
    title: string,
    headers: string[],
    rows: (string | number)[][]
  ) {
    if (rows.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDFClass = jsPDFModule.jsPDF;
      const autoTableModule = await import("jspdf-autotable");
      const doc = new jsPDFClass();
      doc.setFontSize(16);
      doc.text(`Laporan ${title}`, 14, 22);
      doc.setFontSize(10);
      doc.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID")}`,
        14,
        30
      );
      autoTableModule.default(doc, {
        head: [headers],
        body: rows,
        startY: 35,
      });
      doc.save(
        `laporan-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`
      );
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Gagal membuat PDF");
    }
  }

  // Stok exports
  function exportStokPDF() {
    exportPDF(
      "Stok Barang",
      ["Kode", "Nama", "Kategori", "Supplier", "Stok", "Harga", "Status"],
      filteredBarang.map((b) => [
        b.kode,
        b.nama,
        b.kategori?.nama || "-",
        b.supplier?.nama || "-",
        b.stok,
        formatRupiah(b.harga_beli),
        b.status,
      ])
    );
  }
  function exportStokExcel() {
    exportExcel(
      filteredBarang.map((b) => ({
        Kode: b.kode,
        Nama: b.nama,
        Kategori: b.kategori?.nama || "-",
        Supplier: b.supplier?.nama || "-",
        Stok: b.stok,
        "Harga Beli": b.harga_beli,
        Status: b.status,
      })),
      "laporan-stok-barang"
    );
  }
  function exportStokCSV() {
    exportCSV(
      filteredBarang.map((b) => ({
        Kode: b.kode,
        Nama: b.nama,
        Kategori: b.kategori?.nama || "-",
        Supplier: b.supplier?.nama || "-",
        Stok: b.stok,
        "Harga Beli": b.harga_beli,
        Status: b.status,
      })),
      "laporan-stok-barang"
    );
  }

  // Masuk exports
  function exportMasukPDF() {
    exportPDF(
      "Barang Masuk",
      ["No Transaksi", "Tanggal", "Barang", "Supplier", "Jumlah"],
      filteredMasuk.map((t) => [
        t.nomor_transaksi,
        t.tanggal,
        t.barang?.nama || "-",
        t.supplier?.nama || "-",
        t.jumlah,
      ])
    );
  }
  function exportMasukExcel() {
    exportExcel(
      filteredMasuk.map((t) => ({
        "No Transaksi": t.nomor_transaksi,
        Tanggal: t.tanggal,
        Barang: t.barang?.nama || "-",
        Supplier: t.supplier?.nama || "-",
        Jumlah: t.jumlah,
      })),
      "laporan-barang-masuk"
    );
  }
  function exportMasukCSV() {
    exportCSV(
      filteredMasuk.map((t) => ({
        "No Transaksi": t.nomor_transaksi,
        Tanggal: t.tanggal,
        Barang: t.barang?.nama || "-",
        Supplier: t.supplier?.nama || "-",
        Jumlah: t.jumlah,
      })),
      "laporan-barang-masuk"
    );
  }

  // Keluar exports
  function exportKeluarPDF() {
    exportPDF(
      "Barang Keluar",
      ["No Transaksi", "Tanggal", "Barang", "Jumlah", "Tujuan"],
      filteredKeluar.map((t) => [
        t.nomor_transaksi,
        t.tanggal,
        t.barang?.nama || "-",
        t.jumlah,
        t.tujuan,
      ])
    );
  }
  function exportKeluarExcel() {
    exportExcel(
      filteredKeluar.map((t) => ({
        "No Transaksi": t.nomor_transaksi,
        Tanggal: t.tanggal,
        Barang: t.barang?.nama || "-",
        Jumlah: t.jumlah,
        Tujuan: t.tujuan,
      })),
      "laporan-barang-keluar"
    );
  }
  function exportKeluarCSV() {
    exportCSV(
      filteredKeluar.map((t) => ({
        "No Transaksi": t.nomor_transaksi,
        Tanggal: t.tanggal,
        Barang: t.barang?.nama || "-",
        Jumlah: t.jumlah,
        Tujuan: t.tujuan,
      })),
      "laporan-barang-keluar"
    );
  }

  const tabs = [
    {
      value: "stok",
      label: "Stok Barang",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      value: "masuk",
      label: "Barang Masuk",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      value: "keluar",
      label: "Barang Keluar",
      icon: TrendingDown,
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
            <p className="text-sm text-muted-foreground">
              Lihat dan ekspor laporan data
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center justify-between w-full p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter Laporan</span>
            {hasActiveFilter && (
              <Badge variant="secondary" className="text-[10px]">
                Aktif
              </Badge>
            )}
          </div>
          {filterOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <div
          className={cn(
            "px-4 pb-4",
            !filterOpen && "hidden"
          )}
        >
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Kategori</Label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Semua Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Supplier</Label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">Semua Supplier</option>
                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Tanggal Awal
              </Label>
              <Input
                type="date"
                value={filterTanggalAwal}
                onChange={(e) => setFilterTanggalAwal(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Tanggal Akhir
              </Label>
              <Input
                type="date"
                value={filterTanggalAkhir}
                onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Reset filter
            </button>
          )}
        </div>
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
          </button>
        ))}
      </div>

      {/* Content */}
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
          {/* Stok Tab */}
          {activeTab === "stok" && (
            <div>
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium">Stok Barang</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredBarang.length} barang
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportStokPDF}
                    className="rounded-xl"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportStokExcel}
                    className="rounded-xl"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportStokCSV}
                    className="rounded-xl"
                  >
                    <File className="h-4 w-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {filteredBarang.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasActiveFilter
                        ? "Coba ubah filter"
                        : "Belum ada data barang"}
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
                              <TableCell>{b.nama}</TableCell>
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
                              <TableCell>
                                {formatRupiah(b.harga_beli)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    b.status === "aktif"
                                      ? "default"
                                      : "secondary"
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
              </div>
            </div>
          )}

          {/* Masuk Tab */}
          {activeTab === "masuk" && (
            <div>
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium">Barang Masuk</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredMasuk.length} transaksi
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMasukPDF}
                    className="rounded-xl"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMasukExcel}
                    className="rounded-xl"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportMasukCSV}
                    className="rounded-xl"
                  >
                    <File className="h-4 w-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {filteredMasuk.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <TrendingUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasActiveFilter
                        ? "Coba ubah filter"
                        : "Belum ada transaksi masuk"}
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
                          <MobileCardField label="Tanggal">
                            {t.tanggal}
                          </MobileCardField>
                          <MobileCardField label="Supplier">
                            {t.supplier?.nama || "-"}
                          </MobileCardField>
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Keluar Tab */}
          {activeTab === "keluar" && (
            <div>
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium">Barang Keluar</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredKeluar.length} transaksi
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportKeluarPDF}
                    className="rounded-xl"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportKeluarExcel}
                    className="rounded-xl"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportKeluarCSV}
                    className="rounded-xl"
                  >
                    <File className="h-4 w-4 mr-1.5" />
                    CSV
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {filteredKeluar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <TrendingDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Tidak ada data</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {hasActiveFilter
                        ? "Coba ubah filter"
                        : "Belum ada transaksi keluar"}
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
                          <MobileCardField label="Tanggal">
                            {t.tanggal}
                          </MobileCardField>
                          <MobileCardField label="Tujuan">
                            {t.tujuan}
                          </MobileCardField>
                        </MobileCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
