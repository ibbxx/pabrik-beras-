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
  CreditCard,
  Image as ImageIcon,
  ExternalLink,
  Trash2
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

type Order = {
  id: string;
  order_code: string;
  customer_id: string;
  subtotal: number | null;
  shipping_cost: number | null;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  payments?: {
    id: string;
    status: string | null;
    proof_url: string | null;
    amount: number;
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
const ORDER_STATUS_TABS = [
  { value: "all", label: "SEMUA" },
  { value: "pending", label: "PENDING" },
  { value: "processing", label: "PROSES" },
  { value: "shipped", label: "DIKIRIM" },
  { value: "delivered", label: "SELESAI" },
  { value: "cancelled", label: "BATAL" },
] as const;

const ORDER_STATUS_MAP: Record<string, string> = {
  pending: "PENDING",
  processing: "PROSES",
  shipped: "DIKIRIM",
  delivered: "SELESAI",
  cancelled: "BATAL",
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(["all"]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setSelectedOrderIds([]);
    fetchOrders();
  }, [statusFilters, page]);

  const handleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((order) => order.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedOrderIds.length} pesanan terpilih? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    
    setLoading(true);
    try {
      // 1. Delete associated payments first
      const { error: payError } = await supabase
        .from('payments')
        .delete()
        .in('order_id', selectedOrderIds);
        
      if (payError) {
        console.error("Error deleting payments:", payError);
      }

      // 2. Delete associated order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', selectedOrderIds);

      if (itemsError) {
        console.error("Error deleting order items:", itemsError);
      }

      // 3. Delete orders
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .in('id', selectedOrderIds);

      if (orderError) throw orderError;

      toast.success("Berhasil menghapus pesanan terpilih!");
      setSelectedOrderIds([]);
      fetchOrders();
    } catch (error: any) {
      toast.error("Gagal menghapus pesanan: " + error.message);
      fetchOrders();
    }
  };

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
          payments (id, status, proof_url, amount)
        `, { count: "exact" })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!statusFilters.includes("all")) {
        query = query.in('status', statusFilters);
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

  const syncUpdatedOrder = (orderId: string, updater: (current: Order) => Order) => {
    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === orderId ? updater(currentOrder) : currentOrder
      )
    );
    setSelectedOrder((currentOrder) =>
      currentOrder && currentOrder.id === orderId ? updater(currentOrder) : currentOrder
    );
  };

  const handleViewDetail = async (order: Order) => {
    setSelectedOrder(order); // Set temporary data first
    setIsDetailModalOpen(true);
    
    // Fetch latest data to ensure payment proof is up to date
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          payments (id, status, proof_url, amount)
        `)
        .eq('id', order.id)
        .single();
        
      if (error) throw error;
      if (data) {
        setSelectedOrder(data as any);
      }
    } catch (err) {
      console.error("Error refreshing order detail:", err);
    }
    
    fetchOrderItems(order.id);
  };

  const verifyPayment = async (paymentId: string, orderId: string, status: 'verified' | 'rejected') => {
    setIsUpdating(true);
    try {
      const { error: payError } = await (supabase as any)
        .from('payments')
        .update({
          status,
          verified_at: status === "verified" ? new Date().toISOString() : null
        })
        .eq('id', paymentId);

      if (payError) throw payError;

      if (status === 'verified') {
        const { error: orderError } = await (supabase as any)
          .from('orders')
          .update({ status: 'processing' })
          .eq('id', orderId);
        
        if (orderError) throw orderError;
        syncUpdatedOrder(orderId, (currentOrder) => ({
          ...currentOrder,
          status: "processing",
          payments: currentOrder.payments?.map((payment) =>
            payment.id === paymentId
              ? {
                  ...payment,
                  status: "verified",
                }
              : payment
          ),
        }));
        toast.success("Pembayaran berhasil diverifikasi!");
        const isCurrentlyVisible = statusFilters.includes("all") || statusFilters.includes("processing");
        if (!isCurrentlyVisible) {
          setStatusFilters(["processing"]);
          setPage(0);
        } else {
          fetchOrders();
        }
      } else {
        syncUpdatedOrder(orderId, (currentOrder) => ({
          ...currentOrder,
          payments: currentOrder.payments?.map((payment) =>
            payment.id === paymentId
              ? {
                  ...payment,
                  status: "rejected",
                }
              : payment
          ),
        }));
        toast.error("Pembayaran ditolak.");
        fetchOrders();
      }

      setIsDetailModalOpen(false);
    } catch (error: any) {
      toast.error("Gagal verifikasi: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    if (order.status === newStatus) {
      toast.warning(`Pesanan ini sudah berada di status ${ORDER_STATUS_MAP[newStatus] || newStatus.toUpperCase()}.`);
      return;
    }

    if (!canMoveOrderStatus(order, newStatus)) {
      if (newStatus === "cancelled") {
        toast.error("Pesanan yang sudah selesai atau dibatalkan tidak dapat dibatalkan lagi.");
      } else {
        const nextStepMap: Record<string, string> = {
          pending: "PROSES",
          processing: "DIKIRIM",
          shipped: "SELESAI",
        };
        const nextStep = nextStepMap[order.status] || "selanjutnya";
        toast.error(
          `Alur tidak valid. Dari status ${ORDER_STATUS_MAP[order.status] || order.status.toUpperCase()}, Anda harus menandai ke "${nextStep}" terlebih dahulu.`
        );
      }
      return;
    }

    const payment = order.payments?.[0];
    const paymentStatus = payment?.status || "pending";

    if (paymentStatus === "rejected" && ["processing", "shipped", "delivered"].includes(newStatus)) {
      const confirmOverride = window.confirm(
        `PERINGATAN: Pembayaran untuk pesanan ini sebelumnya DITOLAK. Apakah Anda yakin tetap ingin memproses pesanan ini dan secara otomatis mengubah status pembayarannya menjadi LUNAS?`
      );
      if (!confirmOverride) return;
    } else {
      const confirmMessage = `Apakah Anda yakin ingin memindahkan status pesanan ${order.order_code} menjadi "${ORDER_STATUS_MAP[newStatus] || newStatus.toUpperCase()}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setIsUpdating(true);
    try {
      const updates: Promise<any>[] = [];

      // 1. Update order status in database
      updates.push(
        (supabase as any)
          .from('orders')
          .update({ status: newStatus })
          .eq('id', order.id)
      );

      // 2. If moving to processing/shipped/delivered and payment is not verified, auto-verify it
      const payment = order.payments?.[0];
      const shouldVerifyPayment = ['processing', 'shipped', 'delivered'].includes(newStatus) && payment && payment.status !== 'verified';
      
      if (shouldVerifyPayment) {
        updates.push(
          (supabase as any)
            .from('payments')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString()
            })
            .eq('id', payment.id)
        );
      }

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
      
      syncUpdatedOrder(order.id, (currentOrder) => {
        const updatedPayments = currentOrder.payments?.map((p) =>
          p.id === payment?.id
            ? { ...p, status: 'verified' }
            : p
        );
        return {
          ...currentOrder,
          status: newStatus,
          payments: shouldVerifyPayment ? updatedPayments : currentOrder.payments,
        };
      });

      toast.success(`Pesanan dipindahkan ke ${ORDER_STATUS_MAP[newStatus] || newStatus}`);
      setIsDetailModalOpen(false);

      const isCurrentlyVisible = statusFilters.includes("all") || statusFilters.includes(newStatus);
      if (!isCurrentlyVisible) {
        setStatusFilters([newStatus]);
        setPage(0);
      } else {
        fetchOrders();
      }
    } catch (error: any) {
      toast.error("Gagal memperbarui status: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatus = (order: Order) => {
    return order.payments?.[0]?.status || "pending";
  };

  const canMoveOrderStatus = (order: Order, newStatus: string) => {
    if (newStatus === "cancelled") return !["delivered", "cancelled"].includes(order.status);

    const nextStatus: Record<string, string> = {
      pending: "processing",
      processing: "shipped",
      shipped: "delivered",
    };

    return nextStatus[order.status] === newStatus;
  };

  const handleStatusFilterChange = (status: string) => {
    if (status === "all") {
      setStatusFilters(["all"]);
    } else {
      setStatusFilters((prev) => {
        let next = prev.filter((s) => s !== "all");
        if (next.includes(status)) {
          next = next.filter((s) => s !== status);
        } else {
          next.push(status);
        }
        if (next.length === 0) {
          return ["all"];
        }
        return next;
      });
    }
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Proses</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Dikirim</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Selesai</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Batal</Badge>;
      default: return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Lunas</Badge>;
      case "submitted": return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Upload</Badge>;
      case "rejected": return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Tolak</Badge>;
      case "cod": return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">COD</Badge>;
      default: return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">Belum</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black tracking-tighter text-black uppercase">Pesanan</h1>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Kelola & Pantau Order Pelanggan</p>
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
          {ORDER_STATUS_TABS.map((status) => (
            <Button 
              key={status.value}
              variant="ghost" 
              size="sm" 
              onClick={() => handleStatusFilterChange(status.value)}
              className={`rounded-md px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilters.includes(status.value) 
                  ? "bg-black text-white" 
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100/50"
              }`}
            >
              {status.label}
            </Button>
          ))}
        </div>

        {selectedOrderIds.length > 0 && (
          <Button 
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="rounded-lg px-4 h-8 text-[9px] font-black uppercase tracking-widest transition-all bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 self-end md:self-auto"
          >
            <Trash2 size={12} /> Hapus ({selectedOrderIds.length})
          </Button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-none">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="w-12 h-10 px-6 text-center">
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-black focus:ring-black h-4 w-4 cursor-pointer"
                />
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">ID Pesanan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">Pelanggan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">Total</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">Pembayaran</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6">Tanggal</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-neutral-500 h-10 px-6 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-black/20" />
                  <p className="mt-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Memuat pesanan...</p>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-gray-400 font-medium font-heading italic">
                  Tidak ada pesanan yang sesuai kriteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="w-12 px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 text-black focus:ring-black h-4 w-4 cursor-pointer"
                    />
                  </TableCell>
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
                          <DropdownMenuItem 
                            onClick={() => handleViewDetail(order)} 
                            className="rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer hover:bg-gray-50 transition-all"
                          >
                            <Eye size={12} /> Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-50 my-1" />
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order, "processing")}
                            className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer transition-all flex items-center justify-between ${
                              order.status === "processing"
                                ? "bg-neutral-100 text-neutral-800 font-black cursor-default"
                                : "hover:bg-black hover:text-white text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <Package size={12} /> Tandai Proses
                            </span>
                            {order.status === "processing" && (
                              <span className="text-[8px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Aktif</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order, "shipped")}
                            className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer transition-all flex items-center justify-between ${
                              order.status === "shipped"
                                ? "bg-neutral-100 text-neutral-800 font-black cursor-default"
                                : "hover:bg-black hover:text-white text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <Truck size={12} /> Tandai Kirim
                            </span>
                            {order.status === "shipped" && (
                              <span className="text-[8px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Aktif</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order, "delivered")}
                            className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer transition-all flex items-center justify-between ${
                              order.status === "delivered"
                                ? "bg-neutral-100 text-neutral-800 font-black cursor-default"
                                : "hover:bg-black hover:text-white text-gray-700"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <CheckCircle2 size={12} /> Tandai Selesai
                            </span>
                            {order.status === "delivered" && (
                              <span className="text-[8px] bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Aktif</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-50 my-1" />
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order, "cancelled")}
                            className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest gap-3 cursor-pointer transition-all flex items-center justify-between ${
                              order.status === "cancelled"
                                ? "bg-neutral-100 text-neutral-800 font-black cursor-default"
                                : "hover:bg-red-50 text-red-600 hover:text-red-700"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <XCircle size={12} /> Batalkan Order
                            </span>
                            {order.status === "cancelled" && (
                              <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Aktif</span>
                            )}
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-neutral-500 mt-4 pt-4 border-t border-neutral-100">
        <p className="uppercase tracking-wider">
          Menampilkan <span className="text-black font-black">{filteredOrders.length}</span> dari <span className="text-black font-black">{totalCount}</span> pesanan
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-black uppercase tracking-widest border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-black rounded-lg transition-colors"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Sebelumnya
          </Button>
          <span className="px-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Halaman <span className="text-black">{page + 1}</span> / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-black uppercase tracking-widest border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-black rounded-lg transition-colors"
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
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ringkasan Pesanan</p>
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
                            <TableCell className="px-6 py-4 text-center font-bold text-gray-500 text-xs">{item.quantity} karung</TableCell>
                            <TableCell className="px-6 py-4 text-right font-black text-black text-xs">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-1.5 text-xs text-black font-semibold px-6 py-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal</span>
                        <span>Rp {(selectedOrder.subtotal || (selectedOrder.total_amount - (selectedOrder.shipping_cost || 0))).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ongkos Kirim</span>
                        <span>Rp {(selectedOrder.shipping_cost || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
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

                {/* Integrated Payment Verification */}
                {selectedOrder.payments?.[0] && (
                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black border-b border-gray-50 pb-2">Bukti Pembayaran</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group">
                        {selectedOrder.payments[0].proof_url && selectedOrder.payments[0].proof_url.startsWith('http') ? (
                          <>
                            <img 
                              src={selectedOrder.payments[0].proof_url} 
                              alt="Bukti Transfer" 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x600?text=Error+Loading+Image';
                              }}
                            />
                            <a 
                              href={selectedOrder.payments[0].proof_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="absolute bottom-4 right-4 bg-black text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                            <ImageIcon size={24} className="opacity-20" />
                            <p className="text-[8px] font-black uppercase tracking-widest text-center">Belum ada bukti yang diunggah</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Status Pembayaran</p>
                          {getPaymentBadge(getPaymentStatus(selectedOrder))}
                          <p className="text-[10px] text-gray-500 mt-3 font-medium leading-relaxed">
                            Pastikan nominal pada gambar sesuai dengan total tagihan sebelum melakukan verifikasi.
                          </p>
                        </div>
                        
                        {(selectedOrder.payments[0].status === 'submitted' || selectedOrder.payments[0].status === 'pending') && (
                          <div className="flex flex-col gap-2">
                            <Button 
                              className="w-full bg-black text-white hover:bg-neutral-800 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                              onClick={() => verifyPayment(selectedOrder.payments![0].id, selectedOrder.id, 'verified')}
                              disabled={isUpdating}
                            >
                              Approve Pembayaran
                            </Button>
                            <Button 
                              variant="outline"
                              className="w-full h-10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 border-gray-100 hover:text-black transition-all"
                              onClick={() => verifyPayment(selectedOrder.payments![0].id, selectedOrder.id, 'rejected')}
                              disabled={isUpdating}
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                    Proses Pesanan
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
