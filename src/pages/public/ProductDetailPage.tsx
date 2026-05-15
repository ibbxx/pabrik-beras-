import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Minus, Plus, ShoppingBag, MessageCircle, ShieldCheck, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { buildWhatsAppUrl } from "@/lib/contact";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
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
      <div className="container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center text-gray-400 hover:text-black transition-colors font-black uppercase tracking-widest text-[10px] gap-2">
          <ChevronLeft size={14} /> Kembali ke Katalog
        </Link>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* Image Display */}
          <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-black/5 group">
            {product.main_image_url ? (
              <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-200">Tidak Ada Gambar</div>
            )}
            {product.is_featured && (
              <div className="absolute top-8 left-8 bg-black text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl">
                Kualitas Unggulan
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-10">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-5xl font-black text-black tracking-tighter leading-none">{product.name}</h1>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Berat Bersih: {product.weight_kg ? `${product.weight_kg}kg` : "Grosir / Kustom"}</span>
                <span className="h-1 w-1 rounded-full bg-gray-200"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Stok: {product.stock} kg Tersedia</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Harga per KG</p>
              <p className="text-3xl lg:text-5xl font-black text-black tracking-tighter">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="space-y-4 border-y border-gray-50 py-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Deskripsi Produk</p>
              <p className="text-gray-500 leading-relaxed font-medium">
                {product.description || "Beras kualitas premium kami diproses dengan teknologi modern untuk menjamin keaslian, tekstur, dan rasa. Langsung dari Pabrik Desa Kurma, kami menjamin kualitas paling segar untuk makanan harian keluarga Anda."}
              </p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <ShieldCheck size={20} className="text-black" />
                <span className="text-[8px] font-black uppercase tracking-widest text-center">Murni & Alami</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <Truck size={20} className="text-black" />
                <span className="text-[8px] font-black uppercase tracking-widest text-center">Pengiriman Cepat</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <Award size={20} className="text-black" />
                <span className="text-[8px] font-black uppercase tracking-widest text-center">Harga Terbaik</span>
              </div>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-90"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-16 text-center font-black text-xl">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all active:scale-90"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Berat Pembelian</p>
                  <p className="text-sm font-bold text-black">{quantity} Kilogram</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="flex-[2] bg-black text-white hover:bg-gray-800 h-16 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95"
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
                  <ShoppingBag size={20} className="mr-3" /> Masukkan Keranjang
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-100 rounded-[1.5rem] h-16 font-black uppercase tracking-widest hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all active:scale-95"
                  onClick={() => window.open(buildWhatsAppUrl(settings.contact_whatsapp, `Halo, saya tertarik dengan produk ${product.name}`), "_blank")}
                >
                  <MessageCircle size={20} className="mr-3" /> WhatsApp
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
