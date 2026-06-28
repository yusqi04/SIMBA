import { z } from "zod";

export const kategoriSchema = z.object({
  nama: z.string().min(1, "Nama kategori tidak boleh kosong"),
});

export const supplierSchema = z.object({
  nama: z.string().min(1, "Nama supplier tidak boleh kosong"),
  telepon: z.string().min(1, "Nomor telepon tidak boleh kosong"),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  alamat: z.string().optional(),
});

export const barangSchema = z.object({
  kode: z.string().min(1, "Kode barang tidak boleh kosong"),
  nama: z.string().min(1, "Nama barang tidak boleh kosong"),
  kategori_id: z.string().min(1, "Kategori harus dipilih"),
  supplier_id: z.string().min(1, "Supplier harus dipilih"),
  satuan: z.string().min(1, "Satuan tidak boleh kosong"),
  harga_beli: z.number().min(0, "Harga beli tidak boleh negatif"),
  minimal_stok: z.number().min(0, "Minimal stok tidak boleh negatif"),
  status: z.enum(["aktif", "nonaktif"]),
});

export const barangMasukSchema = z.object({
  tanggal: z.string().min(1, "Tanggal tidak boleh kosong"),
  barang_id: z.string().min(1, "Barang harus dipilih"),
  supplier_id: z.string().min(1, "Supplier harus dipilih"),
  jumlah: z.number().min(1, "Jumlah minimal 1"),
});

export const barangKeluarSchema = z.object({
  tanggal: z.string().min(1, "Tanggal tidak boleh kosong"),
  barang_id: z.string().min(1, "Barang harus dipilih"),
  jumlah: z.number().min(1, "Jumlah minimal 1"),
  tujuan: z.string().min(1, "Tujuan tidak boleh kosong"),
});

export type KategoriInput = z.infer<typeof kategoriSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type BarangInput = z.infer<typeof barangSchema>;
export type BarangMasukInput = z.infer<typeof barangMasukSchema>;
export type BarangKeluarInput = z.infer<typeof barangKeluarSchema>;
