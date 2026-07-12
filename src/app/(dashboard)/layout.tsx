"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Shield,
  Users,
  Keyboard,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { ShortcutsDialog } from "@/components/ui/shortcuts-dialog";

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

function NavLinks({ navigation, pathname, onNavigate }: { navigation: typeof allNavigation; pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </>
  );
}

function UserProfile({ profile }: { profile: { nama: string; role: string } | null }) {
  if (!profile) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {profile.nama.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{profile.nama}</p>
        <Badge variant="outline" className="mt-0.5 text-[10px]">
          <Shield className="h-2.5 w-2.5 mr-1" />
          {roleLabels[profile.role] || profile.role}
        </Badge>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
      setShortcutsOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
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
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 px-4 h-14 border-b">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">S</div>
                  <h1 className="text-lg font-bold">SIMBA</h1>
                </div>
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  <NavLinks navigation={navigation} pathname={pathname} onNavigate={() => setOpen(false)} />
                </nav>
                <div className="p-3 border-t space-y-2">
                  <UserProfile profile={profile} />
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-bold">SIMBA</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto px-4 pb-4">
          <div className="flex h-16 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">S</div>
            <h1 className="text-xl font-bold">SIMBA</h1>
          </div>
          <nav className="flex flex-col flex-1 gap-0.5">
            <NavLinks navigation={navigation} pathname={pathname} />
          </nav>
          <div className="border-t pt-4 space-y-3">
            <UserProfile profile={profile} />
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => setShortcutsOpen(true)}>
              <Keyboard className="h-4 w-4 mr-3" />
              Shortcuts
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="lg:hidden h-14" />
        <main className="p-3 sm:p-4 lg:p-6">{children}</main>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
