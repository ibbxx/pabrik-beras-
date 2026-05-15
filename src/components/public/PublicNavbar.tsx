import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useSettings";
import logo from "@/assets/logo.png";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();
  const { settings } = useSettings();

  const navLinks = [
    { name: "Beranda", path: "/" },
    { name: "Tentang Kami", path: "/about" },
    { name: "Katalog", path: "/products" },
    { name: "Mitra/Reseller", path: "/reseller" },
    { name: "Artikel", path: "/articles" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-dust-grey/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 lg:h-20 items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt={settings.business_name || "Desa Kurma"}
            className="h-14 lg:h-16 w-auto object-contain"
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-black tracking-tight transition-all hover:text-primary ${location.pathname === link.path ? 'text-primary opacity-100 underline decoration-2 underline-offset-8' : 'text-foreground/60'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/cart">
            <Button variant="ghost" className="relative h-12 w-12 p-0 rounded-xl hover:bg-neutral-100 transition-all text-evergreen">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-7">
                <circle cx="8" cy="21" r="1"/>
                <circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground border-2 border-background">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px] bg-white border-l-0 shadow-2xl p-0 flex flex-col">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <SheetTitle className="text-left text-[#1F331E] text-xl font-black uppercase tracking-tighter">Menu</SheetTitle>
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-8 w-auto opacity-20 grayscale"
                  />
                </div>

                <SheetDescription className="hidden">Navigasi utama website</SheetDescription>

                <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`group relative flex items-center h-12 px-4 rounded-xl transition-all ${isActive
                            ? 'bg-[#1F331E]/5 text-[#1F331E]'
                            : 'text-gray-400 hover:text-[#1F331E] hover:bg-gray-50'
                          }`}
                      >
                        <span className={`text-sm font-black tracking-tight ${isActive ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'} transition-all duration-300 mr-2`}>
                          →
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{link.name}</span>
                        {isActive && (
                          <div className="absolute left-0 w-1 h-5 bg-[#1F331E] rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                <div className="p-6 bg-gray-50/50 mt-auto border-t border-gray-100">
                  <Link to="/contact" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-12 bg-[#1F331E] hover:bg-[#1F331E]/90 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#1F331E]/20 text-white transition-all active:scale-95">
                      Hubungi Kami
                    </Button>
                  </Link>
                  <div className="mt-6 flex flex-col gap-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">Pabrik Beras Desa Kurma</p>
                    <p className="text-[8px] font-bold text-gray-400 leading-relaxed italic">"Kualitas Premium dari Petani Lokal"</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
