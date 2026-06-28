"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Package, Truck, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import type { Barang, Supplier, BarangMasuk, BarangKeluar } from "@/types";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "barang", label: "Barang", icon: Package },
  { value: "supplier", label: "Supplier", icon: Truck },
  { value: "masuk", label: "Masuk", icon: ArrowDownToLine },
  { value: "keluar", label: "Keluar", icon: ArrowUpFromLine },
];

export default function PencarianPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("barang");
  const [barangResults, setBarangResults] = useState<Barang[]>([]);
  const [supplierResults, setSupplierResults] = useState<Supplier[]>([]);
  const [masukResults, setMasukResults] = useState<BarangMasuk[]>([]);
  const [keluarResults, setKeluarResults] = useState<BarangKeluar[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) {
      toast.error("Masukkan kata kunci pencarian");
      return;
    }

    setLoading(true);
    const searchTerm = `%${query}%`;

    try {
      const [barangRes, supplierRes, masukRes, keluarRes] = await Promise.all([
        supabase
          .from("barang")
          .select("*, kategori(*), supplier(*)")
          .or(`nama.ilike.${searchTerm},kode.ilike.${searchTerm}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("supplier")
          .select("*")
          .or(`nama.ilike.${searchTerm},email.ilike.${searchTerm}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("barang_masuk")
          .select("*, barang(*), supplier(*)")
          .or(`nomor_transaksi.ilike.${searchTerm},barang.nama.ilike.${searchTerm}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("barang_keluar")
          .select("*, barang(*)")
          .or(`nomor_transaksi.ilike.${searchTerm},barang.nama.ilike.${searchTerm},tujuan.ilike.${searchTerm}`)
          .order("created_at", { ascending: false }),
      ]);

      setBarangResults(barangRes.data || []);
      setSupplierResults(supplierRes.data || []);
      setMasukResults(masukRes.data || []);
      setKeluarResults(keluarRes.data || []);

      const total = (barangRes.data?.length || 0) + (supplierRes.data?.length || 0) +
        (masukRes.data?.length || 0) + (keluarRes.data?.length || 0);

      if (total === 0) {
        toast.info("Tidak ditemukan hasil untuk pencarian ini");
      } else {
        toast.success(`Ditemukan ${total} hasil`);
      }
    } catch {
      toast.error("Gagal melakukan pencarian");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pencarian</h1>
        <p className="text-gray-500">Cari data barang, supplier, dan transaksi</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Masukkan kata kunci (kode, nama, nomor transaksi)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Mencari..." : "Cari"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label} ({
              tab.value === "barang" ? barangResults.length :
              tab.value === "supplier" ? supplierResults.length :
              tab.value === "masuk" ? masukResults.length :
              keluarResults.length
            })
          </button>
        ))}
      </div>

      {activeTab === "barang" && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian Barang</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {barangResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada hasil
                    </TableCell>
                  </TableRow>
                ) : (
                  barangResults.map((b, i) => (
                    <TableRow key={b.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono">{b.kode}</TableCell>
                      <TableCell>{b.nama}</TableCell>
                      <TableCell>{b.kategori?.nama || "-"}</TableCell>
                      <TableCell>{b.stok}</TableCell>
                      <TableCell>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(b.harga_beli)}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "aktif" ? "default" : "secondary"}>
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "supplier" && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian Supplier</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada hasil
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierResults.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{s.nama}</TableCell>
                      <TableCell>{s.telepon}</TableCell>
                      <TableCell>{s.email || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.alamat || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "masuk" && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian Barang Masuk</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>No Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masukResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada hasil
                    </TableCell>
                  </TableRow>
                ) : (
                  masukResults.map((t, i) => (
                    <TableRow key={t.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{t.nomor_transaksi}</TableCell>
                      <TableCell>{t.tanggal}</TableCell>
                      <TableCell>{t.barang?.nama || "-"}</TableCell>
                      <TableCell>{t.supplier?.nama || "-"}</TableCell>
                      <TableCell className="font-bold text-emerald-600">+{t.jumlah}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "keluar" && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pencarian Barang Keluar</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {keluarResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada hasil
                    </TableCell>
                  </TableRow>
                ) : (
                  keluarResults.map((t, i) => (
                    <TableRow key={t.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{t.nomor_transaksi}</TableCell>
                      <TableCell>{t.tanggal}</TableCell>
                      <TableCell>{t.barang?.nama || "-"}</TableCell>
                      <TableCell className="font-bold text-orange-600">-{t.jumlah}</TableCell>
                      <TableCell>{t.tujuan}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
