"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Supplier } from "@/types";
import { supplierSchema } from "@/lib/validations";

export default function SupplierPage() {
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: "", telepon: "", email: "", alamat: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, []);

  async function fetchSupplier() {
    const { data, error } = await supabase
      .from("supplier")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data supplier");
      return;
    }
    setSupplierList(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = supplierSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("supplier")
        .update(form)
        .eq("id", editingId);

      if (error) {
        toast.error("Gagal mengupdate supplier");
        setLoading(false);
        return;
      }
      toast.success("Supplier berhasil diupdate");
    } else {
      const { error } = await supabase.from("supplier").insert(form);

      if (error) {
        toast.error("Gagal menambahkan supplier");
        setLoading(false);
        return;
      }
      toast.success("Supplier berhasil ditambahkan");
    }

    setOpen(false);
    setForm({ nama: "", telepon: "", email: "", alamat: "" });
    setEditingId(null);
    setLoading(false);
    fetchSupplier();
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus supplier ini?")) return;

    const { error } = await supabase.from("supplier").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus supplier. Mungkin masih digunakan oleh barang.");
      return;
    }
    toast.success("Supplier berhasil dihapus");
    fetchSupplier();
  }

  function handleEdit(supplier: Supplier) {
    setEditingId(supplier.id);
    setForm({
      nama: supplier.nama,
      telepon: supplier.telepon,
      email: supplier.email || "",
      alamat: supplier.alamat || "",
    });
    setOpen(true);
  }

  const filteredSupplier = supplierList.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier</h1>
          <p className="text-gray-500">Kelola data supplier</p>
        </div>
        <Dialog open={open} onOpenChange={(v: boolean | null) => { setOpen(!!v); if (!v) { setEditingId(null); setForm({ nama: "", telepon: "", email: "", alamat: "" }); } }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Supplier
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Supplier" : "Tambah Supplier"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Supplier</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Masukkan nama supplier"
                />
              </div>
              <div>
                <Label htmlFor="telepon">Nomor Telepon</Label>
                <Input
                  id="telepon"
                  value={form.telepon}
                  onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Masukkan email (opsional)"
                />
              </div>
              <div>
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea
                  id="alamat"
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Masukkan alamat (opsional)"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari supplier..."
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
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSupplier.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data supplier
                  </TableCell>
                </TableRow>
              ) : (
                filteredSupplier.map((supplier, index) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{supplier.nama}</TableCell>
                    <TableCell>{supplier.telepon}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{supplier.alamat || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
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
