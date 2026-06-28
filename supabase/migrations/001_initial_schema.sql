-- ============================================
-- SIMBA - Sistem Manajemen Barang
-- Database Schema for Supabase
-- ============================================

-- ============================================
-- 1. TABEL KATEGORI
-- ============================================
CREATE TABLE IF NOT EXISTS kategori (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABEL SUPPLIER
-- ============================================
CREATE TABLE IF NOT EXISTS supplier (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  telepon VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  alamat TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. TABEL BARANG
-- ============================================
CREATE TABLE IF NOT EXISTS barang (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(200) NOT NULL,
  kategori_id UUID NOT NULL REFERENCES kategori(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
  satuan VARCHAR(20) NOT NULL,
  harga_beli NUMERIC(15, 2) NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  minimal_stok INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TABEL BARANG MASUK
-- ============================================
CREATE TABLE IF NOT EXISTS barang_masuk (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_transaksi VARCHAR(50) NOT NULL UNIQUE,
  tanggal DATE NOT NULL,
  barang_id UUID NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TABEL BARANG KELUAR
-- ============================================
CREATE TABLE IF NOT EXISTS barang_keluar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_transaksi VARCHAR(50) NOT NULL UNIQUE,
  tanggal DATE NOT NULL,
  barang_id UUID NOT NULL REFERENCES barang(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tujuan VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_barang_kode ON barang(kode);
CREATE INDEX IF NOT EXISTS idx_barang_nama ON barang(nama);
CREATE INDEX IF NOT EXISTS idx_barang_kategori ON barang(kategori_id);
CREATE INDEX IF NOT EXISTS idx_barang_supplier ON barang(supplier_id);
CREATE INDEX IF NOT EXISTS idx_barang_status ON barang(status);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_tanggal ON barang_masuk(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_masuk_barang ON barang_masuk(barang_id);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_tanggal ON barang_keluar(tanggal);
CREATE INDEX IF NOT EXISTS idx_barang_keluar_barang ON barang_keluar(barang_id);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE barang_keluar ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated users
-- You can customize these based on your role requirements

CREATE POLICY "Allow all operations for authenticated users" ON kategori
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON supplier
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON barang
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON barang_masuk
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON barang_keluar
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 8. NOTE: Stock updates handled by application
-- ============================================
-- Stok barang diupdate oleh aplikasi (client-side)
-- saat transaksi barang masuk/keluar ditambahkan.
-- Trigger tidak digunakan untuk menghindari double update.
