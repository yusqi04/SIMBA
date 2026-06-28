"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Barang, Kategori, Supplier } from "@/types";
import { barangSchema } from "@/lib/validations";

export default function BarangPage() {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    kategori_id: "",
    supplier_id: "",
    satuan: "",
    harga_beli: 0,
    minimal_stok: 0,
    status: "aktif" as "aktif" | "nonaktif",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBarang();
    fetchKategori();
    fetchSupplier();
  }, []);

  async function fetchBarang() {
    const { data, error } = await supabase
      .from("barang")
      .select("*, kategori(*), supplier(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data barang");
      return;
    }
    setBarangList(data || []);
  }

  async function fetchKategori() {
    const { data } = await supabase.from("kategori").select("*").order("nama");
    setKategoriList(data || []);
  }

  async function fetchSupplier() {
    const { data } = await supabase.from("supplier").select("*").order("nama");
    setSupplierList(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = barangSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("barang")
        .update(form)
        .eq("id", editingId);

      if (error) {
        toast.error("Gagal mengupdate barang");
        setLoading(false);
        return;
      }
      toast.success("Barang berhasil diupdate");
    } else {
      const { error } = await supabase.from("barang").insert({ ...form, stok: 0 });

      if (error) {
        if (error.code === "23505") {
          toast.error("Kode barang sudah digunakan");
        } else {
          toast.error("Gagal menambahkan barang");
        }
        setLoading(false);
        return;
      }
      toast.success("Barang berhasil ditambahkan");
    }

    setOpen(false);
    resetForm();
    setLoading(false);
    fetchBarang();
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan barang ini?")) return;

    const { error } = await supabase
      .from("barang")
      .update({ status: "nonaktif" })
      .eq("id", id);

    if (error) {
      toast.error("Gagal menonaktifkan barang");
      return;
    }
    toast.success("Barang berhasil dinonaktifkan");
    fetchBarang();
  }

  function handleEdit(barang: Barang) {
    setEditingId(barang.id);
    setForm({
      kode: barang.kode,
      nama: barang.nama,
      kategori_id: barang.kategori_id,
      supplier_id: barang.supplier_id,
      satuan: barang.satuan,
      harga_beli: barang.harga_beli,
      minimal_stok: barang.minimal_stok,
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
      harga_beli: 0,
      minimal_stok: 0,
      status: "aktif",
    });
    setEditingId(null);
  }

  const filteredBarang = barangList.filter((b) =>
    b.nama.toLowerCase().includes(search.toLowerCase()) ||
    b.kode.toLowerCase().includes(search.toLowerCase())
  );

  function formatRupiah(amount: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barang</h1>
          <p className="text-gray-500">Kelola data barang</p>
        </div>
        <Dialog open={open} onOpenChange={(v: boolean | null) => { setOpen(!!v); if (!v) resetForm(); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Barang
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Barang" : "Tambah Barang"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kode">Kode Barang</Label>
                  <Input
                    id="kode"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="Masukkan kode barang"
                  />
                </div>
                <div>
                  <Label htmlFor="nama">Nama Barang</Label>
                  <Input
                    id="nama"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Masukkan nama barang"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kategori_id">Kategori</Label>
                  <select
                    id="kategori_id"
                    value={form.kategori_id}
                    onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Pilih kategori</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <select
                    id="supplier_id"
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Pilih supplier</option>
                    {supplierList.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    value={form.satuan}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                    placeholder="Pcs, Kg, Liter"
                  />
                </div>
                <div>
                  <Label htmlFor="harga_beli">Harga Beli</Label>
                  <Input
                    id="harga_beli"
                    type="number"
                    value={form.harga_beli}
                    onChange={(e) => setForm({ ...form, harga_beli: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="minimal_stok">Minimal Stok</Label>
                  <Input
                    id="minimal_stok"
                    type="number"
                    value={form.minimal_stok}
                    onChange={(e) => setForm({ ...form, minimal_stok: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "aktif" | "nonaktif" })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={detailOpen} onOpenChange={(v: boolean | null) => setDetailOpen(!!v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Barang</DialogTitle>
          </DialogHeader>
          {selectedBarang && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Kode:</span>
                <span className="font-medium">{selectedBarang.kode}</span>
                <span className="text-gray-500">Nama:</span>
                <span className="font-medium">{selectedBarang.nama}</span>
                <span className="text-gray-500">Kategori:</span>
                <span className="font-medium">{selectedBarang.kategori?.nama || "-"}</span>
                <span className="text-gray-500">Supplier:</span>
                <span className="font-medium">{selectedBarang.supplier?.nama || "-"}</span>
                <span className="text-gray-500">Satuan:</span>
                <span className="font-medium">{selectedBarang.satuan}</span>
                <span className="text-gray-500">Harga Beli:</span>
                <span className="font-medium">{formatRupiah(selectedBarang.harga_beli)}</span>
                <span className="text-gray-500">Stok:</span>
                <span className="font-medium">{selectedBarang.stok}</span>
                <span className="text-gray-500">Minimal Stok:</span>
                <span className="font-medium">{selectedBarang.minimal_stok}</span>
                <span className="text-gray-500">Status:</span>
                <Badge variant={selectedBarang.status === "aktif" ? "default" : "secondary"}>
                  {selectedBarang.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari barang berdasarkan nama atau kode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBarang.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Tidak ada data barang
                  </TableCell>
                </TableRow>
              ) : (
                filteredBarang.map((barang, index) => (
                  <TableRow key={barang.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono">{barang.kode}</TableCell>
                    <TableCell>{barang.nama}</TableCell>
                    <TableCell>{barang.kategori?.nama || "-"}</TableCell>
                    <TableCell>
                      <span className={barang.stok <= barang.minimal_stok ? "text-red-600 font-bold" : ""}>
                        {barang.stok}
                      </span>
                    </TableCell>
                    <TableCell>{formatRupiah(barang.harga_beli)}</TableCell>
                    <TableCell>
                      <Badge variant={barang.status === "aktif" ? "default" : "secondary"}>
                        {barang.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDetail(barang)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(barang)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(barang.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
