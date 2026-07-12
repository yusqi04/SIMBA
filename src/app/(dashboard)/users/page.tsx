"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Shield,
  Plus,
  Trash2,
  Check,
  Users,
  User,
  Mail,
  Lock,
  Crown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: "admin" | "manager" | "petugas_gudang";
  status: "pending" | "active";
  created_at: string;
}

const roleConfig = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/50",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  },
  petugas_gudang: {
    label: "Petugas Gudang",
    icon: User,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
  },
};

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    role: "petugas_gudang",
  });
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editNama, setEditNama] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("Profiles error:", error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") fetchUsers();
  }, [profile, fetchUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    if (form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      setCreating(false);
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || "Gagal membuat akun");
      setCreating(false);
      return;
    }

    toast.success(`Akun ${form.nama} berhasil dibuat`);
    setOpen(false);
    setForm({ nama: "", email: "", password: "", role: "petugas_gudang" });
    setCreating(false);
    fetchUsers();
  }

  async function handleConfirmUser(userId: string) {
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "confirm" }),
    });
    if (!res.ok) {
      toast.error("Gagal konfirmasi user");
      return;
    }
    toast.success("User berhasil dikonfirmasi dan diaktifkan");
    fetchUsers();
  }

  async function handleDeleteUser() {
    if (!deleteId) return;
    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteId }),
    });
    if (!res.ok) {
      toast.error("Gagal menghapus user");
      return;
    }
    toast.success(`Akun ${deleteName} berhasil dihapus`);
    setDeleteId(null);
    fetchUsers();
  }

  async function handleChangeRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      toast.error("Gagal mengubah role");
      return;
    }
    toast.success("Role berhasil diubah");
    fetchUsers();
  }

  function handleEditUser(user: UserProfile) {
    setEditingUser(user);
    setEditNama(user.nama);
    setEditOpen(true);
  }

  async function handleSaveName() {
    if (!editingUser) return;
    if (!editNama.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ nama: editNama.trim() })
      .eq("id", editingUser.id);
    if (error) {
      toast.error("Gagal mengubah nama");
      return;
    }
    toast.success("Nama berhasil diubah");
    setEditOpen(false);
    setEditingUser(null);
    fetchUsers();
  }

  if (profile?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">Akses Ditolak</p>
        <p className="text-sm text-muted-foreground mt-1">
          Hanya admin yang dapat mengakses halaman ini
        </p>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const pendingUsers = users.filter((u) => u.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50">
              <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kelola User</h1>
              <p className="text-sm text-muted-foreground">
                Buat, konfirmasi, dan atur hak akses user
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
                nama: "",
                email: "",
                password: "",
                role: "petugas_gudang",
              });
          }}
        >
          <DialogTrigger
            render={
              <Button className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90" />
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">Tambah User Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nama"
                    value={form.nama}
                    onChange={(e) =>
                      setForm({ ...form, nama: e.target.value })
                    }
                    placeholder="Masukkan nama lengkap"
                    required
                    autoFocus
                    className="h-10 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="nama@email.com"
                    required
                    className="h-10 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    required
                    className="h-10 pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm">
                  Hak Akses
                </Label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="petugas_gudang">Petugas Gudang</option>
                </select>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-medium"
                disabled={creating}
              >
                {creating ? "Membuat akun..." : "Buat Akun"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total User</p>
          <p className="text-xl font-bold mt-1">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Aktif</p>
          <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {activeUsers}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
            {pendingUsers}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Daftar User</span>
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada user"
              description="Mulai tambahkan user baru"
              actionLabel="Tambah User"
              onAction={() => setOpen(true)}
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => {
                      const role = roleConfig[user.role];
                      const RoleIcon = role.icon;
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex items-center justify-center w-9 h-9 rounded-lg ${role.bg}`}
                              >
                                <RoleIcon
                                  className={`h-4 w-4 ${role.color}`}
                                />
                              </div>
                              <div>
                                <p className="font-medium">{user.nama}</p>
                                <p className="text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleChangeRole(user.id, e.target.value)
                              }
                              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              disabled={user.id === profile?.id}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="petugas_gudang">
                                Petugas Gudang
                              </option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.status === "active" ? "Aktif" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleEditUser(user)}
                                title="Edit Nama"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {user.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => handleConfirmUser(user.id)}
                                  title="Konfirmasi & Aktifkan"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {user.id !== profile?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    setDeleteId(user.id);
                                    setDeleteName(user.nama);
                                  }}
                                  title="Hapus"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
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
                {users.map((user) => {
                  const role = roleConfig[user.role];
                  const RoleIcon = role.icon;
                  return (
                    <MobileCard key={user.id}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-xl ${role.bg} shrink-0`}
                        >
                          <RoleIcon className={`h-5 w-5 ${role.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.nama}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Badge
                          variant={
                            user.status === "active" ? "default" : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {user.status === "active" ? "Aktif" : "Pending"}
                        </Badge>
                      </div>
                      <MobileCardField label="Role">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleChangeRole(user.id, e.target.value)
                          }
                          className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={user.id === profile?.id}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="petugas_gudang">
                            Petugas Gudang
                          </option>
                        </select>
                      </MobileCardField>
                      <MobileCardActions>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleConfirmUser(user.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {user.id !== profile?.id && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setDeleteId(user.id);
                              setDeleteName(user.nama);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </MobileCardActions>
                    </MobileCard>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Nama User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm">Nama Lengkap</Label>
              <Input
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                placeholder="Masukkan nama baru"
                autoFocus
                className="h-10 rounded-xl"
              />
            </div>
            <Button
              onClick={handleSaveName}
              className="w-full h-11 rounded-xl font-medium"
            >
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        title={`Hapus Akun ${deleteName}?`}
        description="Akun ini akan dihapus secara permanen dari sistem."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
