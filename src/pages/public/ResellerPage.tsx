import { ArrowRight, HandshakeIcon, TrendingUp, Truck, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { buildWhatsAppUrl } from "@/lib/contact";
import resellerHero from "@/assets/reseller-hero.jpeg";

export default function ResellerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { settings } = useSettings();
  
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

  const whatsappMessage = `Halo tim Pabrik Beras Desa Kurma, saya ${formData.name} dari ${formData.businessName}. Saya baru saja mengisi form pendaftaran kemitraan reseller di website dan ingin menindaklanjutinya.`;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative min-h-[40vh] lg:min-h-[55vh] flex items-center justify-center py-10 lg:py-16 px-4 overflow-hidden">
        {/* Full Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={resellerHero} 
            alt="Reseller Background" 
            className="w-full h-full object-cover"
          />
          {/* Dark Overlay for Contrast */}
          <div className="absolute inset-0 bg-black/60 lg:bg-black/40" />
        </div>
        
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white animate-fade-in-up opacity-0 [animation-delay:200ms]">
              <HandshakeIcon size={12} />
              Kemitraan
            </div>
            
            <h1 className="mt-6 text-2xl lg:text-5xl font-black uppercase tracking-widest leading-relaxed text-white drop-shadow-md animate-fade-in-up opacity-0 [animation-delay:400ms]">
              Kembangkan Bisnis Anda <br className="hidden lg:block" /> Bersama Kami
            </h1>
            
            <p className="mt-4 text-[10px] lg:text-base text-white/90 leading-relaxed max-w-lg mx-auto font-bold uppercase tracking-widest drop-shadow-sm animate-fade-in-up opacity-0 [animation-delay:600ms]">
              Pasokan beras langsung dari pabrik dengan harga khusus.
            </p>
            
            <div className="flex flex-row items-center justify-center gap-3 mt-8 animate-fade-in-up opacity-0 [animation-delay:800ms]">
              <Button size="sm" className="bg-primary text-white font-black hover:bg-evergreen h-12 lg:h-14 px-6 lg:px-8 shadow-xl transition-all hover:-translate-y-1 active:scale-95 text-xs lg:text-sm uppercase tracking-widest rounded-2xl" onClick={() => document.getElementById('reseller-form')?.scrollIntoView({ behavior: 'smooth' })}>
                Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-white/90 border-white text-[#1F331E] hover:bg-white hover:text-[#1F331E]/80 rounded-2xl h-12 lg:h-14 px-6 lg:px-8 font-black text-xs lg:text-sm transition-all hover:-translate-y-1 active:scale-95 shadow-lg shadow-[#1F331E]/10 uppercase tracking-widest" onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp || "082355148758", "Halo, saya ingin bertanya tentang kemitraan reseller."), "_blank")}>
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Hubungi Admin
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 lg:py-20 bg-dust-grey/10 overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl mb-6 lg:mb-14 text-center">
          <h2 className="text-lg lg:text-3xl font-black text-foreground uppercase tracking-tight">Keuntungan Menjadi Mitra</h2>
          <p className="mt-1 text-[8px] lg:text-xs text-muted-foreground font-black uppercase tracking-widest">Growth With Us</p>
        </div>
        
        <div className="relative">
          {/* Gradient Faders */}
          <div className="absolute inset-y-0 left-0 w-12 lg:w-32 bg-gradient-to-r from-dust-grey/20 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 lg:w-32 bg-gradient-to-l from-dust-grey/20 to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee flex gap-4 lg:gap-8 px-4">
            {[1, 2, 3, 4].map((set) => (
              <div key={set} className="flex gap-4 lg:gap-8">
                <div className="bg-background p-4 lg:p-8 rounded-xl lg:rounded-[2.5rem] shadow-sm border border-dust-grey/20 text-center w-[220px] lg:w-[350px] shrink-0 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 lg:mb-6">
                    <TrendingUp className="w-5 h-5 lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-base lg:text-xl font-black mb-1 lg:mb-2 text-foreground">Harga Pabrik</h3>
                  <p className="text-[10px] lg:text-base text-muted-foreground leading-relaxed text-justify">Margin keuntungan lebih besar karena Anda mendapatkan harga langsung dari tangan pertama.</p>
                </div>
                <div className="bg-background p-4 lg:p-8 rounded-xl lg:rounded-[2.5rem] shadow-sm border border-dust-grey/20 text-center w-[220px] lg:w-[350px] shrink-0 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 lg:mb-6">
                    <Truck className="w-5 h-5 lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-base lg:text-xl font-black mb-1 lg:mb-2 text-foreground">Prioritas Pengiriman</h3>
                  <p className="text-[10px] lg:text-base text-muted-foreground leading-relaxed text-justify">Mitra mendapatkan jadwal pengiriman rutin dan prioritas ketersediaan stok.</p>
                </div>
                <div className="bg-background p-4 lg:p-8 rounded-xl lg:rounded-[2.5rem] shadow-sm border border-dust-grey/20 text-center w-[220px] lg:w-[350px] shrink-0 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="w-10 h-10 lg:w-16 lg:h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 lg:mb-6">
                    <HandshakeIcon className="w-5 h-5 lg:w-8 lg:h-8" />
                  </div>
                  <h3 className="text-base lg:text-xl font-black mb-1 lg:mb-2 text-foreground">Dukungan Bisnis</h3>
                  <p className="text-[10px] lg:text-base text-muted-foreground leading-relaxed text-justify">Kami siap memberikan konsultasi produk dan membantu suplai beras sesuai kebutuhan pasar Anda.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reseller-form" className="py-6 lg:py-20 bg-background">
        <div className="container mx-auto px-3 lg:px-4 max-w-3xl">
          <div className="bg-background rounded-xl lg:rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-dust-grey/10 p-4 lg:p-12">
            {isSuccess ? (
              <div className="text-center space-y-3 lg:space-y-6">
                <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-primary/10 text-primary mb-1">
                  <CheckCircle2 className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <h2 className="text-lg lg:text-3xl font-black text-foreground tracking-tight">Pengajuan Terkirim!</h2>
                <p className="text-xs lg:text-lg text-muted-foreground">
                  Terima kasih, <strong>{formData.name}</strong>. Tim kami akan segera menghubungi Anda di nomor WhatsApp <strong>{formData.whatsapp}</strong>.
                </p>
                <div className="pt-4 lg:pt-6">
                  <p className="text-xs text-gray-500 mb-3">Ingin langsung mengobrol dengan tim kami?</p>
                  <Button 
                    size="lg" 
                    className="bg-[#25D366] hover:bg-[#1ebd5a] text-white w-full sm:w-auto h-10 lg:h-14 px-6 lg:px-8 rounded-lg lg:rounded-xl font-black text-xs lg:text-sm"
                    onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp || "082355148758", whatsappMessage), "_blank")}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> Hubungi via WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4 lg:mb-10">
                  <h2 className="text-base lg:text-3xl font-black text-foreground mb-1 lg:mb-3 uppercase tracking-tight">Formulir Kemitraan</h2>
                  <p className="text-[8px] lg:text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto uppercase tracking-widest">Growth With Us</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-6">
                  <div className="grid md:grid-cols-2 gap-3 lg:gap-6">
                    <div className="space-y-1 lg:space-y-2">
                      <Label htmlFor="name" className="text-[11px] lg:text-sm">Nama Lengkap <span className="text-red-500">*</span></Label>
                      <Input id="name" value={formData.name} onChange={handleChange} placeholder="Nama Anda" className="h-9 lg:h-10 text-xs lg:text-sm" />
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                      <Label htmlFor="whatsapp" className="text-[11px] lg:text-sm">Nomor WhatsApp <span className="text-red-500">*</span></Label>
                      <Input id="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="Contoh: 0812..." className="h-9 lg:h-10 text-xs lg:text-sm" />
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                      <Label htmlFor="businessName" className="text-[11px] lg:text-sm">Nama Toko / Usaha <span className="text-red-500">*</span></Label>
                      <Input id="businessName" value={formData.businessName} onChange={handleChange} placeholder="Contoh: Toko Beras Makmur" className="h-9 lg:h-10 text-xs lg:text-sm" />
                    </div>
                    <div className="space-y-1 lg:space-y-2">
                      <Label htmlFor="location" className="text-[11px] lg:text-sm">Lokasi (Kota/Kab) <span className="text-red-500">*</span></Label>
                      <Input id="location" value={formData.location} onChange={handleChange} placeholder="Contoh: Demak" className="h-9 lg:h-10 text-xs lg:text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1 lg:space-y-2">
                    <Label htmlFor="volumeNeeds" className="text-[11px] lg:text-sm">Kebutuhan Beras / Bulan <span className="text-red-500">*</span></Label>
                    <select 
                      id="volumeNeeds" 
                      value={formData.volumeNeeds} 
                      onChange={handleChange}
                      className="flex h-9 lg:h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Pilih perkiraan volume</option>
                      <option value="<500kg">Kurang dari 500 kg</option>
                      <option value="500-1000kg">500 kg - 1 Ton</option>
                      <option value="1-5ton">1 Ton - 5 Ton</option>
                      <option value=">5ton">Lebih dari 5 Ton</option>
                    </select>
                  </div>

                  <div className="space-y-1 lg:space-y-2">
                    <Label htmlFor="message" className="text-[11px] lg:text-sm">Pesan Tambahan (Opsional)</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message} 
                      onChange={handleChange}
                      placeholder="Jenis beras spesifik atau pertanyaan lainnya..." 
                      className="min-h-[80px] lg:min-h-[120px] text-xs lg:text-sm" 
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full bg-primary hover:bg-evergreen h-9 lg:h-14 rounded-lg lg:rounded-xl text-xs lg:text-base font-black shadow-xl shadow-primary/20 mt-2 lg:mt-4 transition-all hover:-translate-y-0.5">
                    {isSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
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
