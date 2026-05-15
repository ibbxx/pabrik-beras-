import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
  CreditCard,
  Bell
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, adminProfile, signOut } = useAuth();

  const navItems = [
    { name: "Ringkasan", path: "/admin", icon: LayoutDashboard },
    { name: "Pesanan", path: "/admin/orders", icon: ShoppingCart },
    { name: "Pembayaran", path: "/admin/payments", icon: CreditCard },
    { name: "Produk", path: "/admin/products", icon: Package },
    { name: "Pelanggan & Mitra", path: "/admin/customers", icon: Users },
    { name: "Laporan", path: "/admin/reports", icon: FileText },
    { name: "Pengaturan", path: "/admin/settings", icon: Settings },
  ];

  const adminName = adminProfile?.full_name || user?.email?.split("@")[0] || "Admin";
  const adminRole = adminProfile?.role ? adminProfile.role.replace(/_/g, " ") : "Administrator";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafafa] text-black font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-100 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b border-gray-50 px-6">
            <Link to="/admin" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
              <div className="bg-black text-white p-1.5 rounded-lg">
                <LayoutDashboard size={20} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tighter">Admin Panel</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Desa Kurma</p>
              </div>
            </Link>
            <button
              type="button"
              aria-label="Tutup menu admin"
              className="ml-auto rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-6">
            <p className="px-3 pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                               (item.path !== "/admin" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-50 p-4">
            <div className="mb-2 p-3">
              <p className="truncate text-sm font-black text-black">{adminName}</p>
              <p className="truncate text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {adminRole}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 transition-all duration-200 hover:bg-gray-50 hover:text-black border border-transparent hover:border-gray-100"
            >
              <LogOut size={14} />
              Keluar Sesi
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-black lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
 
          <div className="hidden lg:block">
            <h2 className="text-base font-black tracking-tighter uppercase">Overview</h2>
          </div>
 
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-black"
            >
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-black ring-2 ring-white" />
            </button>

            <div className="h-6 w-px bg-gray-100" />
 
            <div className="flex items-center gap-3">
              <div className="hidden text-right lg:block">
                <p className="text-xs font-black text-black leading-none uppercase">{adminName}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{adminRole}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-[10px] font-black text-white">
                {(adminName || user?.email || "A")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
