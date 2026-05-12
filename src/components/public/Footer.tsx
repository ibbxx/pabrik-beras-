import { Link } from "react-router-dom";
import { Globe, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-green-900 text-green-50 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">Pabrik Beras Desa Kurma</h3>
            <p className="text-green-200 text-sm mb-4">
              Penyedia beras lokal berkualitas dengan harga terbaik langsung dari pabrik penggilingan.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors"><Globe size={20} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Tautan</h4>
            <ul className="space-y-2 text-sm text-green-200">
              <li><Link to="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Katalog Produk</Link></li>
              <li><Link to="/reseller" className="hover:text-white transition-colors">Daftar Reseller</Link></li>
              <li><Link to="/articles" className="hover:text-white transition-colors">Artikel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Bantuan</h4>
            <ul className="space-y-2 text-sm text-green-200">
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link to="/order-status" className="hover:text-white transition-colors">Cek Status Pesanan</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Kontak</h4>
            <ul className="space-y-4 text-sm text-green-200">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="shrink-0" />
                <span>Jl. Desa Kurma No. 123, Kabupaten Demak, Jawa Tengah</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-green-800 pt-8 text-center text-sm text-green-300">
          <p>&copy; {new Date().getFullYear()} Pabrik Beras Desa Kurma. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
