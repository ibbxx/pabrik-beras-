import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    whatsapp: "",
    address: "",
    city: "Kota Makassar",
    district: "",
    subdistrict: "",
    paymentMethod: "Transfer Bank"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !isSubmitting) {
      navigate("/cart");
    }
  }, [cartItems, navigate, isSubmitting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
  };

  const generateOrderCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ORD-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.fullName || !formData.whatsapp || !formData.address || !formData.city || !formData.district || !formData.subdistrict) {
      toast.error("Mohon lengkapi semua field yang wajib diisi (*)");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Keranjang belanja kosong");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create or update customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          full_name: formData.fullName,
          whatsapp: formData.whatsapp,
          address: `${formData.address}, Kel. ${formData.subdistrict}`,
          city: formData.city,
          district: formData.district
        } as any)
        .select()
        .single();

      if (customerError) throw new Error("Gagal menyimpan data pelanggan: " + customerError.message);
      if (!customerData) throw new Error("Gagal menyimpan data pelanggan: data kosong");

      const customerId = (customerData as any).id;
      const orderCode = generateOrderCode();

      // 2. Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_id: customerId,
          status: 'pending',
          subtotal: cartTotal,
          total_amount: cartTotal,
          payment_method: formData.paymentMethod
        } as any)
        .select()
        .single();

      if (orderError) throw new Error("Gagal membuat pesanan: " + orderError.message);
      if (!orderData) throw new Error("Gagal membuat pesanan: data kosong");

      const orderId = (orderData as any).id;

      // 3. Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems as any);

      if (itemsError) throw new Error("Gagal menyimpan detail pesanan: " + itemsError.message);

      // 4. Create pending payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount: cartTotal,
          payment_method: formData.paymentMethod,
          status: 'pending'
        } as any);

      if (paymentError) throw new Error("Gagal membuat record pembayaran: " + paymentError.message);

      // Success
      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/payment-confirmation/${orderCode}`);

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Terjadi kesalahan saat checkout");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Link to="/cart" className="inline-flex items-center text-black hover:opacity-70 mb-8 font-bold text-sm uppercase tracking-widest">
        <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Keranjang
      </Link>

      <h1 className="text-3xl font-black text-evergreen mb-6 uppercase tracking-tight">Selesaikan Pesanan</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 md:p-6">
              <h2 className="text-xl font-black text-evergreen mb-6 flex items-center gap-2 uppercase tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-black">1</span>
                Informasi Pelanggan
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-neutral-500">Nama Lengkap *</Label>
                  <Input id="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Masukkan nama lengkap Anda" className="h-12 rounded-xl border-neutral-200 focus:ring-primary/20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-xs font-black uppercase tracking-widest text-neutral-500">Nomor WhatsApp *</Label>
                  <Input id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="Contoh: 08123456789" className="h-12 rounded-xl border-neutral-200 focus:ring-primary/20" required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-neutral-500">Alamat Lengkap *</Label>
                  <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Sertakan detail alamat, nama jalan, RT/RW" className="min-h-[100px] rounded-xl border-neutral-200 focus:ring-primary/20 p-4" required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-black uppercase tracking-widest text-neutral-500">Kota/Kabupaten *</Label>
                    <Input id="city" value={formData.city} onChange={handleInputChange} placeholder="Pilih kota" required readOnly className="h-12 rounded-xl bg-neutral-50 border-neutral-200 cursor-not-allowed text-neutral-400 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-xs font-black uppercase tracking-widest text-neutral-500">Kecamatan *</Label>
                    <Input id="district" value={formData.district} onChange={handleInputChange} placeholder="Masukkan Kecamatan" className="h-12 rounded-xl border-neutral-200 focus:ring-primary/20" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subdistrict" className="text-xs font-black uppercase tracking-widest text-neutral-500">Kelurahan *</Label>
                    <Input id="subdistrict" value={formData.subdistrict} onChange={handleInputChange} placeholder="Masukkan Kelurahan" className="h-12 rounded-xl border-neutral-200 focus:ring-primary/20" required />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 md:p-6">
              <h2 className="text-xl font-black text-evergreen mb-6 flex items-center gap-2 uppercase tracking-tight">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-xs font-black">2</span>
                Metode Pembayaran
              </h2>
              <div className="grid gap-4">
                <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors ${formData.paymentMethod === 'Transfer Bank' ? 'border-primary bg-primary/5' : 'border-neutral-200'}`}>
                  <input type="radio" name="payment" value="Transfer Bank" checked={formData.paymentMethod === 'Transfer Bank'} onChange={handlePaymentChange} className="mt-1 accent-primary" />
                  <div>
                    <p className="font-black text-evergreen uppercase tracking-tight">Transfer Bank Mandiri</p>
                    <p className="text-sm text-gray-500 mt-1">Transfer ke rekening Bank Mandiri a.n Aris Abrar.</p>
                    {formData.paymentMethod === 'Transfer Bank' && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-neutral-100 shadow-sm">
                        <p className="text-xs font-black text-gray-700">No. Rekening: <span className="font-mono text-primary">1740012489571</span></p>
                        <p className="text-xs text-gray-500 mt-1">a.n <span className="font-black text-evergreen">Aris Abrar</span></p>
                      </div>
                    )}
                  </div>
                </label>
                <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors ${formData.paymentMethod === 'DANA' ? 'border-primary bg-primary/5' : 'border-neutral-200'}`}>
                  <input type="radio" name="payment" value="DANA" checked={formData.paymentMethod === 'DANA'} onChange={handlePaymentChange} className="mt-1 accent-primary" />
                  <div>
                    <p className="font-black text-evergreen uppercase tracking-tight">DANA</p>
                    <p className="text-sm text-gray-500 mt-1">Pembayaran mudah via aplikasi DANA.</p>
                    {formData.paymentMethod === 'DANA' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-bold text-blue-800">No. DANA: <span className="font-mono text-blue-900">082355148758</span></p>
                        <p className="text-xs text-blue-600 mt-1">a.n <span className="font-semibold text-blue-800">Aris Abrar</span></p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </form>

        </div>

        <div className="w-full lg:w-96">
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 sticky top-24">
            <h2 className="text-xl font-black text-evergreen mb-6 uppercase tracking-tight">Ringkasan Pesanan</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 pr-4">{item.name} x{item.quantity}</span>
                  <span className="font-medium shrink-0">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-4 mb-6 space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim</span>
                <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Hubungi Admin</span>
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-6 mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-evergreen uppercase tracking-tight">Total Pembayaran</span>
                <span className="font-black text-2xl text-primary tracking-tighter">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1 font-medium">*Belum termasuk ongkos kirim</p>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              size="lg"
              className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white h-14 text-lg rounded-2xl font-black shadow-xl shadow-[#25D366]/20 transition-all active:scale-95 uppercase tracking-widest border-none"
              disabled={isSubmitting || cartItems.length === 0}
            >
              {isSubmitting ? "Memproses..." : "Buat Pesanan"}
            </Button>

            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-neutral-50 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>Setelah menekan tombol "Buat Pesanan", Anda akan diarahkan ke halaman instruksi pembayaran.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
