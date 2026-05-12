import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSettings();
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, testimoRes] = await Promise.all([
          supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(4),
          supabase.from("testimonials").select("*").eq("is_active", true).limit(3)
        ]);
        
        if (productsRes.data) setFeaturedProducts(productsRes.data);
        if (testimoRes.data) setTestimonials(testimoRes.data);

      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchData();
  }, []);

  const loading = productsLoading || settingsLoading;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden bg-[#0a1a12] text-white">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src={settings.hero_image_url || "https://images.unsplash.com/photo-1536633340743-345330364993?q=80&w=2070&auto=format&fit=crop"} 
            alt="Organic Rice"
            className="h-full w-full object-cover opacity-30 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a12] via-[#0a1a12]/90 to-[#0a1a12]/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a12] via-transparent to-transparent"></div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-green-600/10 rounded-full blur-[140px]"></div>
        </div>

        <div className="container relative z-10 mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 animate-fade-in-down">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-semibold tracking-wider uppercase text-green-400">
                  {settings.hero_badge || "Langsung dari Penggilingan"}
                </span>
              </div>
              
              {/* Headline — lebih kecil, rata kiri */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                  {settings.hero_headline ? (
                    <span dangerouslySetInnerHTML={{ __html: settings.hero_headline.replace(/\[green\](.*?)\[\/green\]/g, '<span class="text-green-500">$1</span>') }} />
                  ) : (
                    <>Beras Premium dari <span className="text-green-500">Desa Kurma</span></>
                  )}
                </h1>
                <p className="text-base md:text-lg text-neutral-400 max-w-lg leading-relaxed">
                  {settings.hero_subheadline || "Menghadirkan beras kualitas terbaik langsung dari penggilingan. Segar, pulen, dan tanpa bahan pengawet — siap diantar ke rumah Anda."}
                </p>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/products">
                  <Button size="lg" className="h-12 px-7 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-900/30 transition-all hover:-translate-y-0.5 active:scale-95 group">
                    <ShoppingBag className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" /> 
                    Belanja Sekarang
                  </Button>
                </Link>
                <Link to={settings.hero_cta_link || "/contact"}>
                  <Button size="lg" variant="ghost" className="h-12 px-7 rounded-xl text-white font-semibold hover:bg-white/5 border border-white/10 transition-all hover:-translate-y-0.5">
                    {settings.hero_cta_text || "Hubungi Kami"}
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-6 border-t border-white/10">
                {[
                  { label: settings.trust_1 || "Tanpa Pemutih", icon: "✓" },
                  { label: settings.trust_2 || "Harga Pabrik", icon: "✓" },
                  { label: settings.trust_3 || "Kirim Cepat", icon: "✓" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-neutral-500 text-sm">
                    <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-[9px] font-bold">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Empty or Illustration (removed stats card) */}
          </div>
        </div>

      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{settings.benefit_title || "Mengapa Memilih Beras Kami?"}</h2>
            <p className="mt-4 text-gray-600">{settings.benefit_subtitle || "Keunggulan Pabrik Beras Desa Kurma dibandingkan yang lain"}</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: settings.benefit_1_title || "Kualitas Terjamin", desc: settings.benefit_1_desc || "Diproses dengan mesin modern menghasilkan beras putih, bersih, dan pulen." },
              { title: settings.benefit_2_title || "Harga Tangan Pertama", desc: settings.benefit_2_desc || "Langsung dari pabrik penggilingan sehingga harga lebih hemat untuk Anda." },
              { title: settings.benefit_3_title || "Pasokan Stabil", desc: settings.benefit_3_desc || "Kapasitas produksi besar memastikan ketersediaan stok sepanjang tahun." }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 bg-neutral-50 rounded-2xl">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Produk Pilihan</h2>
              <p className="mt-2 text-gray-600">Beras favorit pelanggan kami</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center text-green-600 hover:text-green-700 font-medium">
              Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              // Skeleton loading
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="group rounded-2xl bg-white p-4 shadow-sm border border-neutral-100">
                  <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-neutral-100 animate-pulse" />
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-full bg-neutral-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse mb-4" />
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-20 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-neutral-200 rounded-full animate-pulse" />
                  </div>
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div key={product.id} className="group rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md border border-neutral-100">
                  <Link to={`/products/${product.slug}`}>
                    <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-neutral-100 relative">
                      {product.main_image_url ? (
                        <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm">No Image</div>
                      )}
                    </div>
                  </Link>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Premium</span>
                    <span className="text-xs text-gray-500">Stok: {product.stock > 0 ? 'Tersedia' : 'Habis'}</span>
                  </div>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-4">Kemasan {product.weight_kg ? `${product.weight_kg}kg` : product.unit}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg text-gray-900">Rp {product.price.toLocaleString('id-ID')}</span>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 rounded-full h-8 w-8 p-0" disabled={product.stock <= 0}>
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                Belum ada produk unggulan saat ini.
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/products">
              <Button variant="outline" className="w-full border-green-600 text-green-600">
                Lihat Semua Katalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Apa Kata Mereka?</h2>
            <p className="mt-4 text-gray-600">Kepercayaan pelanggan adalah prioritas utama kami</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-neutral-50 rounded-2xl animate-pulse">
                  <div className="h-4 w-full bg-neutral-200 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-neutral-200 rounded mb-6" />
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-neutral-200" />
                    <div>
                      <div className="h-4 w-24 bg-neutral-200 rounded mb-1" />
                      <div className="h-3 w-16 bg-neutral-200 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : testimonials.length > 0 ? (
              testimonials.map((testi) => (
                <div key={testi.id} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div className="flex mb-4 text-yellow-400">
                    {Array.from({ length: testi.rating || 5 }).map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6">"{testi.content}"</p>
                  <div className="flex items-center gap-4">
                    {testi.avatar_url ? (
                      <img src={testi.avatar_url} alt={testi.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg">
                        {testi.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900">{testi.name}</h4>
                      {testi.role && <p className="text-sm text-gray-500">{testi.role}</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                Belum ada ulasan.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="bg-green-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Butuh Bantuan atau Ingin Pesan Partai Besar?</h2>
          <p className="mb-8 text-green-100 text-lg">Hubungi tim kami via WhatsApp untuk mendapatkan penawaran khusus.</p>
          <Button size="lg" className="bg-white text-green-700 hover:bg-neutral-100">
            Hubungi via WhatsApp
          </Button>
        </div>
      </section>
    </div>
  );
}
