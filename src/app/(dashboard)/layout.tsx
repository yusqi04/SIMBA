"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "petugas_gudang"] },
  { name: "Barang", href: "/barang", icon: Package, roles: ["admin", "petugas_gudang"] },
  { name: "Kategori", href: "/kategori", icon: Tags, roles: ["admin", "petugas_gudang"] },
  { name: "Supplier", href: "/supplier", icon: Truck, roles: ["admin", "petugas_gudang"] },
  { name: "Barang Masuk", href: "/barang-masuk", icon: ArrowDownToLine, roles: ["admin", "petugas_gudang"] },
  { name: "Barang Keluar", href: "/barang-keluar", icon: ArrowUpFromLine, roles: ["admin", "petugas_gudang"] },
  { name: "Pencarian", href: "/pencarian", icon: Search, roles: ["admin", "manager", "petugas_gudang"] },
  { name: "Laporan", href: "/laporan", icon: FileText, roles: ["admin", "manager"] },
  { name: "Kelola User", href: "/users", icon: Users, roles: ["admin"] },
];

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  petugas_gudang: "Petugas Gudang",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  if (!user) return null;

  const navigation = profile
    ? allNavigation.filter((item) => item.roles.includes(profile.role))
    : allNavigation;

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary">SIMBA</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h1 className="text-xl font-bold text-primary">SIMBA</h1>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t space-y-2">
                  {profile && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{profile.nama}</p>
                      <Badge variant="outline" className="mt-1">
                        <Shield className="h-3 w-3 mr-1" />
                        {roleLabels[profile.role]}
                      </Badge>
                    </div>
                  )}
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 pb-4">
          <div className="flex h-16 items-center">
            <h1 className="text-2xl font-bold text-primary">SIMBA</h1>
          </div>
          <nav className="flex flex-col flex-1 gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t pt-4 space-y-3">
            {profile && (
              <div className="text-sm text-gray-600">
                <p className="font-medium">{profile.nama}</p>
                <Badge variant="outline" className="mt-1">
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabels[profile.role]}
                </Badge>
              </div>
            )}
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="lg:hidden h-16" />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
