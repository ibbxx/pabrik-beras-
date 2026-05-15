import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu } from "lucide-react";
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
          <img src={logo} alt={settings.business_name || "Desa Kurma"} className="h-10 lg:h-12 w-auto object-contain" />
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
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl hover:bg-dust-grey/20 transition-all text-foreground">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground">
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
              <SheetContent side="right" className="w-[300px] bg-background border-l-0 shadow-2xl">
                <SheetTitle className="text-left text-foreground text-2xl font-black mb-8 uppercase tracking-tighter">Menu</SheetTitle>
                <SheetDescription className="hidden">Navigasi utama website</SheetDescription>
                <div className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-xl font-black tracking-tight transition-colors ${location.pathname === link.path ? 'text-primary' : 'text-foreground/40 hover:text-primary'}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <div className="h-px bg-dust-grey/20 my-4"></div>
                  <Link to="/contact" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-14 bg-primary hover:bg-evergreen rounded-2xl text-lg font-black shadow-xl shadow-primary/20 text-primary-foreground">Hubungi Kami</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
