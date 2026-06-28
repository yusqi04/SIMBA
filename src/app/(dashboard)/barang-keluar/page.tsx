"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Eye } from "lucide-react";
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
  const [selectedTransaksi, setSelectedTransaksi] = useState<BarangKeluar | null>(null);
  const [form, setForm] = useState({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    barang_id: "",
    jumlah: 1,
    tujuan: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransaksi();
    fetchBarang();
  }, []);

  async function fetchTransaksi() {
    const { data, error } = await supabase
      .from("barang_keluar")
      .select("*, barang(*)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data transaksi");
      return;
    }
    setTransaksiList(data || []);
  }

  async function fetchBarang() {
    const { data } = await supabase.from("barang").select("*").eq("status", "aktif").order("nama");
    setBarangList(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!form.barang_id) {
      toast.error("Barang harus dipilih");
      setLoading(false);
      return;
    }

    if (form.jumlah < 1) {
      toast.error("Jumlah minimal 1");
      setLoading(false);
      return;
    }

    const barang = barangList.find((b) => b.id === form.barang_id);
    if (!barang) {
      toast.error("Barang tidak ditemukan");
      setLoading(false);
      return;
    }

    if (barang.stok < form.jumlah) {
      toast.error(`Stok tidak mencukupi. Stok tersedia: ${barang.stok}`);
      setLoading(false);
      return;
    }

    const nomor_transaksi = `BK-${Date.now()}`;

    const { error: insertError } = await supabase.from("barang_keluar").insert({
      nomor_transaksi,
      tanggal: form.tanggal,
      barang_id: form.barang_id,
      jumlah: form.jumlah,
      tujuan: form.tujuan,
    });

    if (insertError) {
      toast.error("Gagal menyimpan transaksi");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("barang")
      .update({ stok: barang.stok - form.jumlah })
      .eq("id", form.barang_id);

    if (updateError) {
      toast.error("Gagal update stok barang");
      setLoading(false);
      return;
    }

    toast.success("Barang keluar berhasil ditambahkan");
    setOpen(false);
    setForm({ tanggal: format(new Date(), "yyyy-MM-dd"), barang_id: "", jumlah: 1, tujuan: "" });
    setLoading(false);
    fetchTransaksi();
    fetchBarang();
  }

  function handleDetail(transaksi: BarangKeluar) {
    setSelectedTransaksi(transaksi);
    setDetailOpen(true);
  }

  const filteredTransaksi = transaksiList.filter((t) =>
    t.nomor_transaksi.toLowerCase().includes(search.toLowerCase()) ||
    t.barang?.nama.toLowerCase().includes(search.toLowerCase()) ||
    t.tujuan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barang Keluar</h1>
          <p className="text-gray-500">Riwayat barang keluar</p>
        </div>
        <Dialog open={open} onOpenChange={(v: boolean | null) => { setOpen(!!v); if (!v) setForm({ tanggal: format(new Date(), "yyyy-MM-dd"), barang_id: "", jumlah: 1, tujuan: "" }); }}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Barang Keluar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Barang Keluar</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={form.tanggal}
                  onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="barang_id">Barang</Label>
                <select
                  id="barang_id"
                  value={form.barang_id}
                  onChange={(e) => setForm({ ...form, barang_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Pilih barang</option>
                  {barangList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.kode} - {b.nama} (Stok: {b.stok})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="jumlah">Jumlah</Label>
                <Input
                  id="jumlah"
                  type="number"
                  min="1"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="tujuan">Tujuan / Penerima</Label>
                <Input
                  id="tujuan"
                  value={form.tujuan}
                  onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
                  placeholder="Masukkan tujuan atau nama penerima"
                />
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
            <DialogTitle>Detail Barang Keluar</DialogTitle>
          </DialogHeader>
          {selectedTransaksi && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">No Transaksi:</span>
                <span className="font-medium font-mono">{selectedTransaksi.nomor_transaksi}</span>
                <span className="text-gray-500">Tanggal:</span>
                <span className="font-medium">{selectedTransaksi.tanggal}</span>
                <span className="text-gray-500">Barang:</span>
                <span className="font-medium">{selectedTransaksi.barang?.nama || "-"}</span>
                <span className="text-gray-500">Jumlah:</span>
                <span className="font-medium">{selectedTransaksi.jumlah}</span>
                <span className="text-gray-500">Tujuan:</span>
                <span className="font-medium">{selectedTransaksi.tujuan}</span>
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
              placeholder="Cari transaksi..."
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
                <TableHead>No Transaksi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransaksi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada data barang keluar
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransaksi.map((transaksi, index) => (
                  <TableRow key={transaksi.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{transaksi.nomor_transaksi}</TableCell>
                    <TableCell>{transaksi.tanggal}</TableCell>
                    <TableCell>{transaksi.barang?.nama || "-"}</TableCell>
                    <TableCell className="font-bold text-orange-600">-{transaksi.jumlah}</TableCell>
                    <TableCell>{transaksi.tujuan}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDetail(transaksi)}>
                        <Eye className="h-4 w-4" />
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
