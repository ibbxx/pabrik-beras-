import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Loader2, 
  Eye, 
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  MoreVertical,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

type Order = {
  id: string;
  order_code: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  payments?: {
    status: string | null;
    proof_url: string | null;
  }[];
  customers: {
    full_name: string;
    whatsapp: string;
    address: string;
    city: string;
    district: string;
  };
};

const PAGE_SIZE = 25;

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          payments (status, proof_url)
        `, { count: "exact" })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setOrders((data as any) || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Gagal memuat pesanan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', orderId);
      
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat detail produk: " + error.message);
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
    setIsDetailModalOpen(true);
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    if (!canMoveOrderStatus(order, newStatus)) {
      toast.error("Status pesanan tidak bisa dilanjutkan sebelum pembayaran terverifikasi atau urutan status sebelumnya selesai.");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      toast.success(`Order status updated to ${newStatus}`);
      setIsDetailModalOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatus = (order: Order) => {
    if (order.payment_method === "COD") return "cod";
    return order.payments?.[0]?.status || "pending";
  };

  const isPaymentCleared = (order: Order) => {
    return order.payment_method === "COD" || getPaymentStatus(order) === "verified";
  };

  const canMoveOrderStatus = (order: Order, newStatus: string) => {
    if (newStatus === "cancelled") return !["delivered", "cancelled"].includes(order.status);

    if (!isPaymentCleared(order)) return false;

    const nextStatus: Record<string, string> = {
      pending: "processing",
      processing: "shipped",
      shipped: "delivered",
    };

    return nextStatus[order.status] === newStatus;
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-gray-100 text-black border-gray-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">Proses</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-white text-black border-black text-[9px] font-black uppercase tracking-widest px-2 py-0">Dikirim</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-black text-white border-transparent text-[9px] font-black uppercase tracking-widest px-2 py-0">Selesai</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-white text-gray-300 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Batal</Badge>;
      default: return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge variant="outline" className="bg-black text-white border-transparent text-[9px] font-black uppercase tracking-widest px-2 py-0">Lunas</Badge>;
      case "submitted": return <Badge variant="outline" className="bg-gray-100 text-black border-gray-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">Upload</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-white text-gray-300 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Tolak</Badge>;
      case "cod": return <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">COD</Badge>;
      default: return <Badge variant="outline" className="bg-white text-gray-300 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Belum</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black tracking-tighter text-black uppercase">Pesanan</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kelola & Pantau Order Pelanggan</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Cari ID atau Pelanggan..." 
            className="pl-9 h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
            <Button 
              key={status}
              variant="ghost" 
              size="sm" 
              onClick={() => handleStatusFilterChange(status)}
              className={`rounded-md px-4 h-8 text-[9px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? "bg-black text-white" 
                  : "text-gray-400 hover:text-black hover:bg-transparent"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-none">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Order ID</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Pelanggan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Total</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Payment</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Tanggal</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-black/20" />
                  <p className="mt-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Fetching orders...</p>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-gray-400 font-medium font-heading italic">
                  No orders match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 font-mono font-black tracking-tighter text-black text-xs">{order.order_code}</TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-[11px] font-black text-black uppercase tracking-tight">{order.customers?.full_name}</p>
                    <p className="text-[9px] text-gray-400 font-bold">{order.customers?.whatsapp}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[11px] font-black tracking-tight text-black">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-6 py-4">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="px-6 py-4">{getPaymentBadge(getPaymentStatus(order))}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent"
                        onClick={() => handleViewDetail(order)}
                      >
                        Detail
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-gray-50 text-gray-300 transition-all focus:outline-none">
                          <MoreVertical size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border border-gray-100 shadow-xl p-1 bg-white">
                          <DropdownMenuItem onClick={() => handleViewDetail(order)} className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer">
                            <Eye size={12} /> Lihat Detail
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-50 my-1"></div>
                          <DropdownMenuItem 
                            disabled={!canMoveOrderStatus(order, "processing")}
                            onClick={() => updateOrderStatus(order, "processing")}
                            className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer hover:bg-black hover:text-white transition-all"
                          >
                            <Package size={12} /> Tandai Proses
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={!canMoveOrderStatus(order, "shipped")}
                            onClick={() => updateOrderStatus(order, "shipped")}
                            className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer hover:bg-black hover:text-white transition-all"
                          >
                            <Truck size={12} /> Tandai Kirim
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={!canMoveOrderStatus(order, "delivered")}
                            onClick={() => updateOrderStatus(order, "delivered")}
                            className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer hover:bg-black hover:text-white transition-all"
                          >
                            <CheckCircle2 size={12} /> Tandai Selesai
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-50 my-1"></div>
                          <DropdownMenuItem 
                            disabled={!canMoveOrderStatus(order, "cancelled")}
                            onClick={() => updateOrderStatus(order, "cancelled")}
                            className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer text-gray-300 hover:text-black"
                          >
                            <XCircle size={12} /> Batalkan Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-widest text-gray-300">
        <p>
          Menampilkan {filteredOrders.length} dari {totalCount} pesanan
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-gray-400 hover:text-black hover:bg-transparent"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Sebelumnya
          </Button>
          <span className="px-3">Halaman {page + 1} / {totalPages}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-gray-400 hover:text-black hover:bg-transparent"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
          >
            Berikutnya
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl bg-white border-none rounded-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 lg:p-8 border-b border-gray-50 shrink-0">
            <DialogHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Order Summary</p>
                  <DialogTitle className="text-xl lg:text-3xl font-black tracking-tighter uppercase">ID: {selectedOrder?.order_code}</DialogTitle>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder && getStatusBadge(selectedOrder.status)}
                  {selectedOrder && getPaymentBadge(getPaymentStatus(selectedOrder))}
                </div>
              </div>
            </DialogHeader>
          </div>
          
          {selectedOrder && (
            <>
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black border-b border-gray-50 pb-2">Data Pelanggan</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Nama</p>
                        <p className="text-sm font-black text-black uppercase tracking-tight">{selectedOrder.customers?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Metode Bayar</p>
                        <p className="text-xs font-black text-black uppercase tracking-widest">{selectedOrder.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black border-b border-gray-50 pb-2">Alamat Pengiriman</p>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Destinasi</p>
                      <p className="text-xs font-bold text-gray-600 leading-relaxed uppercase tracking-tight">
                        {selectedOrder.customers?.address}, Kec. {selectedOrder.customers?.district}, {selectedOrder.customers?.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black border-b border-gray-50 pb-2">Ringkasan Produk</p>
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-none">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-gray-50">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Produk</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-center">Qty</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Harga</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-50">
                        {orderItems.map((item) => (
                          <TableRow key={item.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="px-6 py-4 font-black text-black text-xs uppercase tracking-tight">{(item.products as any)?.name}</TableCell>
                            <TableCell className="px-6 py-4 text-center font-bold text-gray-500 text-xs">{item.quantity}kg</TableCell>
                            <TableCell className="px-6 py-4 text-right font-black text-black text-xs">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-6 flex justify-between items-center bg-black text-white">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Akhir</p>
                        <span className="text-2xl font-black tracking-tighter">
                          Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <CreditCard size={20} className="text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-50 flex flex-col sm:flex-row gap-3 shrink-0">
                <Button variant="ghost" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent" onClick={() => setIsDetailModalOpen(false)}>
                  Tutup
                </Button>
                <div className="flex-1"></div>
                {selectedOrder.status === 'pending' && (
                  <Button 
                    className="bg-black text-white hover:bg-black/90 h-10 px-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/10"
                    disabled={isUpdating || !canMoveOrderStatus(selectedOrder, 'processing')}
                    onClick={() => updateOrderStatus(selectedOrder, 'processing')}
                  >
                    Proses Order
                  </Button>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button 
                    className="bg-black text-white hover:bg-black/90 h-10 px-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/10"
                    disabled={isUpdating || !canMoveOrderStatus(selectedOrder, 'shipped')}
                    onClick={() => updateOrderStatus(selectedOrder, 'shipped')}
                  >
                    Kirim Sekarang
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button 
                    className="bg-black text-white hover:bg-black/90 h-10 px-8 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/10"
                    disabled={isUpdating || !canMoveOrderStatus(selectedOrder, 'delivered')}
                    onClick={() => updateOrderStatus(selectedOrder, 'delivered')}
                  >
                    Tandai Selesai
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
