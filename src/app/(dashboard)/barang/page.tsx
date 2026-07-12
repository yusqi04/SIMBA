"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  Package,
  X,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Barang, Kategori, Supplier } from "@/types";
import { barangSchema } from "@/lib/validations";

type SortKey = "nama" | "kode" | "stok" | "harga_beli";
type SortDir = "asc" | "desc";

export default function BarangPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [sortKey, setSortKey] = useState<SortKey>("nama");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    kategori_id: "",
    supplier_id: "",
    satuan: "",
    harga_beli: "",
    minimal_stok: "",
    status: "aktif" as "aktif" | "nonaktif",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchData = useCallback(async () => {
    setFetching(true);
    const [barangRes, kategoriRes, supplierRes] = await Promise.all([
      supabase
        .from("barang")
        .select("*, kategori(*), supplier(*)")
        .order("created_at", { ascending: false }),
      supabase.from("kategori").select("*").order("nama"),
      supabase.from("supplier").select("*").order("nama"),
    ]);
    setBarangList(barangRes.data || []);
    setKategoriList(kategoriRes.data || []);
    setSupplierList(supplierRes.data || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const formData = {
      ...form,
      harga_beli: form.harga_beli === "" ? 0 : Number(form.harga_beli),
      minimal_stok: form.minimal_stok === "" ? 0 : Number(form.minimal_stok),
    };

    const result = barangSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("barang")
        .update(formData)
        .eq("id", editingId);
      if (error) {
        toast.error("Gagal mengupdate barang");
        setLoading(false);
        return;
      }
      toast.success("Barang berhasil diupdate");
    } else {
      const { error } = await supabase.from("barang").insert({ ...formData, stok: 0 });
      if (error) {
        if (error.code === "23505") toast.error("Kode barang sudah digunakan");
        else toast.error("Gagal menambahkan barang");
        setLoading(false);
        return;
      }
      toast.success("Barang berhasil ditambahkan");
    }

    setOpen(false);
    resetForm();
    setLoading(false);
    fetchData();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase
      .from("barang")
      .update({ status: "nonaktif" })
      .eq("id", deleteId);
    if (error) {
      toast.error("Gagal menonaktifkan barang");
      return;
    }
    toast.success("Barang berhasil dinonaktifkan");
    setDeleteId(null);
    fetchData();
  }

  function handleEdit(barang: Barang) {
    setEditingId(barang.id);
    setForm({
      kode: barang.kode,
      nama: barang.nama,
      kategori_id: barang.kategori_id,
      supplier_id: barang.supplier_id,
      satuan: barang.satuan,
      harga_beli: String(barang.harga_beli),
      minimal_stok: String(barang.minimal_stok),
      status: barang.status,
    });
    setOpen(true);
  }

  function handleDetail(barang: Barang) {
    setSelectedBarang(barang);
    setDetailOpen(true);
  }

  function resetForm() {
    setForm({
      kode: "",
      nama: "",
      kategori_id: "",
      supplier_id: "",
      satuan: "",
      harga_beli: "",
      minimal_stok: "",
      status: "aktif",
    });
    setEditingId(null);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredBarang = barangList
    .filter((b) => {
      const matchSearch =
        b.nama.toLowerCase().includes(search.toLowerCase()) ||
        b.kode.toLowerCase().includes(search.toLowerCase());
      const matchKategori = !filterKategori || b.kategori_id === filterKategori;
      const matchStatus =
        filterStatus === "semua" || b.status === filterStatus;
      return matchSearch && matchKategori && matchStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof aVal === "string") return aVal.localeCompare(bVal as string) * dir;
      return ((aVal as number) - (bVal as number)) * dir;
    });

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  const getStockStatus = (barang: Barang) => {
    if (barang.stok === 0)
      return { label: "Habis", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" };
    if (barang.stok <= barang.minimal_stok)
      return { label: "Menipis", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" };
    return { label: "Aman", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" };
  };

  const totalStok = barangList
    .filter((b) => b.status === "aktif")
    .reduce((sum, b) => sum + b.stok, 0);
  const stokMenipis = barangList.filter(
    (b) => b.status === "aktif" && b.stok <= b.minimal_stok
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Barang</h1>
              <p className="text-sm text-muted-foreground">
                Kelola data stok barang
              </p>
            </div>
          </div>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(!!v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger
            render={
              <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90" />
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Barang
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingId ? "Edit Barang" : "Tambah Barang Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kode" className="text-sm">
                    Kode Barang
                  </Label>
                  <Input
                    id="kode"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="BRG-001"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama" className="text-sm">
                    Nama Barang
                  </Label>
                  <Input
                    id="nama"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Masukkan nama barang"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kategori_id" className="text-sm">
                    Kategori
                  </Label>
                  <select
                    id="kategori_id"
                    value={form.kategori_id}
                    onChange={(e) =>
                      setForm({ ...form, kategori_id: e.target.value })
                    }
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Pilih kategori</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id" className="text-sm">
                    Supplier
                  </Label>
                  <select
                    id="supplier_id"
                    value={form.supplier_id}
                    onChange={(e) =>
                      setForm({ ...form, supplier_id: e.target.value })
                    }
                    className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Pilih supplier</option>
                    {supplierList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="satuan" className="text-sm">
                    Satuan
                  </Label>
                  <Input
                    id="satuan"
                    value={form.satuan}
                    onChange={(e) =>
                      setForm({ ...form, satuan: e.target.value })
                    }
                    placeholder="Pcs, Kg"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harga_beli" className="text-sm">
                    Harga Beli
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="harga_beli"
                      type="text"
                      inputMode="numeric"
                      value={form.harga_beli}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setForm({ ...form, harga_beli: val });
                      }}
                      placeholder="0"
                      className="h-10 pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimal_stok" className="text-sm">
                    Min. Stok
                  </Label>
                  <Input
                    id="minimal_stok"
                    type="text"
                    inputMode="numeric"
                    value={form.minimal_stok}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm({ ...form, minimal_stok: val });
                    }}
                    placeholder="0"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm">
                  Status
                </Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "aktif" | "nonaktif",
                    })
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : editingId ? "Update Barang" : "Simpan Barang"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Barang</p>
          <p className="text-xl font-bold mt-1">
            {barangList.filter((b) => b.status === "aktif").length}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Stok</p>
          <p className="text-xl font-bold mt-1">{totalStok}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Stok Menipis</p>
          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {stokMenipis}
          </p>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Detail Barang</DialogTitle>
          </DialogHeader>
          {selectedBarang && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">{selectedBarang.nama}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedBarang.kode}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Kategori", value: selectedBarang.kategori?.nama || "-" },
                  { label: "Supplier", value: selectedBarang.supplier?.nama || "-" },
                  { label: "Satuan", value: selectedBarang.satuan },
                  { label: "Harga Beli", value: formatRupiah(selectedBarang.harga_beli) },
                  { label: "Stok Saat Ini", value: String(selectedBarang.stok) },
                  { label: "Minimal Stok", value: String(selectedBarang.minimal_stok) },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-muted/30">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant={
                    selectedBarang.status === "aktif" ? "default" : "secondary"
                  }
                  className="mt-1"
                >
                  {selectedBarang.status === "aktif" ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau kode..."
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
            <div className="flex gap-2">
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "semua" | "aktif" | "nonaktif")
                }
                className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="semua">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
          {filteredBarang.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Menampilkan {filteredBarang.length} dari {barangList.length} barang
              <span className="mx-1">&middot;</span>
              Tekan{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">
                Ctrl+N
              </kbd>{" "}
              untuk tambah baru
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
          ) : filteredBarang.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Tidak ada data barang"
              description={
                search || filterKategori || filterStatus !== "semua"
                  ? "Coba kata kunci atau filter lain"
                  : "Mulai tambahkan barang baru"
              }
              actionLabel={
                search || filterKategori || filterStatus !== "semua"
                  ? undefined
                  : "Tambah Barang"
              }
              onAction={
                search || filterKategori || filterStatus !== "semua"
                  ? undefined
                  : () => setOpen(true)
              }
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>
                        <button
                          onClick={() => toggleSort("kode")}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Kode
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => toggleSort("nama")}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Nama
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-center">
                        <button
                          onClick={() => toggleSort("stok")}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Stok
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => toggleSort("harga_beli")}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Harga
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBarang.map((barang, index) => {
                      const stock = getStockStatus(barang);
                      return (
                        <TableRow key={barang.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {barang.kode}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{barang.nama}</p>
                              <p className="text-xs text-muted-foreground">
                                {barang.supplier?.nama || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{barang.kategori?.nama || "-"}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <span
                                className={
                                  barang.stok <= barang.minimal_stok
                                    ? "font-bold text-amber-600 dark:text-amber-400"
                                    : ""
                                }
                              >
                                {barang.stok}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stock.color}`}
                              >
                                {stock.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatRupiah(barang.harga_beli)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDetail(barang)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleEdit(barang)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteId(barang.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {filteredBarang.map((barang) => {
                  const stock = getStockStatus(barang);
                  return (
                    <MobileCard key={barang.id}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">
                            {barang.kode}
                          </p>
                          <p className="font-medium">{barang.nama}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stock.color}`}
                        >
                          {stock.label}
                        </span>
                      </div>
                      <MobileCardField label="Kategori">
                        {barang.kategori?.nama || "-"}
                      </MobileCardField>
                      <MobileCardField label="Stok">
                        <span
                          className={
                            barang.stok <= barang.minimal_stok
                              ? "text-amber-600 font-bold"
                              : ""
                          }
                        >
                          {barang.stok}
                        </span>
                      </MobileCardField>
                      <MobileCardField label="Harga">
                        {formatRupiah(barang.harga_beli)}
                      </MobileCardField>
                      <MobileCardActions>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDetail(barang)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(barang)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteId(barang.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </MobileCardActions>
                    </MobileCard>
                  );
                })}
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
        title="Nonaktifkan Barang?"
        description="Barang ini akan dinonaktifkan dan tidak muncul di form transaksi."
        confirmLabel="Ya, Nonaktifkan"
        onConfirm={handleDelete}
      />
    </div>
  );
}
