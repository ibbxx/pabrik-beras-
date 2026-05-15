import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";

type OrderRow = {
  id: string;
  order_code: string;
  total_amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  payments?: { status: string | null }[];
};

type OrderItemRow = {
  quantity: number;
  price_at_time: number;
  products: { name: string; weight_kg: number | null } | null;
  orders: {
    status: string | null;
    payment_method: string | null;
    created_at: string | null;
    payments?: { status: string | null }[];
  } | null;
};

function isRevenueOrder(order: {
  status: string | null;
  payment_method: string | null;
  payments?: { status: string | null }[];
}) {
  if (order.status !== "delivered") return false;
  if (order.payment_method === "COD") return true;
  return order.payments?.[0]?.status === "verified";
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch completed orders for revenue reporting. Non-COD orders must have verified payment.
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("id, order_code, total_amount, status, payment_method, created_at, payments(status)")
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (ordersErr) throw ordersErr;
      setOrders(ordersData || []);

      // Fetch order items with order context so product ranking follows the same revenue rules.
      const { data: itemsData, error: itemsErr } = await supabase
        .from("order_items")
        .select("quantity, price_at_time, products(name, weight_kg), orders(status, payment_method, created_at, payments(status))");

      if (itemsErr) throw itemsErr;
      setOrderItems((itemsData as any) || []);
    } catch (err: any) {
      toast.error("Gagal memuat laporan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = new Date(o.created_at);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return isRevenueOrder(o);
    });
  }, [orders, dateFrom, dateTo]);

  // Summary stats
  const totalOmzet = filteredOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalTransaksi = filteredOrders.length;

  // Top products
  const productSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; kg: number }> = {};
    orderItems.forEach((item) => {
      const order = item.orders as any;
      if (!order || !isRevenueOrder(order)) return;

      const createdAt = order.created_at ? new Date(order.created_at) : null;
      if (!createdAt) return;
      if (dateFrom && createdAt < new Date(dateFrom)) return;
      if (dateTo && createdAt > new Date(dateTo + "T23:59:59")) return;

      const name = (item.products as any)?.name || "Unknown";
      const wkg = (item.products as any)?.weight_kg || 1;
      if (!map[name]) map[name] = { name, qty: 0, revenue: 0, kg: 0 };
      map[name].qty += item.quantity;
      map[name].revenue += item.quantity * item.price_at_time;
      map[name].kg += item.quantity * wkg;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orderItems, dateFrom, dateTo]);

  const totalKg = productSales.reduce((s, p) => s + p.kg, 0);

  // CSV export
  const exportCSV = () => {
    const headers = ["Kode Pesanan", "Total (Rp)", "Status", "Tanggal"];
    const rows = filteredOrders.map((o) => [
      o.order_code,
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleDateString("id-ID"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil diunduh!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black tracking-tighter text-black uppercase">Laporan</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Analisis Performa & Penjualan</p>
        </div>
        <Button 
          variant="outline" 
          onClick={exportCSV} 
          className="h-10 px-6 border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent transition-all active:scale-95"
        >
          Export CSV
        </Button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-6 items-end bg-white border border-gray-100 rounded-xl p-6 shadow-none">
        <div className="space-y-1.5">
          <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dari Tanggal</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black w-40" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sampai Tanggal</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black w-40" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setDateFrom(""); setDateTo(""); }}
          className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black hover:bg-transparent"
        >
          Reset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-none">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Omzet</p>
          <p className="text-xl font-black text-black tracking-tight">Rp {totalOmzet.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-none">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Transaksi</p>
          <p className="text-xl font-black text-black tracking-tight">{totalTransaksi}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-none">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Berat</p>
          <p className="text-xl font-black text-black tracking-tight">{totalKg.toLocaleString("id-ID")} kg</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-none">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Rata-rata</p>
          <p className="text-xl font-black text-black tracking-tight">
            Rp {totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi).toLocaleString("id-ID") : 0}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-none overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-black">Produk Terlaris</h2>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 w-12">#</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Nama Produk</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-center">Qty</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-center">Berat</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Pendapatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Belum ada data penjualan.
                </TableCell>
              </TableRow>
            ) : (
              productSales.slice(0, 10).map((p, i) => (
                <TableRow key={p.name} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <TableCell className="px-6 py-3 font-black text-gray-300 text-[10px]">{i + 1}</TableCell>
                  <TableCell className="px-6 py-3 font-black text-black text-xs uppercase tracking-tight">{p.name}</TableCell>
                  <TableCell className="px-6 py-3 text-center text-xs font-bold text-gray-500">{p.qty}</TableCell>
                  <TableCell className="px-6 py-3 text-center text-xs font-bold text-gray-500">{p.kg.toLocaleString("id-ID")} kg</TableCell>
                  <TableCell className="px-6 py-3 text-right font-black text-black text-xs">
                    Rp {p.revenue.toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-none overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-black">Riwayat Pesanan ({filteredOrders.length})</h2>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">ID Pesanan</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Total</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Status</TableHead>
              <TableHead className="text-[9px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Tidak ada data di rentang tanggal ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.slice(0, 20).map((o) => (
                <TableRow key={o.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <TableCell className="px-6 py-3 font-mono font-black text-black tracking-tighter text-xs">{o.order_code}</TableCell>
                  <TableCell className="px-6 py-3 font-black text-black text-xs">Rp {o.total_amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{o.status}</TableCell>
                  <TableCell className="px-6 py-3 text-right text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString("id-ID")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
