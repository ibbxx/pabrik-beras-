import { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  ChevronRight,
  Loader2,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts and totals
      const [ordersRes, productsRes, customersRes, revenueRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase
          .from('orders')
          .select('total_amount, payment_method, payments(status)')
          .eq('status', 'delivered')
      ]);

      const totalOrders = ordersRes.count || 0;
      const totalProducts = productsRes.count || 0;
      const totalCustomers = customersRes.count || 0;
      const totalRevenue = ((revenueRes.data as any[]) || []).reduce((acc, curr) => {
        const paymentStatus = curr.payment_method === "COD" ? "verified" : curr.payments?.[0]?.status;
        return paymentStatus === "verified" ? acc + (curr.total_amount || 0) : acc;
      }, 0);

      setStats([
        { 
          title: "Total Revenue", 
          value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, 
          change: "+0%", 
          trend: "up", 
          icon: DollarSign,
          description: "confirmed sales"
        },
        { 
          title: "Total Orders", 
          value: totalOrders.toString(), 
          change: "+0%", 
          trend: "up", 
          icon: ShoppingCart,
          description: "lifetime orders"
        },
        { 
          title: "Total Products", 
          value: totalProducts.toString(), 
          change: "+0%", 
          trend: "up", 
          icon: PackageIcon,
          description: "active in catalog"
        },
        { 
          title: "Total Customers", 
          value: totalCustomers.toString(), 
          change: "+0%", 
          trend: "up", 
          icon: Users,
          description: "registered users"
        },
      ]);

      // Fetch recent orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          total_amount,
          status,
          customers (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(ordersData || []);

    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-black text-white';
      case 'processing': return 'bg-gray-100 text-black';
      case 'pending': return 'border border-gray-100 text-gray-400';
      default: return 'bg-gray-50 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black/20" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tighter text-black uppercase">Dashboard</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/reports">
            <Button variant="outline" className="rounded-lg h-10 px-6 border-gray-100 text-xs font-bold hover:bg-gray-50 transition-all">
              Laporan
            </Button>
          </Link>
          <Link to="/admin/products">
            <Button className="rounded-lg h-10 px-6 bg-black text-white text-xs font-bold hover:bg-black/90 transition-all">
              Tambah Produk
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-gray-100 shadow-none bg-white rounded-xl lg:rounded-2xl">
            <CardContent className="p-5 lg:p-6">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-gray-50 rounded-lg text-black">
                  <stat.icon size={16} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-tighter text-black">
                  {stat.change}
                </div>
              </div>
              <div className="mt-4 space-y-0.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-xl lg:text-2xl font-black tracking-tighter">{stat.value}</p>
                <p className="text-[9px] text-gray-300 uppercase tracking-widest font-bold pt-1">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-2 border border-gray-100 shadow-none bg-white rounded-xl lg:rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-4 px-6 lg:px-8">
            <div>
              <CardTitle className="text-sm lg:text-base font-black uppercase tracking-tighter">Recent Orders</CardTitle>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Customer Activity</p>
            </div>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent">
                Semua <ChevronRight size={12} className="ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/30">
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-4 text-[11px] font-black tracking-tighter font-mono">{order.order_code}</td>
                      <td className="px-8 py-4">
                        <p className="text-[11px] font-black text-black uppercase tracking-tight">{order.customers?.full_name || "Unknown"}</p>
                      </td>
                      <td className="px-8 py-4 text-[11px] font-black text-black">
                        Rp {(order.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="border border-gray-100 shadow-none bg-white rounded-xl lg:rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-50 px-6">
              <CardTitle className="text-sm font-black uppercase tracking-tighter">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link to="/admin/settings?tab=appearance">
                <Button className="w-full justify-start bg-gray-50 hover:bg-black hover:text-white text-black border-none h-10 rounded-lg gap-3 text-xs font-bold transition-all">
                  <LayoutIcon size={14} /> Atur Hero Section
                </Button>
              </Link>
              <Link to="/admin/orders">
                <Button className="w-full justify-start bg-gray-50 hover:bg-black hover:text-white text-black border-none h-10 rounded-lg gap-3 text-xs font-bold transition-all">
                  <ShoppingCart size={14} /> Kelola Pesanan
                </Button>
              </Link>
              <Link to="/admin/settings?tab=seo">
                <Button className="w-full justify-start bg-gray-50 hover:bg-black hover:text-white text-black border-none h-10 rounded-lg gap-3 text-xs font-bold transition-all">
                  <Globe size={14} /> Update SEO
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LayoutIcon({ size }: { size: number }) {
  return <LayoutDashboard size={size} />;
}

function PackageIcon({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function Globe({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20" />
      <path d="M2 12h20" />
    </svg>
  );
}
