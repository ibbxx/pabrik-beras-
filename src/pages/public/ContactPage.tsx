import { Mail, MapPin, Phone, MessageSquare, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useSettings } from "@/hooks/useSettings";
import { sanitizeGoogleMapsIframe } from "@/lib/content";
import { buildWhatsAppUrl } from "@/lib/contact";

export default function ContactPage() {
  const { settings, loading } = useSettings();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Admin Pabrik Beras Mapaili,\n\nNama: ${formData.name}\nEmail: ${formData.email}\nNo. Telp/WA: ${formData.phone}\nSubjek: ${formData.subject}\n\nPesan:\n${formData.message}`;
    window.open(buildWhatsAppUrl(settings.contact_whatsapp, text), "_blank");
  };

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
                      {settings.contact_address || "Jl. H. S. Mengga, Lorong Makassar Baru, Dusun Paredeang, Mapaili, Kecamatan Mapilli, Sulawesi Barat"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#1F331E]/10 text-[#1F331E] flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Alamat Gudang</h3>
                    <p className="text-gray-600 mt-1 whitespace-pre-line">
                      {settings.warehouse_address || "Jl. Andi Mappaodang No.125, Balang Baru, Kec. Tamalate, Kota Makassar, Sulawesi Selatan 90224"}
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
                      {settings.contact_email || "info@pabrikberasmapaili.com"}
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
              <div
                className="absolute inset-0 w-full h-full"
                dangerouslySetInnerHTML={{ __html: sanitizeGoogleMapsIframe('<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d17373.5431063401!2d119.18154817703702!3d-3.3740288827607685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2d949a7d374a6be1%3A0x60e8a4ef879cccb!2sJl.%20H.%20S.%20Mengga%2C%20Kec.%20Mapilli%2C%20Kabupaten%20Polewali%20Mandar%2C%20Sulawesi%20Barat!5e0!3m2!1sen!2sid!4v1779108849166!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>') }}
              />
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-neutral-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Masukkan nama Anda" required />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Alamat email Anda" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon/WA</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Contoh: 0812..." required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Topik pesan" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Pesan Anda</Label>
              <Textarea id="message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Tuliskan detail pertanyaan atau pesan Anda di sini..." className="min-h-[150px]" required />
            </div>

            <Button type="submit" size="lg" className="w-full bg-[#1F331E] hover:bg-[#1F331E]/90 h-14 text-lg rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-[#1F331E]/20">
              <MessageSquare className="mr-2 h-5 w-5" /> Kirim Pesan Sekarang
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
