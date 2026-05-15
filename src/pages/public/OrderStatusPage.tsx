import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Package, Truck, ArrowLeft, Download, Search, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  // Search state
  const [searchInput, setSearchInput] = useState("");
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    const fetchOrderData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_code', orderId)
          .single();

        if (orderError || !orderData) {
          setOrder(null);
          setLoading(false);
          return;
        }
        
        setOrder(orderData);

        const orderDataAny = orderData as any;

        // 2. Fetch Customer
        if (orderDataAny.customer_id) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('id', orderDataAny.customer_id)
            .single();
          setCustomer(customerData);
        }

        // 3. Fetch Items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*, products(name)')
          .eq('order_id', orderDataAny.id);
        
        if (itemsData) setItems(itemsData);

        // 4. Fetch Payment
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderDataAny.id)
          .single();
          
        if (paymentData) setPayment(paymentData);

      } catch (err) {
        console.error("Error fetching order status", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/order-status/${searchInput.trim()}`);
    }
  };

  // --- SEARCH MODE ---
  if (!orderId) {
    return (
      <div className="container mx-auto py-24 px-4 max-w-xl text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Lacak Pesanan Anda</h1>
        <p className="text-gray-600 mb-8">
          Masukkan kode pesanan Anda (contoh: ORD-123456) untuk melihat status pengiriman dan detail transaksi.
        </p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Masukkan Kode Pesanan..." 
            className="h-12 text-lg"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" className="h-12 bg-black hover:bg-neutral-800 px-8 rounded-xl font-bold">
            <Search className="mr-2 h-5 w-5" /> Cari
          </Button>
        </form>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="container mx-auto py-24 flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  // --- NOT FOUND STATE ---
  if (!order && !loading) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Kami tidak menemukan pesanan dengan kode <span className="font-bold">{orderId}</span>.</p>
        <Link to="/order-status">
          <Button className="bg-black hover:bg-neutral-800 rounded-xl font-bold">Coba Pencarian Lain</Button>
        </Link>
      </div>
    );
  }

  // --- TRACKING MODE ---
  const steps = [
    { id: "pending", label: "Menunggu Pembayaran", icon: Clock },
    { id: "processing", label: "Pesanan Diproses", icon: Package },
    { id: "shipped", label: "Dalam Pengiriman", icon: Truck },
    { id: "delivered", label: "Pesanan Selesai", icon: CheckCircle2 },
  ];

  let currentStatus = order.status || 'pending';
  // If payment is verified but order still pending, technically it's processing
  if (currentStatus === 'pending' && payment?.status === 'verified') {
    currentStatus = 'processing';
  }
  
  // Find index. If not found, default to 0
  let currentStepIndex = steps.findIndex(s => s.id === currentStatus);
  if (currentStepIndex === -1) currentStepIndex = 0;

  // Format date
  const orderDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="container mx-auto py-4 px-4 max-w-3xl">
      <Link to="/" className="inline-flex items-center text-gray-400 hover:text-black mb-4 font-black text-[10px] uppercase tracking-widest gap-2">
        <ArrowLeft className="h-3 w-3" /> Kembali ke Beranda
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Status Pesanan</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              ID: <span className="text-black">{order.order_code}</span>
            </p>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{orderDate} WIB</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-lg" onClick={() => window.print()}>
          <Download size={12} className="mr-1" /> Invoice
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 mb-4">
        <h2 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">Lacak Pengiriman</h2>
        
        {/* Progress Tracker */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 rounded-full hidden sm:block"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full hidden sm:block transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex flex-col items-center text-center gap-2 z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 ${
                    isCompleted ? 'bg-black border-neutral-100 text-white' : 'bg-white border-neutral-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-neutral-100' : ''} transition-colors`}>
                    <Icon size={16} />
                  </div>
                  <div className="hidden sm:block">
                    <p className={`font-black text-[9px] uppercase tracking-tight ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100">
          <h2 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Detail Produk</h2>
          <div className="space-y-2 mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-neutral-50 last:border-0">
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{(item.products as any)?.name || 'Produk'}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.quantity} x Rp {item.price_at_time.toLocaleString('id-ID')}</p>
                </div>
                <p className="text-xs font-black text-black">
                  Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
            <span className="font-black text-black text-xl tracking-tighter">Rp {(order.total_amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-neutral-100 h-fit">
          <h2 className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Pengiriman & Pembayaran</h2>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Penerima</p>
                <p className="text-[11px] font-black text-black uppercase tracking-tight">{customer?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">WhatsApp</p>
                <p className="text-[11px] font-black text-black uppercase tracking-tight">{customer?.whatsapp || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Alamat</p>
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                {customer?.address || '-'}, {customer?.district ? `Kec. ${customer.district}` : ''}, {customer?.city || ''}
              </p>
            </div>
            <div className="pt-2 border-t border-neutral-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Pembayaran</p>
                <p className="text-[10px] font-black text-black uppercase tracking-widest">{order.payment_method || '-'}</p>
              </div>
              <div>
                {payment?.status === 'verified' && (
                  <span className="bg-black text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">LUNAS</span>
                )}
                {payment?.status === 'submitted' && (
                  <span className="bg-blue-50 text-blue-700 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">DIPROSES</span>
                )}
                {payment?.status === 'pending' && (
                  <span className="bg-orange-50 text-orange-700 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest">PENDING</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
