import { Mail, MapPin, Phone, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import { sanitizeGoogleMapsIframe } from "@/lib/content";

export default function ContactPage() {
  const { settings, loading } = useSettings();

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1F331E] mb-4 uppercase tracking-widest leading-relaxed">Hubungi Kami</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ada pertanyaan seputar produk beras, kemitraan, atau pesanan Anda? Tim kami siap membantu!
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info & Map */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Informasi Kontak</h2>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-black" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1F331E]/10 text-[#1F331E] flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Alamat Pabrik</h3>
                    <p className="text-gray-600 mt-1 whitespace-pre-line">
                      {settings.contact_address || "Desa Kurma RT 02/RW 03, Kec. Karangtengah,\nKab. Demak, Jawa Tengah 59561"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1F331E]/10 text-[#1F331E] flex items-center justify-center shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Telepon & WhatsApp</h3>
                    <p className="text-gray-600 mt-1">
                      {settings.contact_whatsapp || "082355148758"}
                      <br />
                      <span className="text-sm">(Senin - Sabtu, 08:00 - 17:00 WIB)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1F331E]/10 text-[#1F331E] flex items-center justify-center shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">
                      {settings.contact_email || "info@pabrikberaskurma.com"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-neutral-100 rounded-3xl overflow-hidden h-[300px] border border-neutral-200 flex items-center justify-center relative">
            {settings.contact_maps_iframe ? (
              <div 
                className="absolute inset-0 w-full h-full"
                dangerouslySetInnerHTML={{ __html: sanitizeGoogleMapsIframe(settings.contact_maps_iframe) }}
              />
            ) : (
              <>
                <div className="text-center p-6 z-10">
                  <MapPin size={48} className="mx-auto text-neutral-400 mb-4 opacity-50" />
                  <p className="text-gray-500 font-medium">Peta Lokasi Pabrik (Google Maps)</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-neutral-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h2>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="Masukkan nama Anda" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Alamat email Anda" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon/WA</Label>
                <Input id="phone" placeholder="Contoh: 0812..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" placeholder="Topik pesan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Pesan Anda</Label>
              <Textarea id="message" placeholder="Tuliskan detail pertanyaan atau pesan Anda di sini..." className="min-h-[150px]" />
            </div>

            <Button size="lg" className="w-full bg-[#1F331E] hover:bg-[#1F331E]/90 h-14 text-lg rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#1F331E]/20">
              <MessageSquare className="mr-2 h-5 w-5" /> Kirim Pesan Sekarang
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
