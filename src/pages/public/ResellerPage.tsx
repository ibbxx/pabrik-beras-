import { ArrowRight, HandshakeIcon, TrendingUp, Truck, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResellerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    businessName: "",
    location: "",
    volumeNeeds: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.whatsapp || !formData.businessName || !formData.location || !formData.volumeNeeds) {
      toast.error("Mohon lengkapi semua field yang wajib diisi!");
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('reseller_applications')
        .insert({
          name: formData.name,
          whatsapp: formData.whatsapp,
          business_name: formData.businessName,
          location: formData.location,
          volume_needs: formData.volumeNeeds,
          message: formData.message || null,
          status: 'new'
        } as any);

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Pengajuan berhasil dikirim!");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Gagal mengirim pengajuan. " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(`Halo tim Pabrik Beras Desa Kurma, saya ${formData.name} dari ${formData.businessName}. Saya baru saja mengisi form pendaftaran kemitraan reseller di website dan ingin menindaklanjutinya.`);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-green-900 text-white py-20 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Kembangkan Bisnis Anda Bersama Pabrik Beras Desa Kurma</h1>
          <p className="text-xl text-green-100 mb-8">
            Dapatkan pasokan beras langsung dari pabrik dengan harga khusus dan kualitas terjamin untuk toko, restoran, atau agen Anda.
          </p>
          <Button size="lg" className="bg-white text-green-900 hover:bg-neutral-100" onClick={() => document.getElementById('reseller-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Keuntungan Menjadi Mitra</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Harga Pabrik</h3>
              <p className="text-gray-600">Margin keuntungan lebih besar karena Anda mendapatkan harga langsung dari tangan pertama.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <Truck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Prioritas Pengiriman</h3>
              <p className="text-gray-600">Mitra mendapatkan jadwal pengiriman rutin dan prioritas ketersediaan stok.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <HandshakeIcon size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Dukungan Bisnis</h3>
              <p className="text-gray-600">Kami siap memberikan konsultasi produk dan membantu suplai beras sesuai kebutuhan pasar Anda.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reseller-form" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-3xl shadow-lg border border-neutral-100 p-8 md:p-12">
            {isSuccess ? (
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-2">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Pengajuan Terkirim!</h2>
                <p className="text-lg text-gray-600">
                  Terima kasih, <strong>{formData.name}</strong>. Tim representatif kami akan segera menghubungi Anda di nomor WhatsApp <strong>{formData.whatsapp}</strong> untuk mendiskusikan peluang kerja sama ini.
                </p>
                <div className="pt-6">
                  <p className="text-sm text-gray-500 mb-4">Ingin langsung mengobrol dengan tim kami?</p>
                  <Button 
                    size="lg" 
                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-white w-full sm:w-auto"
                    onClick={() => window.open(`https://wa.me/6281234567890?text=${whatsappMessage}`, "_blank")}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" /> Hubungi via WhatsApp Sekarang
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Formulir Pendaftaran Mitra/Reseller</h2>
                  <p className="text-gray-600">Isi data diri dan usaha Anda di bawah ini, tim kami akan segera menghubungi Anda untuk mendiskusikan peluang kerja sama.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                      <Input id="name" value={formData.name} onChange={handleChange} placeholder="Nama Anda" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                      <Input id="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Contoh: 0812..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nama Toko / Usaha <span className="text-red-500">*</span></Label>
                      <Input id="businessName" value={formData.businessName} onChange={handleChange} placeholder="Contoh: Toko Beras Makmur" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi (Kota/Kab) <span className="text-red-500">*</span></Label>
                      <Input id="location" value={formData.location} onChange={handleChange} placeholder="Contoh: Demak" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volumeNeeds">Perkiraan Kebutuhan Beras (per bulan) <span className="text-red-500">*</span></Label>
                    <select 
                      id="volumeNeeds" 
                      value={formData.volumeNeeds} 
                      onChange={handleChange}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Pilih perkiraan volume</option>
                      <option value="<500kg">Kurang dari 500 kg</option>
                      <option value="500-1000kg">500 kg - 1 Ton</option>
                      <option value="1-5ton">1 Ton - 5 Ton</option>
                      <option value=">5ton">Lebih dari 5 Ton</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Pesan Tambahan (Opsional)</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message} 
                      onChange={handleChange}
                      placeholder="Sebutkan jenis beras spesifik yang Anda cari atau pertanyaan lainnya..." 
                      className="min-h-[120px]" 
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-green-600 hover:bg-green-700 h-12 text-md mt-4">
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                    {isSubmitting ? "Mengirim..." : "Kirim Pengajuan Kerja Sama"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
