import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (search = searchQuery) => {
    setLoading(true);
    try {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchProducts(searchQuery);
    }
  };

  return (
    <div className="container mx-auto py-8 lg:py-20 px-4 min-h-screen">
      <div className="mb-6 lg:mb-16 text-center space-y-2 lg:space-y-4">
        <h1 className="text-2xl lg:text-5xl font-black text-foreground tracking-tighter uppercase">Katalog Produk</h1>
        <p className="text-[10px] lg:text-sm text-muted-foreground max-w-xl mx-auto font-medium leading-relaxed uppercase tracking-widest">
          Kualitas beras premium dari Pabrik Desa Kurma.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 lg:gap-6 justify-between items-center mb-8 lg:mb-12">
        <div className="relative w-full md:w-[500px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust-grey h-4 w-4 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Cari beras..." 
            className="pl-12 h-12 lg:h-14 rounded-xl lg:rounded-2xl border-dust-grey/20 bg-background shadow-sm focus:border-primary transition-all text-xs lg:text-base" 
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-dust-grey">
          Menampilkan {products.length} Produk
        </p>
      </div>

      <div className="grid gap-4 lg:gap-8 grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-[1.5rem] lg:rounded-[2rem] bg-dust-grey/10 animate-pulse" />
          ))
        ) : products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="group flex flex-col h-full bg-background border border-dust-grey/10 rounded-[1.25rem] lg:rounded-[2.5rem] p-2.5 lg:p-6 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <Link to={`/products/${product.slug}`} className="relative aspect-square mb-3 lg:mb-6 overflow-hidden rounded-[1rem] lg:rounded-[1.5rem] bg-dust-grey/10 border border-dust-grey/20">
                {product.main_image_url ? (
                  <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-200">Tidak Ada Gambar</div>
                )}
                {product.is_featured && (
                  <div className="absolute top-2 left-2 lg:top-4 lg:left-4 bg-primary text-primary-foreground text-[7px] lg:text-[8px] font-black uppercase tracking-widest px-2 lg:px-3 py-1 lg:py-1.5 rounded-full shadow-xl">
                    Unggulan
                  </div>
                )}
              </Link>

              <div className="flex-1 space-y-2 lg:space-y-4">
                <div className="flex justify-between items-start">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm lg:text-xl font-black text-foreground tracking-tight leading-tight hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  </Link>
                </div>
                
                <p className="text-muted-foreground text-[9px] lg:text-xs line-clamp-2 leading-relaxed font-medium">
                  {product.description || "Beras kualitas premium dari Desa Kurma."}
                </p>

                <div className="flex items-end justify-between pt-2 lg:pt-4 mt-auto">
                  <div className="space-y-0.5 lg:space-y-1">
                    <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-dust-grey">Harga</p>
                    <p className="text-sm lg:text-2xl font-black text-primary tracking-tighter">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-evergreen rounded-lg lg:rounded-2xl h-7 w-7 lg:h-12 lg:w-12 p-0 shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
                    disabled={product.stock <= 0}
                    onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.main_image_url,
                        stock: product.stock,
                      });
                      toast.success("Produk ditambahkan");
                    }}
                  >
                    <ShoppingBag size={14} className="lg:hidden" />
                    <ShoppingBag size={20} className="hidden lg:block" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <Search size={48} className="text-dust-grey/20 mb-6" />
            <h3 className="text-2xl font-black text-foreground mb-2">Hasil tidak ditemukan</h3>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-8">Coba kata kunci lain</p>
            <Button 
              variant="outline" 
              className="rounded-xl px-8 h-12 font-bold border-dust-grey/20 hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => {
                setSearchQuery("");
                fetchProducts("");
              }}
            >
              Atur Ulang Pencarian
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
