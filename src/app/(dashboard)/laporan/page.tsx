"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, File } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Barang, BarangMasuk, BarangKeluar, Kategori, Supplier } from "@/types";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [barangRes, masukRes, keluarRes, kategoriRes, supplierRes] = await Promise.all([
        supabase.from("barang").select("*, kategori(*), supplier(*)").order("nama"),
        supabase.from("barang_masuk").select("*, barang(*), supplier(*)").order("tanggal", { ascending: false }),
        supabase.from("barang_keluar").select("*, barang(*)").order("tanggal", { ascending: false }),
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
  }

  function filterByDate<T extends { tanggal: string }>(items: T[]): T[] {
    return items.filter((item) => {
      if (filterTanggalAwal && item.tanggal < filterTanggalAwal) return false;
      if (filterTanggalAkhir && item.tanggal > filterTanggalAkhir) return false;
      return true;
    });
  }

  const filteredBarang = barangList.filter((b) => {
    if (filterKategori !== "all" && b.kategori_id !== filterKategori) return false;
    if (filterSupplier !== "all" && b.supplier_id !== filterSupplier) return false;
    return true;
  });

  const filteredMasuk = filterByDate(
    masukList.filter((t) => {
      if (filterSupplier !== "all" && t.supplier_id !== filterSupplier) return false;
      return true;
    })
  );

  const filteredKeluar = filterByDate(keluarList);

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
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
        headers.map((h) => {
          const val = row[h];
          return typeof val === "string" && val.includes(",") ? `"${val}"` : val;
        }).join(",")
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

  async function exportPDF(title: string, headers: string[], rows: (string | number)[][]) {
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
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 30);

      autoTableModule.default(doc, {
        head: [headers],
        body: rows,
        startY: 35,
      });

      doc.save(`laporan-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Gagal membuat PDF");
    }
  }

  function exportStokPDF() {
    const headers = ["Kode", "Nama", "Kategori", "Supplier", "Stok", "Harga", "Status"];
    const rows = filteredBarang.map((b) => [
      b.kode,
      b.nama,
      b.kategori?.nama || "-",
      b.supplier?.nama || "-",
      b.stok,
      formatRupiah(b.harga_beli),
      b.status,
    ]);
    exportPDF("Stok Barang", headers, rows);
  }

  function exportStokExcel() {
    const data = filteredBarang.map((b) => ({
      Kode: b.kode,
      Nama: b.nama,
      Kategori: b.kategori?.nama || "-",
      Supplier: b.supplier?.nama || "-",
      Stok: b.stok,
      "Harga Beli": b.harga_beli,
      Status: b.status,
    }));
    exportExcel(data, "laporan-stok-barang");
  }

  function exportStokCSV() {
    const data = filteredBarang.map((b) => ({
      Kode: b.kode,
      Nama: b.nama,
      Kategori: b.kategori?.nama || "-",
      Supplier: b.supplier?.nama || "-",
      Stok: b.stok,
      "Harga Beli": b.harga_beli,
      Status: b.status,
    }));
    exportCSV(data, "laporan-stok-barang");
  }

  function exportMasukPDF() {
    const headers = ["No Transaksi", "Tanggal", "Barang", "Supplier", "Jumlah"];
    const rows = filteredMasuk.map((t) => [
      t.nomor_transaksi,
      t.tanggal,
      t.barang?.nama || "-",
      t.supplier?.nama || "-",
      t.jumlah,
    ]);
    exportPDF("Barang Masuk", headers, rows);
  }

  function exportMasukExcel() {
    const data = filteredMasuk.map((t) => ({
      "No Transaksi": t.nomor_transaksi,
      Tanggal: t.tanggal,
      Barang: t.barang?.nama || "-",
      Supplier: t.supplier?.nama || "-",
      Jumlah: t.jumlah,
    }));
    exportExcel(data, "laporan-barang-masuk");
  }

  function exportMasukCSV() {
    const data = filteredMasuk.map((t) => ({
      "No Transaksi": t.nomor_transaksi,
      Tanggal: t.tanggal,
      Barang: t.barang?.nama || "-",
      Supplier: t.supplier?.nama || "-",
      Jumlah: t.jumlah,
    }));
    exportCSV(data, "laporan-barang-masuk");
  }

  function exportKeluarPDF() {
    const headers = ["No Transaksi", "Tanggal", "Barang", "Jumlah", "Tujuan"];
    const rows = filteredKeluar.map((t) => [
      t.nomor_transaksi,
      t.tanggal,
      t.barang?.nama || "-",
      t.jumlah,
      t.tujuan,
    ]);
    exportPDF("Barang Keluar", headers, rows);
  }

  function exportKeluarExcel() {
    const data = filteredKeluar.map((t) => ({
      "No Transaksi": t.nomor_transaksi,
      Tanggal: t.tanggal,
      Barang: t.barang?.nama || "-",
      Jumlah: t.jumlah,
      Tujuan: t.tujuan,
    }));
    exportExcel(data, "laporan-barang-keluar");
  }

  function exportKeluarCSV() {
    const data = filteredKeluar.map((t) => ({
      "No Transaksi": t.nomor_transaksi,
      Tanggal: t.tanggal,
      Barang: t.barang?.nama || "-",
      Jumlah: t.jumlah,
      Tujuan: t.tujuan,
    }));
    exportCSV(data, "laporan-barang-keluar");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-500">Lihat dan ekspor laporan data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Kategori</Label>
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Semua Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Supplier</Label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Semua Supplier</option>
                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Tanggal Awal</Label>
              <Input
                type="date"
                value={filterTanggalAwal}
                onChange={(e) => setFilterTanggalAwal(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Tanggal Akhir</Label>
              <Input
                type="date"
                value={filterTanggalAkhir}
                onChange={(e) => setFilterTanggalAkhir(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { value: "stok", label: "Laporan Stok" },
          { value: "masuk", label: "Laporan Masuk" },
          { value: "keluar", label: "Laporan Keluar" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "stok" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportStokPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportStokExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportStokCSV}>
              <File className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBarang.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBarang.map((b, i) => (
                      <TableRow key={b.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono">{b.kode}</TableCell>
                        <TableCell>{b.nama}</TableCell>
                        <TableCell>{b.kategori?.nama || "-"}</TableCell>
                        <TableCell>{b.supplier?.nama || "-"}</TableCell>
                        <TableCell>
                          <span className={b.stok <= b.minimal_stok ? "text-red-600 font-bold" : ""}>
                            {b.stok}
                          </span>
                        </TableCell>
                        <TableCell>{formatRupiah(b.harga_beli)}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === "aktif" ? "default" : "secondary"}>
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "masuk" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportMasukPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportMasukExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportMasukCSV}>
              <File className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>No Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMasuk.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMasuk.map((t, i) => (
                      <TableRow key={t.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{t.nomor_transaksi}</TableCell>
                        <TableCell>{t.tanggal}</TableCell>
                        <TableCell>{t.barang?.nama || "-"}</TableCell>
                        <TableCell>{t.supplier?.nama || "-"}</TableCell>
                        <TableCell className="font-bold text-emerald-600">+{t.jumlah}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "keluar" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportKeluarPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportKeluarExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportKeluarCSV}>
              <File className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>No Transaksi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tujuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeluar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeluar.map((t, i) => (
                      <TableRow key={t.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{t.nomor_transaksi}</TableCell>
                        <TableCell>{t.tanggal}</TableCell>
                        <TableCell>{t.barang?.nama || "-"}</TableCell>
                        <TableCell className="font-bold text-orange-600">-{t.jumlah}</TableCell>
                        <TableCell>{t.tujuan}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
