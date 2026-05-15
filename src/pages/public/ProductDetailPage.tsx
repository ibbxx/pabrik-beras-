import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, MessageCircle, ShieldCheck, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { buildWhatsAppUrl } from "@/lib/contact";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Product not found");

        setProduct(data);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Gagal memuat produk.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <h2 className="text-3xl font-black text-black mb-4 tracking-tighter uppercase">Produk Tidak Ditemukan</h2>
        <p className="text-gray-400 mb-8 uppercase tracking-widest text-xs font-bold">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
        <Link to="/products">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-xl px-8 h-12 font-bold shadow-xl shadow-black/10 transition-all">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-5">
        <Link to="/products" className="inline-flex items-center text-gray-400 hover:text-black transition-colors font-black uppercase tracking-widest text-[10px] gap-2">
          <ChevronLeft size={14} /> Kembali ke Katalog
        </Link>
      </div>

      <div className="container mx-auto px-0 lg:px-4">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-12 items-start">

          {/* Image Display */}
          <div className="relative aspect-square overflow-hidden bg-gray-50/50 lg:rounded-[2.5rem] lg:border lg:border-gray-100 flex items-center justify-center">
            {product.main_image_url ? (
              <img 
                src={product.main_image_url} 
                alt={product.name} 
                className="h-[85%] w-[85%] object-contain transition-transform duration-700 group-hover:scale-105" 
                fetchPriority="high"
                decoding="async"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-200 font-black uppercase tracking-widest text-[10px]">Tidak Ada Gambar</div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-5 lg:space-y-8 p-6 lg:p-0">
            <div className="space-y-4">
              {product.is_featured && (
                <div className="inline-flex items-center gap-2 bg-[#1F331E]/5 text-[#1F331E] px-3 py-1 rounded-full border border-[#1F331E]/10 animate-fade-in">
                  <Award size={12} className="fill-[#1F331E]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Kualitas Unggulan</span>
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl lg:text-5xl font-black text-[#1F331E] tracking-tighter leading-[1.1] uppercase">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Berat Bersih: {product.weight_kg ? `${product.weight_kg}kg` : "Grosir / Kustom"}</span>
                  <span className="hidden sm:block h-1 w-1 rounded-full bg-gray-200"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stok: <span className="text-[#1F331E]">{product.stock} Karung</span></span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-1">Harga per Karung</p>
                <p className="text-4xl lg:text-6xl font-black text-[#1F331E] tracking-tighter">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="border-y border-gray-100 py-4 lg:py-6">
              <button 
                onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                className="w-full flex items-center justify-between py-2 group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-[#1F331E] transition-colors">Deskripsi Produk</p>
                {isDescriptionOpen ? (
                  <ChevronUp size={16} className="text-gray-400 group-hover:text-[#1F331E] transition-colors" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400 group-hover:text-[#1F331E] transition-colors" />
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDescriptionOpen ? "max-h-[500px] opacity-100 mt-2 lg:mt-3" : "max-h-0 opacity-0"}`}>
                <p className="text-gray-600 text-sm lg:text-base leading-relaxed font-medium text-justify pb-2">
                  {product.description || "Beras kualitas premium kami diproses dengan teknologi modern untuk menjamin keaslian, tekstur, dan rasa. Langsung dari Pabrik Desa Kurma, kami menjamin kualitas paling segar untuk makanan harian keluarga Anda."}
                </p>
              </div>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: "Murni & Alami" },
                { icon: Truck, label: "Kirim Cepat" },
                { icon: Award, label: "Harga Pabrik" }
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 transition-colors hover:bg-gray-50">
                  <f.icon size={20} className="text-[#1F331E]" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center text-[#1F331E]/60">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 bg-gray-50/50 p-4 lg:p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center bg-white rounded-2xl p-2 border border-gray-100 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-14 w-14 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-all active:scale-90 text-[#1F331E]"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex flex-col items-center justify-center min-w-[5rem] px-2">
                    <span className="font-black text-2xl text-[#1F331E] leading-none">{quantity}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1">Karung</span>
                  </div>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-14 w-14 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-all active:scale-90 text-[#1F331E]"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="px-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Total Berat Pembelian</p>
                  <p className="text-base lg:text-lg font-black text-[#1F331E]">
                    {product.weight_kg ? `${quantity * product.weight_kg} Kilogram` : "Grosir / Kustom"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3">
                <Button 
                  className="w-full bg-[#1F331E] text-white h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#1F331E]/10 transition-all hover:bg-[#1F331E]/90 active:scale-[0.98] flex items-center justify-center gap-3"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      quantity: quantity,
                      image: product.main_image_url,
                      stock: product.stock,
                    });
                    navigate("/checkout");
                  }}
                >
                  Beli Sekarang
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="w-full border-2 border-gray-100 text-[#1F331E] h-14 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 active:scale-[0.98] flex items-center justify-center gap-2"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: quantity,
                        image: product.main_image_url,
                        stock: product.stock,
                      });
                      toast.success("Berhasil ditambahkan ke keranjang");
                    }}
                  >
                    <ShoppingBag size={16} />
                    Keranjang
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-2 border-gray-100 bg-white h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1F331E] hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 px-1"
                    onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp, `Halo, saya tertarik dengan produk ${product.name}`), "_blank")}
                  >
                    <MessageCircle size={16} className="text-[#25D366]" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
