"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Kategori } from "@/types";
import { kategoriSchema } from "@/lib/validations";

export default function KategoriPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKategori();
  }, []);

  async function fetchKategori() {
    const { data, error } = await supabase
      .from("kategori")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data kategori");
      return;
    }
    setKategoriList(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = kategoriSchema.safeParse({ nama });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("kategori")
        .update({ nama })
        .eq("id", editingId);

      if (error) {
        toast.error("Gagal mengupdate kategori");
        setLoading(false);
        return;
      }
      toast.success("Kategori berhasil diupdate");
    } else {
      const { error } = await supabase.from("kategori").insert({ nama });

      if (error) {
        toast.error("Gagal menambahkan kategori");
        setLoading(false);
        return;
      }
      toast.success("Kategori berhasil ditambahkan");
    }

    setOpen(false);
    setNama("");
    setEditingId(null);
    setLoading(false);
    fetchKategori();
  }

  async function handleDelete(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    const { error } = await supabase.from("kategori").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus kategori. Mungkin masih digunakan oleh barang.");
      return;
    }
    toast.success("Kategori berhasil dihapus");
    fetchKategori();
  }

  function handleEdit(kategori: Kategori) {
    setEditingId(kategori.id);
    setNama(kategori.nama);
    setOpen(true);
  }

  const filteredKategori = kategoriList.filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategori</h1>
          <p className="text-gray-500">Kelola data kategori barang</p>
        </div>
        <Dialog open={open} onOpenChange={(v: boolean | null) => { setOpen(!!v); if (!v) { setEditingId(null); setNama(""); } }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kategori
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Kategori</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama kategori"
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
              placeholder="Cari kategori..."
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
                <TableHead>Nama Kategori</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKategori.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    Tidak ada data kategori
                  </TableCell>
                </TableRow>
              ) : (
                filteredKategori.map((kategori, index) => (
                  <TableRow key={kategori.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{kategori.nama}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(kategori)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(kategori.id)}>
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
