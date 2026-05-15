import { Link, useParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Upload, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createImageStoragePath, validateImageFile } from "@/lib/media";
import { useSettings } from "@/hooks/useSettings";
import { buildWhatsAppUrl } from "@/lib/contact";

export default function PaymentConfirmationPage() {
  const { orderId } = useParams(); // Note: orderId here is actually the order_code based on the route setup
  
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        // 1. Fetch Order by order_code
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_code', orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderData) throw new Error("Pesanan tidak ditemukan");
        
        setOrder(orderData);

        // 2. Fetch associated Payment record
        const orderDataAny = orderData as any;
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderDataAny.id)
          .single();
          
        if (paymentError) {
          console.warn("Payment record might not exist yet:", paymentError);
        } else {
          setPayment(paymentData);
        }

      } catch (err: any) {
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file, { maxSizeMB: 5 });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!payment) {
      toast.error("Record pembayaran tidak ditemukan. Hubungi admin dengan kode pesanan Anda.");
      return;
    }

    try {
      setIsUploading(true);
      
      const fileName = createImageStoragePath(`orders/${orderId || "unknown"}`, file);
      
      // Upload to Supabase Storage bucket "payment_proofs"
      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(fileName);

      const proofUrl = urlData.publicUrl;

      // Update payments table status to 'submitted'
      const { error: updateError } = await (supabase as any)
        .from('payments')
        .update({ proof_url: proofUrl, status: 'submitted' })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      setPayment((prev: any) => ({ ...prev, proof_url: proofUrl, status: 'submitted' }));
      toast.success('Bukti pembayaran berhasil diunggah!');

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error('Gagal mengunggah bukti pembayaran. ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard!');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-24 flex justify-center items-center">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Kami tidak dapat menemukan pesanan dengan kode {orderId}.</p>
        <Link to="/">
          <Button className="bg-black hover:bg-neutral-800 rounded-xl font-bold">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const isSubmitted = payment?.status === 'submitted' || payment?.status === 'verified';
  const whatsappMessage = `Halo Admin, saya sudah melakukan pemesanan dengan kode *${order.order_code}* dan total pembayaran *Rp ${order.total_amount?.toLocaleString('id-ID')}*. Mohon segera diproses ya!`;


  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 text-black mb-2">
          <CheckCircle2 size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Pesanan Berhasil!</h1>
        <p className="text-sm text-gray-500">ID: <span className="font-bold text-gray-900">{order.order_code}</span></p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-3 text-center uppercase tracking-widest">Instruksi Pembayaran</h2>
        
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-4 text-center">
          <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-widest">Total Pembayaran</p>
          <p className="text-3xl font-black text-black tracking-tighter">Rp {order.total_amount?.toLocaleString('id-ID')}</p>
        </div>

        {order.payment_method === 'Transfer Bank' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-neutral-50">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bank Mandiri</p>
                <p className="font-mono font-bold text-base text-black">1740012489571</p>
                <p className="text-xs text-gray-500">a.n Aris Abrar</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy("1740012489571")} className="h-9 text-[10px] font-bold uppercase tracking-widest">
                Salin
              </Button>
            </div>
          </div>
        )}

        {order.payment_method === 'DANA' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-blue-100 rounded-lg bg-blue-50/50">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">DANA</p>
                <p className="font-mono font-bold text-base text-blue-900">082355148758</p>
                <p className="text-xs text-blue-600">a.n Aris Abrar</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCopy("082355148758")} className="h-9 text-[10px] font-bold uppercase tracking-widest border-blue-200 text-blue-700">
                Salin
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isSubmitted && (
        <div className="bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-800 text-center">
          <h2 className="text-sm font-bold text-white mb-1 uppercase tracking-widest">Konfirmasi Pembayaran</h2>
          <p className="text-neutral-400 text-[10px] mb-4">Upload bukti transfer agar pesanan segera diproses.</p>
          
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-white text-black hover:bg-neutral-100 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 mr-2" />}
              {isUploading ? "..." : "Upload Bukti"}
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 h-11 bg-transparent rounded-xl text-[10px] font-black uppercase tracking-widest"
              onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp, whatsappMessage), "_blank")}
            >
              WhatsApp
            </Button>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white mb-3">
            <CheckCircle2 size={20} />
          </div>
          <h2 className="text-sm font-bold text-black mb-1 uppercase tracking-widest">Bukti Terkirim!</h2>
          <p className="text-neutral-500 text-[10px] mb-4">Pembayaran Anda sedang diverifikasi admin.</p>
          <Button 
            variant="outline" 
            className="w-full border-black text-black hover:bg-black hover:text-white bg-white h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp, whatsappMessage), "_blank")}
          >
            Chat Admin via WhatsApp
          </Button>
        </div>
      )}

      <div className="mt-4 text-center">
        <Link to={`/order-status/${order.order_code}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2">
          Pantau Status Pesanan <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
