"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Pencil,
  Trash2,
  Search,
  Truck,
  X,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Supplier } from "@/types";
import { supplierSchema } from "@/lib/validations";

export default function SupplierPage() {
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    telepon: "",
    email: "",
    alamat: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchSupplier = useCallback(async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from("supplier")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat data supplier");
    }
    setSupplierList(data || []);
    setFetching(false);
  }, []);

  useEffect(() => {
    fetchSupplier();
  }, [fetchSupplier]);

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

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase
      .from("supplier")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error(
        "Gagal menghapus supplier. Mungkin masih digunakan oleh barang."
      );
      return;
    }
    toast.success("Supplier berhasil dihapus");
    setDeleteId(null);
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

  const filteredSupplier = supplierList.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.telepon?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Supplier</h1>
              <p className="text-sm text-muted-foreground">
                Kelola data supplier
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
              setForm({ nama: "", telepon: "", email: "", alamat: "" });
            }
          }}
        >
          <DialogTrigger
            render={
              <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90" />
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Supplier
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingId ? "Edit Supplier" : "Tambah Supplier Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm">
                  Nama Supplier
                </Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Masukkan nama supplier"
                  autoFocus
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telepon" className="text-sm">
                  Nomor Telepon
                </Label>
                <Input
                  id="telepon"
                  value={form.telepon}
                  onChange={(e) =>
                    setForm({ ...form, telepon: e.target.value })
                  }
                  placeholder="08xxxxxxxxxx"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email{" "}
                  <span className="text-muted-foreground font-normal">
                    (opsional)
                  </span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="supplier@email.com"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat" className="text-sm">
                  Alamat{" "}
                  <span className="text-muted-foreground font-normal">
                    (opsional)
                  </span>
                </Label>
                <Textarea
                  id="alamat"
                  value={form.alamat}
                  onChange={(e) =>
                    setForm({ ...form, alamat: e.target.value })
                  }
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  className="rounded-xl resize-none"
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
                    ? "Update Supplier"
                    : "Simpan Supplier"}
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
              placeholder="Cari berdasarkan nama, email, atau telepon..."
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
          {filteredSupplier.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Menampilkan {filteredSupplier.length} dari {supplierList.length}{" "}
              supplier
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
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredSupplier.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Tidak ada data supplier"
              description={
                search
                  ? "Coba kata kunci lain"
                  : "Mulai tambahkan supplier baru"
              }
              actionLabel={search ? undefined : "Tambah Supplier"}
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
                      <TableHead>Nama</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSupplier.map((supplier, index) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                              <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="font-medium">{supplier.nama}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {supplier.telepon}
                          </div>
                        </TableCell>
                        <TableCell>
                          {supplier.email ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {supplier.email}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {supplier.alamat ? (
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate">{supplier.alamat}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteId(supplier.id)}
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
                {filteredSupplier.map((supplier) => (
                  <MobileCard key={supplier.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                        <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{supplier.nama}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {supplier.email || supplier.telepon}
                        </p>
                      </div>
                    </div>
                    <MobileCardField label="Telepon">
                      {supplier.telepon}
                    </MobileCardField>
                    {supplier.email && (
                      <MobileCardField label="Email">
                        {supplier.email}
                      </MobileCardField>
                    )}
                    {supplier.alamat && (
                      <MobileCardField label="Alamat">
                        <span className="truncate text-right max-w-[180px] inline-block">
                          {supplier.alamat}
                        </span>
                      </MobileCardField>
                    )}
                    <MobileCardActions>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(supplier.id)}
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
        title="Hapus Supplier?"
        description="Supplier akan dihapus secara permanen. Jika masih digunakan oleh barang, penghapusan akan gagal."
        onConfirm={handleDelete}
      />
    </div>
  );
}
