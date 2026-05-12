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
  Calendar,
  User,
  MapPin,
  CreditCard,
  ChevronRight
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Order = {
  id: string;
  order_code: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  customers: {
    full_name: string;
    whatsapp: string;
    address: string;
    city: string;
    district: string;
  };
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers (*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders((data as any) || []);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-white text-gray-400 border-gray-100 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Pending</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-black text-white border-black text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Processing</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-white text-black border-black text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 font-mono italic tracking-tighter">Shipped</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-white text-black border-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ring-1 ring-black">Delivered</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Cancelled</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Order Management</h1>
          <p className="text-gray-500 text-sm">Monitor, process, and track all customer orders.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Search Order or Customer..." 
            className="pl-10 h-12 rounded-xl border-gray-100 focus:border-black transition-all bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {["all", "pending", "processing", "shipped", "delivered"].map((status) => (
            <Button 
              key={status}
              variant="ghost" 
              size="sm" 
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-5 h-9 text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? "bg-black text-white shadow-lg shadow-black/10 hover:bg-gray-800" 
                  : "text-gray-400 hover:text-black hover:bg-white"
              }`}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden text-black">
        <Table>
          <TableHeader className="bg-gray-50/50 border-b border-gray-50">
            <TableRow>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order ID</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Customer Info</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total Amount</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order Status</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order Date</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-black/20" />
                  <p className="mt-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Fetching orders...</p>
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium font-heading italic">
                  No orders match your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-8 py-6 font-mono font-bold tracking-tighter text-black">{order.order_code}</TableCell>
                  <TableCell className="px-8 py-6">
                    <p className="text-sm font-bold text-black">{order.customers?.full_name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{order.customers?.whatsapp}</p>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-sm font-black tracking-tight text-black">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-8 py-6">{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                      <Calendar size={12} /> {new Date(order.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-black/10"
                        onClick={() => handleViewDetail(order)}
                      >
                        Detail <ChevronRight size={14} className="ml-2" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-xl h-10 w-10 hover:bg-gray-100 text-gray-500 transition-all focus:outline-none">
                          <MoreVertical size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl border-none shadow-2xl p-2 bg-white/80 backdrop-blur-md">
                          <DropdownMenuItem onClick={() => handleViewDetail(order)} className="rounded-xl px-4 py-2.5 text-xs font-bold gap-3 cursor-pointer">
                            <Eye size={14} /> View Details
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-50 my-2"></div>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, "processing")}
                            className="rounded-xl px-4 py-2.5 text-xs font-bold gap-3 cursor-pointer hover:bg-black hover:text-white transition-all"
                          >
                            <Package size={14} /> Mark Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, "shipped")}
                            className="rounded-xl px-4 py-2.5 text-xs font-bold gap-3 cursor-pointer hover:bg-black hover:text-white transition-all"
                          >
                            <Truck size={14} /> Mark Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, "delivered")}
                            className="rounded-xl px-4 py-2.5 text-xs font-bold gap-3 cursor-pointer hover:bg-black hover:text-white transition-all font-black ring-1 ring-black/5"
                          >
                            <CheckCircle2 size={14} /> Mark Delivered
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-50 my-2"></div>
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, "cancelled")}
                            className="rounded-xl px-4 py-2.5 text-xs font-bold gap-3 cursor-pointer text-red-600 hover:bg-red-50"
                          >
                            <XCircle size={14} /> Cancel Order
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

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-20 px-10 py-8 border-b border-gray-50 flex items-center justify-between">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <DialogTitle className="text-3xl font-black tracking-tight">Order #{selectedOrder?.order_code}</DialogTitle>
                {selectedOrder && getStatusBadge(selectedOrder.status)}
              </div>
            </DialogHeader>
          </div>
          
          {selectedOrder && (
            <div className="p-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Customer Info */}
                <div className="space-y-6">
                   <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-black rounded-full"></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Customer Details</p>
                  </div>
                  <Card className="border-none bg-gray-50 shadow-inner rounded-3xl overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-black transition-transform group-hover:rotate-12"><User size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</p>
                          <p className="text-base font-black text-black leading-tight">{selectedOrder.customers?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-black transition-transform group-hover:rotate-12"><CreditCard size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Method</p>
                          <p className="text-base font-black text-black leading-tight uppercase">{selectedOrder.payment_method}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Shipping Address */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-black rounded-full"></div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Shipping Address</p>
                  </div>
                  <Card className="border-none bg-gray-50 shadow-inner rounded-3xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 group">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-black transition-transform group-hover:rotate-12"><MapPin size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Destination</p>
                          <p className="text-sm font-bold text-black leading-relaxed">
                            {selectedOrder.customers?.address}<br />
                            <span className="text-gray-400">Kec. {selectedOrder.customers?.district}, {selectedOrder.customers?.city}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-6">
                 <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-black rounded-full"></div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Items Summary</p>
                </div>
                <div className="bg-white border border-gray-50 rounded-[2rem] shadow-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow className="border-none">
                        <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Product</TableHead>
                        <TableHead className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest">Qty</TableHead>
                        <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">Unit Price</TableHead>
                        <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                      {orderItems.map((item) => (
                        <TableRow key={item.id} className="border-none hover:bg-gray-50/30 transition-colors">
                          <TableCell className="px-8 py-5 font-black text-black">{(item.products as any)?.name}</TableCell>
                          <TableCell className="px-8 py-5 text-center font-bold text-gray-500">{item.quantity}kg</TableCell>
                          <TableCell className="px-8 py-5 text-right font-medium text-gray-400">Rp {item.price_at_time.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="px-8 py-5 text-right font-black text-black">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-8 flex justify-between items-center bg-black text-white">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 leading-none">Grand Total</p>
                      <span className="text-3xl font-black tracking-tighter">
                        Rp {selectedOrder.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                       <CreditCard size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-8 border-t border-gray-50">
                <Button variant="ghost" className="rounded-2xl h-14 px-10 font-bold text-gray-400 hover:text-black transition-all" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
                {selectedOrder.status === 'pending' && (
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 h-14 rounded-2xl px-12 font-black uppercase tracking-widest shadow-2xl shadow-black/20"
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                  >
                    Process Order
                  </Button>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 h-14 rounded-2xl px-12 font-black uppercase tracking-widest shadow-2xl shadow-black/20"
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                  >
                    Dispatch Now
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button 
                    className="bg-black text-white hover:bg-gray-800 h-14 rounded-2xl px-12 font-black uppercase tracking-widest shadow-2xl shadow-black/20"
                    disabled={isUpdating}
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
