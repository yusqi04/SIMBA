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
import { Plus, Pencil, Trash2, Search, Tags, X, Folder } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Kategori } from "@/types";
import { kategoriSchema } from "@/lib/validations";

export default function KategoriPage() {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchKategori = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("kategori")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat data kategori");
    }
    setKategoriList(data || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

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

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase
      .from("kategori")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error(
        "Gagal menghapus kategori. Mungkin masih digunakan oleh barang."
      );
      return;
    }
    toast.success("Kategori berhasil dihapus");
    setDeleteId(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50">
              <Tags className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kategori</h1>
              <p className="text-sm text-muted-foreground">
                Kelola data kategori barang
              </p>
            </div>
          </div>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(!!v);
            if (!v) {
              setEditingId(null);
              setNama("");
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90" />
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kategori
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingId ? "Edit Kategori" : "Tambah Kategori Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm">
                  Nama Kategori
                </Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama kategori"
                  autoFocus
                  className="h-10 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium"
                disabled={loading}
              >
                {loading
                  ? "Menyimpan..."
                  : editingId
                    ? "Update Kategori"
                    : "Simpan Kategori"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
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
          {filteredKategori.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Menampilkan {filteredKategori.length} dari {kategoriList.length}{" "}
              kategori
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
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredKategori.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="Tidak ada data kategori"
              description={
                search
                  ? "Coba kata kunci lain"
                  : "Mulai tambahkan kategori baru"
              }
              actionLabel={search ? undefined : "Tambah Kategori"}
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
                      <TableHead>Nama Kategori</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKategori.map((kategori, index) => (
                      <TableRow key={kategori.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                              <Folder className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <span className="font-medium">{kategori.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(kategori)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteId(kategori.id)}
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
                {filteredKategori.map((kategori, index) => (
                  <MobileCard key={kategori.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 shrink-0">
                        <Folder className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{kategori.nama}</p>
                        <p className="text-xs text-muted-foreground">
                          No. {index + 1}
                        </p>
                      </div>
                    </div>
                    <MobileCardActions>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(kategori)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(kategori.id)}
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
        title="Hapus Kategori?"
        description="Kategori akan dihapus secara permanen. Jika masih digunakan oleh barang, penghapusan akan gagal."
        onConfirm={handleDelete}
      />
    </div>
  );
}
