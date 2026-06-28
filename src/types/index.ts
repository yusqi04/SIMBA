export interface Kategori {
  id: string;
  nama: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  nama: string;
  telepon: string;
  email: string;
  alamat: string;
  created_at: string;
}

export interface Barang {
  id: string;
  kode: string;
  nama: string;
  kategori_id: string;
  supplier_id: string;
  satuan: string;
  harga_beli: number;
  stok: number;
  minimal_stok: number;
  status: "aktif" | "nonaktif";
  created_at: string;
  kategori?: Kategori;
  supplier?: Supplier;
}

export interface BarangMasuk {
  id: string;
  nomor_transaksi: string;
  tanggal: string;
  barang_id: string;
  supplier_id: string;
  jumlah: number;
  created_at: string;
  barang?: Barang;
  supplier?: Supplier;
}

export interface BarangKeluar {
  id: string;
  nomor_transaksi: string;
  tanggal: string;
  barang_id: string;
  jumlah: number;
  tujuan: string;
  created_at: string;
  barang?: Barang;
}

export interface User {
  id: string;
  email: string;
  nama: string;
  role: "admin" | "manager" | "petugas_gudang";
  status: "pending" | "active";
  created_at: string;
}

export interface DashboardStats {
  totalBarang: number;
  totalSupplier: number;
  totalBarangMasuk: number;
  totalBarangKeluar: number;
  barangMenipis: number;
}
