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
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Link to="/" className="inline-flex items-center text-black hover:opacity-70 mb-8 font-bold text-sm uppercase tracking-widest">
        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Beranda
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Pesanan</h1>
          <p className="text-gray-500">
            ID Pesanan: <span className="font-bold text-gray-900">{order.order_code}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Tanggal: {orderDate} WIB</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.print()}>
            <Download size={16} /> Unduh Invoice
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-8">Lacak Pengiriman</h2>
        
        {/* Progress Tracker */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 rounded-full hidden sm:block"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black rounded-full hidden sm:block transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 ${
                    isCompleted ? 'bg-black border-neutral-100 text-white' : 'bg-white border-neutral-100 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-neutral-100' : ''} transition-colors`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mt-1 sm:mt-0">Sedang berlangsung</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detail Produk</h2>
          <div className="space-y-4 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-neutral-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{(item.products as any)?.name || 'Produk'}</p>
                  <p className="text-sm text-gray-500">{item.quantity} x Rp {item.price_at_time.toLocaleString('id-ID')}</p>
                </div>
                <p className="font-bold text-gray-900">
                  Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-black text-2xl tracking-tighter">Rp {(order.total_amount || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Pengiriman</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Nama Penerima</p>
              <p className="font-medium text-gray-900">{customer?.full_name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Nomor Telepon / WhatsApp</p>
              <p className="font-medium text-gray-900">{customer?.whatsapp || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Alamat Pengiriman</p>
              <p className="font-medium text-gray-900">
                {customer?.address || '-'} <br />
                {customer?.district ? `Kec. ${customer.district}` : ''} <br />
                {customer?.city ? `${customer.city}` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Metode Pembayaran</p>
              <p className="font-medium flex items-center justify-between text-gray-900">
                <span>{order.payment_method || '-'}</span>
                {payment?.status === 'verified' && (
                  <span className="bg-neutral-900 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">LUNAS</span>
                )}
                {payment?.status === 'submitted' && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">MENUNGGU VERIFIKASI</span>
                )}
                {payment?.status === 'pending' && (
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">BELUM BAYAR</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
