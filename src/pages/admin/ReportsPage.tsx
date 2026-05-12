import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Download,
  CalendarDays
} from "lucide-react";
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
  created_at: string;
};

type OrderItemRow = {
  quantity: number;
  price_at_time: number;
  products: { name: string; weight_kg: number | null } | null;
};

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
      // Fetch all delivered/processing orders for reporting
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("id, order_code, total_amount, status, created_at")
        .in("status", ["processing", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (ordersErr) throw ordersErr;
      setOrders(ordersData || []);

      // Fetch all order items with product info
      const { data: itemsData, error: itemsErr } = await supabase
        .from("order_items")
        .select("quantity, price_at_time, products(name, weight_kg)");

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
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  // Summary stats
  const totalOmzet = filteredOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalTransaksi = filteredOrders.length;

  // Top products
  const productSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number; kg: number }> = {};
    orderItems.forEach((item) => {
      const name = (item.products as any)?.name || "Unknown";
      const wkg = (item.products as any)?.weight_kg || 1;
      if (!map[name]) map[name] = { name, qty: 0, revenue: 0, kg: 0 };
      map[name].qty += item.quantity;
      map[name].revenue += item.quantity * item.price_at_time;
      map[name].kg += item.quantity * wkg;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orderItems]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-500 text-sm">Ringkasan pendapatan dan performa produk.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      {/* Date Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white border rounded-xl p-4 shadow-sm">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarDays size={12} /> Dari Tanggal</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500 flex items-center gap-1"><CalendarDays size={12} /> Sampai Tanggal</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-44" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setDateFrom(""); setDateTo(""); }}
          className="text-gray-500"
        >
          Reset
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Omzet</p>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">Rp {totalOmzet.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Transaksi</p>
            <ShoppingCart className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{totalTransaksi}</p>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Total Kg Terjual</p>
            <Package className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{totalKg.toLocaleString("id-ID")} kg</p>
        </div>
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Rata-rata / Transaksi</p>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            Rp {totalTransaksi > 0 ? Math.round(totalOmzet / totalTransaksi).toLocaleString("id-ID") : 0}
          </p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">Produk Terlaris</h2>
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead className="text-center">Qty Terjual</TableHead>
              <TableHead className="text-center">Kg Terjual</TableHead>
              <TableHead className="text-right">Pendapatan</TableHead>
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
                <TableRow key={p.name}>
                  <TableCell className="font-bold text-gray-400">{i + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                  <TableCell className="text-center">{p.qty}</TableCell>
                  <TableCell className="text-center">{p.kg.toLocaleString("id-ID")} kg</TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    Rp {p.revenue.toLocaleString("id-ID")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-900">Riwayat Pesanan ({filteredOrders.length})</h2>
        </div>
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Kode Pesanan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
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
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-bold">{o.order_code}</TableCell>
                  <TableCell className="font-bold text-green-700">Rp {o.total_amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="capitalize text-sm">{o.status}</TableCell>
                  <TableCell className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString("id-ID")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
