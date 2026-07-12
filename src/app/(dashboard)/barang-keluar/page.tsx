"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MobileCard, MobileCardField, MobileCardActions } from "@/components/ui/mobile-card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ArrowUpFromLine,
  X,
  TrendingDown,
  Calendar,
  Package,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { BarangKeluar, Barang } from "@/types";

export default function BarangKeluarPage() {
  const [transaksiList, setTransaksiList] = useState<BarangKeluar[]>([]);
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedTransaksi, setSelectedTransaksi] =
    useState<BarangKeluar | null>(null);
  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    barang_id: "",
    jumlah: "",
    tujuan: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchData = useCallback(async () => {
    setFetching(true);
    const [transaksiRes, barangRes] = await Promise.all([
      supabase
        .from("barang_keluar")
        .select("*, barang(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("barang")
        .select("*")
        .eq("status", "aktif")
        .order("nama"),
    ]);
    setTransaksiList(transaksiRes.data || []);
    setBarangList(barangRes.data || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!form.barang_id) {
      toast.error("Barang harus dipilih");
      setLoading(false);
      return;
    }

    const jumlah = form.jumlah === "" ? 0 : Number(form.jumlah);
    if (jumlah < 1) {
      toast.error("Jumlah minimal 1");
      setLoading(false);
      return;
    }

    if (!form.tujuan.trim()) {
      toast.error("Tujuan tidak boleh kosong");
      setLoading(false);
      return;
    }

    const barang = barangList.find((b) => b.id === form.barang_id);
    if (!barang) {
      toast.error("Barang tidak ditemukan");
      setLoading(false);
      return;
    }

    if (barang.stok < jumlah) {
      toast.error(`Stok tidak mencukupi. Stok tersedia: ${barang.stok}`);
      setLoading(false);
      return;
    }

    const nomor_transaksi = `BK-${Date.now()}`;
    const { error: insertError } = await supabase
      .from("barang_keluar")
      .insert({
        nomor_transaksi,
        tanggal: form.tanggal,
        barang_id: form.barang_id,
        jumlah,
        tujuan: form.tujuan,
      });
    if (insertError) {
      toast.error("Gagal menyimpan transaksi");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("barang")
      .update({ stok: barang.stok - jumlah })
      .eq("id", form.barang_id);
    if (updateError) {
      toast.error("Gagal update stok barang");
      setLoading(false);
      return;
    }

    toast.success("Barang keluar berhasil ditambahkan");
    setOpen(false);
    setForm({
      tanggal: format(new Date(), "yyyy-MM-dd"),
      barang_id: "",
      jumlah: "",
      tujuan: "",
    });
    setLoading(false);
    fetchData();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const transaksi = transaksiList.find((t) => t.id === deleteId);
    if (!transaksi) return;

    const { error } = await supabase
      .from("barang_keluar")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error("Gagal menghapus transaksi");
      return;
    }

    const barang = barangList.find((b) => b.id === transaksi.barang_id);
    if (barang) {
      await supabase
        .from("barang")
        .update({ stok: barang.stok + transaksi.jumlah })
        .eq("id", transaksi.barang_id);
    }

    toast.success("Transaksi berhasil dihapus");
    setDeleteId(null);
    fetchData();
  }

  function handleDetail(transaksi: BarangKeluar) {
    setSelectedTransaksi(transaksi);
    setDetailOpen(true);
  }

  const filteredTransaksi = transaksiList.filter(
    (t) =>
      t.nomor_transaksi.toLowerCase().includes(search.toLowerCase()) ||
      t.barang?.nama.toLowerCase().includes(search.toLowerCase()) ||
      t.tujuan.toLowerCase().includes(search.toLowerCase())
  );

  const selectedBarang = barangList.find((b) => b.id === form.barang_id) || null;
  const jumlahInput = form.jumlah === "" ? 0 : Number(form.jumlah);
  const stokAkhir = selectedBarang ? selectedBarang.stok - jumlahInput : 0;
  const stokKurang = selectedBarang && jumlahInput > selectedBarang.stok;

  const totalJumlah = transaksiList.reduce((sum, t) => sum + t.jumlah, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <ArrowUpFromLine className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Barang Keluar
              </h1>
              <p className="text-sm text-muted-foreground">
                Riwayat barang keluar gudang
              </p>
            </div>
          </div>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(!!v);
            if (!v)
              setForm({
                tanggal: format(new Date(), "yyyy-MM-dd"),
                barang_id: "",
                jumlah: "",
                tujuan: "",
              });
          }}
        >
          <DialogTrigger
            render={
              <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90" />
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Keluar
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Tambah Barang Keluar
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="tanggal" className="text-sm">
                  Tanggal
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={(e) =>
                      setForm({ ...form, tanggal: e.target.value })
                    }
                    className="h-10 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barang_id" className="text-sm">
                  Barang
                </Label>
                <select
                  id="barang_id"
                  value={form.barang_id}
                  onChange={(e) =>
                    setForm({ ...form, barang_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Pilih barang</option>
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.kode} - {b.nama} (Stok: {b.stok})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Barang */}
              {selectedBarang && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedBarang.nama}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {selectedBarang.kode}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-[10px] text-muted-foreground">Stok</p>
                      <p className="text-sm font-bold">{selectedBarang.stok}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background">
                      <p className="text-[10px] text-muted-foreground">Min.</p>
                      <p className="text-sm font-bold">
                        {selectedBarang.minimal_stok}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        stokKurang
                          ? "bg-red-50 dark:bg-red-950/50"
                          : "bg-amber-50 dark:bg-amber-950/50"
                      }`}
                    >
                      <p className="text-[10px] text-muted-foreground">Akhir</p>
                      <p
                        className={`text-sm font-bold ${
                          stokKurang
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {stokAkhir}
                      </p>
                    </div>
                  </div>
                  {stokKurang && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <p className="text-xs">
                        Stok tidak mencukupi! Tersisa {selectedBarang.stok} unit
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="jumlah" className="text-sm">
                  Jumlah
                </Label>
                <Input
                  id="jumlah"
                  type="text"
                  inputMode="numeric"
                  value={form.jumlah}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setForm({ ...form, jumlah: val });
                  }}
                  placeholder="0"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tujuan" className="text-sm">
                  Tujuan / Penerima
                </Label>
                <Input
                  id="tujuan"
                  value={form.tujuan}
                  onChange={(e) =>
                    setForm({ ...form, tujuan: e.target.value })
                  }
                  placeholder="Masukkan tujuan atau nama penerima"
                  className="h-10 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading || stokKurang}
              >
                {loading ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Transaksi</p>
          <p className="text-xl font-bold mt-1">{transaksiList.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Barang Keluar</p>
          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {totalJumlah}
          </p>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Detail Barang Keluar
            </DialogTitle>
          </DialogHeader>
          {selectedTransaksi && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <TrendingDown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">
                    {selectedTransaksi.barang?.nama || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedTransaksi.nomor_transaksi}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Tanggal", value: selectedTransaksi.tanggal },
                  { label: "Tujuan", value: selectedTransaksi.tujuan },
                  {
                    label: "Jumlah",
                    value: `-${selectedTransaksi.jumlah}`,
                    highlight: true,
                  },
                  {
                    label: "Stok Saat Ini",
                    value: String(selectedTransaksi.barang?.stok ?? "-"),
                  },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p
                      className={`text-sm font-medium mt-0.5 ${item.highlight ? "text-amber-600 dark:text-amber-400" : ""}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan no transaksi, barang, atau tujuan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-10 rounded-xl bg-muted/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {filteredTransaksi.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Menampilkan {filteredTransaksi.length} dari{" "}
              {transaksiList.length} transaksi
            </p>
          )}
        </div>

        {/* Table / Cards */}
        <div className="p-4">
          {fetching ? (
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
          ) : filteredTransaksi.length === 0 ? (
            <EmptyState
              icon={ArrowUpFromLine}
              title="Tidak ada data barang keluar"
              description={
                search
                  ? "Coba kata kunci lain"
                  : "Mulai catat barang keluar"
              }
              actionLabel={search ? undefined : "Tambah Barang Keluar"}
              onAction={search ? undefined : () => setOpen(true)}
            />
          ) : (
            <>
              {/* Desktop Table */}
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
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransaksi.map((transaksi, index) => (
                      <TableRow key={transaksi.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaksi.nomor_transaksi}
                        </TableCell>
                        <TableCell>{transaksi.tanggal}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {transaksi.barang?.nama || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                            -{transaksi.jumlah}
                          </span>
                        </TableCell>
                        <TableCell>{transaksi.tujuan}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDetail(transaksi)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteId(transaksi.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {filteredTransaksi.map((transaksi) => (
                  <MobileCard key={transaksi.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {transaksi.nomor_transaksi}
                        </p>
                        <p className="font-medium">
                          {transaksi.barang?.nama || "-"}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        -{transaksi.jumlah}
                      </span>
                    </div>
                    <MobileCardField label="Tanggal">
                      {transaksi.tanggal}
                    </MobileCardField>
                    <MobileCardField label="Tujuan">
                      {transaksi.tujuan}
                    </MobileCardField>
                    <MobileCardActions>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDetail(transaksi)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(transaksi.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </MobileCardActions>
                  </MobileCard>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        title="Hapus Transaksi?"
        description="Transaksi akan dihapus dan stok barang akan ditambahkan kembali sesuai jumlah transaksi ini."
        onConfirm={handleDelete}
      />
    </div>
  );
}
