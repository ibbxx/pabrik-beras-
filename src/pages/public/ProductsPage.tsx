import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";


export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");


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
        <h1 className="text-2xl lg:text-5xl font-black text-foreground tracking-widest uppercase leading-relaxed">Katalog Produk</h1>
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
            <div key={product.id} className="group flex flex-col h-full bg-background border border-dust-grey/10 rounded-2xl lg:rounded-[2rem] p-4 lg:p-7 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
              <Link to={`/products/${product.slug}`} className="relative aspect-square mb-5 lg:mb-8 overflow-hidden rounded-xl lg:rounded-[1.5rem] bg-gray-50/50">
                {product.main_image_url ? (
                  <img 
                    src={product.main_image_url} 
                    alt={product.name} 
                    className="h-full w-full object-contain p-4 lg:p-8 transition-transform duration-700" 
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-200 text-[10px] font-bold uppercase tracking-widest">Tidak Ada Gambar</div>
                )}
                {product.is_featured && (
                  <div className="absolute top-3 left-3 lg:top-5 lg:left-5 bg-primary text-primary-foreground text-[7px] lg:text-[8px] font-black uppercase tracking-widest px-2.5 lg:px-4 py-1 lg:py-2 rounded-full shadow-xl">
                    Unggulan
                  </div>
                )}
              </Link>

              <div className="flex-1 flex flex-col">
                <div className="space-y-1 lg:space-y-2 mb-4">
                  <h3 className="text-sm lg:text-xl font-black text-foreground tracking-tight uppercase leading-tight">{product.name}</h3>
                  <p className="text-[10px] lg:text-sm font-black text-dust-grey uppercase tracking-widest">
                    Netto: {product.weight_kg ? `${product.weight_kg}kg` : (product.unit || '5kg')}
                  </p>
                </div>

                <div className="mt-auto pt-4 lg:pt-6 border-t border-dust-grey/10">
                  <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-dust-grey mb-1 lg:mb-2">Harga</p>
                  <p className="text-base lg:text-3xl font-black text-primary tracking-tighter">
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
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
