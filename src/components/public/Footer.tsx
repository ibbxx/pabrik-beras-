import { Link } from "react-router-dom";
import { Globe, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import logo from "@/assets/logo.png";

export function Footer() {
  const { settings } = useSettings();

  return (
    <footer className="bg-evergreen text-dust-grey/60 pt-10 lg:pt-16 pb-6 lg:pb-8 relative overflow-hidden">
      {/* Decorative subtle texture or gradient could go here */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 mb-8 lg:mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-12 w-auto object-contain bg-background p-1 rounded-md" 
                loading="lazy"
                decoding="async"
              />
              <h3 className="text-xl font-black text-background">{settings.business_name || "Pabrik Beras Desa Kurma"}</h3>
            </div>
            <p className="text-dust-grey/50 text-[10px] lg:text-sm mb-4 leading-relaxed">
              {settings.footer_description || "Penyedia beras lokal berkualitas dengan harga terbaik langsung dari pabrik penggilingan."}
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors"><Globe size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-black text-background mb-4 uppercase tracking-widest text-xs">Tautan</h4>
            <ul className="space-y-2 text-sm text-dust-grey/50">
              <li><Link to="/about" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Katalog Produk</Link></li>
              <li><Link to="/reseller" className="hover:text-primary transition-colors">Daftar Reseller</Link></li>
              <li><Link to="/articles" className="hover:text-primary transition-colors">Artikel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-black text-background mb-4 uppercase tracking-widest text-xs">Bantuan</h4>
            <ul className="space-y-2 text-sm text-dust-grey/50">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/order-status" className="hover:text-primary transition-colors">Cek Status Pesanan</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-black text-background mb-4 uppercase tracking-widest text-xs">Kontak</h4>
            <ul className="space-y-4 text-sm text-dust-grey/50">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="shrink-0" />
                <span>{settings.contact_address || "Jl. Desa Kurma No. 123, Kabupaten Demak, Jawa Tengah"}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="shrink-0" />
                <span>{settings.contact_whatsapp || "082355148758"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/5 pt-6 lg:pt-8 text-center text-[9px] lg:text-sm text-dust-grey/30 font-bold uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} {settings.business_name || "Pabrik Beras Desa Kurma"}.</p>
        </div>
      </div>
    </footer>
  );
}
