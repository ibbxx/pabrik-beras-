import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Copy, AlertCircle, ArrowRight, Upload, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PaymentConfirmationPage() {
  const { orderId } = useParams(); // Note: orderId here is actually the order_code based on the route setup
  
  const [order, setOrder] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (!orderData) throw new Error("Order not found");
        
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

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG/PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      
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
      if (payment) {
        const { error: updateError } = await (supabase as any)
          .from('payments')
          .update({ proof_url: proofUrl, status: 'submitted' })
          .eq('id', payment.id);

        if (updateError) throw updateError;
      }

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
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pesanan Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Kami tidak dapat menemukan pesanan dengan kode {orderId}.</p>
        <Link to="/">
          <Button className="bg-green-600 hover:bg-green-700">Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const isSubmitted = payment?.status === 'submitted' || payment?.status === 'verified';
  const whatsappMessage = encodeURIComponent(`Halo Admin, saya sudah melakukan pemesanan dengan kode *${order.order_code}* dan total pembayaran *Rp ${order.total_amount?.toLocaleString('id-ID')}*. Mohon segera diproses ya!`);

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Berhasil Dibuat!</h1>
        <p className="text-gray-600">ID Pesanan Anda: <span className="font-bold text-gray-900">{order.order_code}</span></p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-neutral-100 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Instruksi Pembayaran</h2>
        
        <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200 mb-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Total Pembayaran</p>
          <p className="text-4xl font-bold text-green-700 mb-2">Rp {order.total_amount?.toLocaleString('id-ID')}</p>
          {order.payment_method === 'Transfer Bank' && (
            <p className="text-xs text-red-500 flex items-center justify-center gap-1">
              <AlertCircle size={14} /> Bayar tepat hingga 3 digit terakhir
            </p>
          )}
        </div>

        {order.payment_method === 'Transfer Bank' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Transfer ke Rekening Berikut:</h3>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-bold text-lg">Bank BCA</p>
                  <p className="text-gray-600">1234 5678 90</p>
                  <p className="text-sm text-gray-500">a.n Pabrik Beras Desa Kurma</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleCopy("1234567890")} className="flex items-center gap-2">
                  <Copy size={16} /> Salin
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-bold text-lg">Bank Mandiri</p>
                  <p className="text-gray-600">098 765 4321</p>
                  <p className="text-sm text-gray-500">a.n Pabrik Beras Desa Kurma</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleCopy("0987654321")} className="flex items-center gap-2">
                  <Copy size={16} /> Salin
                </Button>
              </div>
            </div>
          </div>
        )}

        {order.payment_method === 'COD' && (
          <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-100 text-orange-800">
            <p className="font-bold mb-2">Cash on Delivery (COD)</p>
            <p className="text-sm">Silakan siapkan uang tunai sesuai total tagihan saat kurir tiba di alamat Anda.</p>
          </div>
        )}
      </div>

      {order.payment_method !== 'COD' && !isSubmitted && (
        <div className="bg-green-50 rounded-3xl p-6 md:p-8 shadow-sm border border-green-100 text-center space-y-6">
          <div>
            <h2 className="text-lg font-bold text-green-900 mb-2">Sudah Melakukan Pembayaran?</h2>
            <p className="text-green-800 text-sm mb-6">
              Segera konfirmasi pembayaran Anda agar pesanan dapat segera diproses dan dikirim.
            </p>
            
            <input 
              type="file" 
              accept="image/*"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 h-12"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? "Mengunggah..." : "Upload Bukti Transfer"}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-green-600 text-green-700 hover:bg-green-100 h-12 bg-white"
                onClick={() => window.open(`https://wa.me/6281234567890?text=${whatsappMessage}`, "_blank")}
              >
                Konfirmasi via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="bg-green-50 rounded-3xl p-6 md:p-8 shadow-sm border border-green-100 text-center">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-200 text-green-700 mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-green-900 mb-2">Bukti Pembayaran Terkirim!</h2>
          <p className="text-green-800 text-sm">
            Terima kasih! Bukti pembayaran Anda sedang kami verifikasi. Kami akan mengabari Anda setelah pembayaran diterima.
          </p>
          <div className="mt-6">
             <Button 
                variant="outline" 
                className="border-green-600 text-green-700 hover:bg-green-100 bg-white"
                onClick={() => window.open(`https://wa.me/6281234567890?text=${whatsappMessage}`, "_blank")}
              >
                Hubungi Admin via WhatsApp
              </Button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to={`/order-status/${order.order_code}`} className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium">
          Pantau Status Pesanan <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
