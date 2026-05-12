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
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Payments", path: "/admin/payments", icon: CreditCard },
    { name: "Inventory", path: "/admin/products", icon: Package },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "Reports", path: "/admin/reports", icon: FileText },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex text-black">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link to="/admin" className="font-bold text-lg tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-xs">P</div>
            ADMIN PANEL
          </Link>
          <button 
            className="ml-auto lg:hidden text-gray-400 hover:text-black transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] justify-between py-6">
          <nav className="px-4 space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/admin' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-black text-white shadow-lg shadow-black/10" 
                      : "text-gray-500 hover:bg-gray-100 hover:text-black"
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 border-t border-gray-100 pt-6">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
            >
              <LogOut size={18} />
              Logout Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <button
            className="lg:hidden text-gray-400 hover:text-black focus:outline-none"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-auto flex items-center gap-6">
            <button className="text-gray-400 hover:text-black transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-gray-100 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-right hidden sm:block">
                <p className="font-bold text-gray-900 leading-tight">{user?.email?.split('@')[0] || "Admin"}</p>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider">Super Administrator</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {(user?.email || "A")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
