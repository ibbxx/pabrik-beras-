import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
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
    <div className="container mx-auto py-20 px-4 min-h-screen">
      <div className="mb-16 text-center space-y-4">
        <h1 className="text-5xl font-black text-black tracking-tighter">OUR PRODUCTS</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm font-medium leading-relaxed uppercase tracking-widest">
          Premium rice quality from Desa Kurma Factory. 
          Freshly milled and delivered to your doorstep.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12">
        <div className="relative w-full md:w-[500px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Search our rice products..." 
            className="pl-12 h-14 rounded-2xl border-gray-100 bg-white shadow-sm focus:border-black transition-all" 
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">
          Showing {products.length} Results
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-[2rem] bg-gray-50 animate-pulse" />
          ))
        ) : products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="group flex flex-col h-full bg-white border border-gray-50 rounded-[2.5rem] p-6 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500">
              <Link to={`/products/${product.slug}`} className="relative aspect-square mb-6 overflow-hidden rounded-[1.5rem] bg-gray-50 border border-gray-100">
                {product.main_image_url ? (
                  <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-200">No Image</div>
                )}
                {product.is_featured && (
                  <div className="absolute top-4 left-4 bg-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl">
                    Featured
                  </div>
                )}
              </Link>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-xl font-black text-black tracking-tight leading-tight hover:text-gray-600 transition-colors">{product.name}</h3>
                  </Link>
                </div>
                
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed font-medium">
                  {product.description || "Premium quality rice milled with high standards for your family's daily needs."}
                </p>

                <div className="flex items-end justify-between pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Price per KG</p>
                    <p className="text-2xl font-black text-black tracking-tighter">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-2xl h-12 w-12 p-0 shadow-lg shadow-black/10 transition-all hover:scale-110 active:scale-95" disabled={product.stock <= 0}>
                    <ShoppingBag size={20} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <Search size={48} className="text-gray-100 mb-6" />
            <h3 className="text-2xl font-black text-black mb-2">No results found</h3>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-8">Try different keywords</p>
            <Button 
              variant="outline" 
              className="rounded-xl px-8 h-12 font-bold border-gray-100 hover:bg-black hover:text-white transition-all"
              onClick={() => {
                setSearchQuery("");
                fetchProducts("");
              }}
            >
              Reset Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
