"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Check } from "lucide-react";
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

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  petugas_gudang: "Petugas Gudang",
};

export default function UsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "petugas_gudang" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchUsers();
    }
  }, [profile]);

  async function fetchUsers() {
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
  }

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

  async function handleDeleteUser(userId: string, nama: string) {
    if (!confirm(`Hapus akun ${nama}?`)) return;

    const res = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      toast.error("Gagal menghapus user");
      return;
    }

    toast.success(`Akun ${nama} berhasil dihapus`);
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

  if (profile?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Akses ditolak. Hanya admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-gray-500">Buat, konfirmasi, dan atur hak akses user</p>
        </div>
        <Dialog open={open} onOpenChange={(v: boolean | null) => { setOpen(!!v); if (!v) setForm({ nama: "", email: "", password: "", role: "petugas_gudang" }); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Masukkan nama" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Masukkan email" required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" required />
              </div>
              <div>
                <Label htmlFor="role">Hak Akses</Label>
                <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="petugas_gudang">Petugas Gudang</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Membuat akun..." : "Buat Akun"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Memuat data...</p>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Belum ada user</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.nama}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                        disabled={user.id === profile?.id}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="petugas_gudang">Petugas Gudang</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {user.status === "active" ? "Aktif" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.status === "pending" && (
                        <Button variant="ghost" size="icon" onClick={() => handleConfirmUser(user.id)} title="Konfirmasi & Aktifkan">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {user.id !== profile?.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.nama)} title="Hapus">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
