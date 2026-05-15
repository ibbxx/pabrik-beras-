import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { renderGreenMarkup } from "@/lib/content";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const { settings, loading: settingsLoading } = useSettings();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = settings.hero_slides || [];
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (hasSlides) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [hasSlides, slides.length]);

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
      <section className="relative min-h-[calc(100vh-80px)] lg:min-h-[calc(100vh-80px)] flex items-center bg-white overflow-hidden py-4 lg:py-0">
        {/* Background Decorative Element */}
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-depths/5 rounded-full blur-3xl opacity-50 -z-0" />

        <div className="container relative z-10 mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">

            {/* Left: Text Content */}
            <div className="order-2 lg:order-1 space-y-4 lg:space-y-8 flex flex-col items-start text-left animate-fade-in-up">
              <div className="space-y-3 lg:space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-depths/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-depths">
                  <CheckCircle2 size={12} className="text-emerald-depths" />
                  {settings.hero_badge || "Langsung dari Penggilingan"}
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-[1.1] lg:leading-[1.05] tracking-tight text-foreground">
                  {settings.hero_headline ? (
                    <span dangerouslySetInnerHTML={{ __html: renderGreenMarkup(settings.hero_headline).replace(/text-green-500/g, 'text-primary underline decoration-dust-grey underline-offset-[8px] lg:underline-offset-[12px]') }} />
                  ) : (
                    <>Beras Premium <br /> <span className="text-dark-khaki">Desa Kurma</span></>
                  )}
                </h1>
                <p className="text-xs sm:text-sm md:text-xl text-muted-foreground max-w-md lg:max-w-lg leading-relaxed font-medium">
                  {settings.hero_subheadline || "Menghadirkan beras kualitas terbaik langsung dari penggilingan. Segar, pulen, dan tanpa bahan pengawet."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Link to={hasSlides ? slides[currentSlide].cta_link || "/products" : "/products"} className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 lg:h-16 px-8 lg:px-10 w-full rounded-2xl lg:rounded-[2rem] bg-primary hover:bg-evergreen text-primary-foreground font-black shadow-xl lg:shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 active:scale-95 group">
                    <ShoppingBag className="mr-2 h-4 w-4 lg:h-5 lg:w-5 transition-transform group-hover:rotate-12" /> 
                    {hasSlides && slides[currentSlide].cta_text ? slides[currentSlide].cta_text : (settings.hero_cta_text || "Belanja Sekarang")}
                  </Button>
                </Link>
                <Link to="/contact" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-12 lg:h-16 px-8 lg:px-10 w-full rounded-2xl lg:rounded-[2rem] text-foreground font-black border-2 border-dust-grey hover:bg-dust-grey/10 transition-all hover:-translate-y-1">
                    Hubungi Kami
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-6 lg:pt-8 border-t border-dust-grey w-full">
                {[
                  { label: settings.trust_1 || "Tanpa Pemutih", icon: "✓" },
                  { label: settings.trust_2 || "Harga Pabrik", icon: "✓" },
                  { label: settings.trust_3 || "Kirim Cepat", icon: "✓" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground text-[9px] lg:text-[11px] font-black uppercase tracking-widest">
                    <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-md lg:rounded-lg bg-dust-grey/20 text-foreground flex items-center justify-center font-black">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Slide Image */}
            <div className="order-1 lg:order-2 relative animate-fade-in flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[240px] sm:max-w-md lg:max-w-2xl aspect-[4/5] lg:aspect-square flex items-center justify-center overflow-hidden rounded-[2rem] lg:rounded-[3rem]">
                {hasSlides ? (
                  <div className="relative w-full h-full">
                    {slides.map((slide: any, index: number) => (
                      <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-out flex items-center justify-center ${index === currentSlide ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-20 scale-90 pointer-events-none'}`}
                      >
                        <img
                          src={slide.image_url}
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                        />
                      </div>
                    ))}

                    {/* Progress Dots */}
                    <div className="absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 lg:gap-2 z-20">
                      {slides.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={`h-1 lg:h-2 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-6 lg:w-8 bg-primary' : 'w-1 lg:w-2 bg-dust-grey hover:bg-dust-grey/50'}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : settings.hero_image_url ? (
                  <img
                    src={settings.hero_image_url}
                    alt="Organic Rice"
                    className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                  />
                ) : (
                  <div className="w-full h-full bg-dust-grey/10 flex flex-col items-center justify-center gap-4">
                    <ShoppingBag size={80} className="text-dust-grey/30" />
                    <span className="text-xs font-black uppercase tracking-widest text-dust-grey/50">Pabrik Beras Desa Kurma</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-10 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground uppercase tracking-tight">{settings.benefit_title || "Mengapa Memilih Kami?"}</h2>
            <p className="mt-2 text-xs lg:text-base text-muted-foreground font-medium uppercase tracking-widest">{settings.benefit_subtitle || "Keunggulan Pabrik Desa Kurma"}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: settings.benefit_1_title || "Kualitas Terjamin", desc: settings.benefit_1_desc || "Diproses dengan mesin modern menghasilkan beras putih, bersih, dan pulen." },
              { title: settings.benefit_2_title || "Harga Tangan Pertama", desc: settings.benefit_2_desc || "Langsung dari pabrik penggilingan sehingga harga lebih hemat untuk Anda." },
              { title: settings.benefit_3_title || "Pasokan Stabil", desc: settings.benefit_3_desc || "Kapasitas produksi besar memastikan ketersediaan stok sepanjang tahun." }
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center p-5 lg:p-6 bg-dust-grey/10 rounded-[1.5rem] lg:rounded-2xl border border-dust-grey/20 transition-all hover:bg-dust-grey/20">
                <div className="mb-3 lg:mb-4 flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle2 size={24} className="lg:hidden" />
                  <CheckCircle2 size={32} className="hidden lg:block" />
                </div>
                <h3 className="mb-1 lg:mb-2 text-base lg:text-xl font-black text-foreground">{benefit.title}</h3>
                <p className="text-[10px] lg:text-base text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="py-10 lg:py-24 bg-dust-grey/10">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-6 lg:mb-8">
            <div className="text-left">
              <h2 className="text-2xl lg:text-3xl font-black text-foreground uppercase tracking-tight">Produk Unggulan</h2>
              <p className="mt-1 text-[10px] lg:text-base text-muted-foreground font-medium uppercase tracking-widest">Favorit Pelanggan</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center text-primary hover:opacity-70 font-bold uppercase tracking-widest text-xs">
              Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-4">
            {loading ? (
              // Skeleton loading
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="group rounded-2xl bg-background p-4 shadow-sm border border-dust-grey/20">
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
                <div key={product.id} className="group flex flex-col bg-background p-2.5 lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 border border-dust-grey/20">
                  <Link to={`/products/${product.slug}`}>
                    <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-neutral-100 relative">
                      {product.main_image_url ? (
                        <img src={product.main_image_url} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="h-full w-full bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm">Tidak Ada Gambar</div>
                      )}
                    </div>
                  </Link>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-black uppercase tracking-wider">Premium</span>
                    <span className="text-xs text-gray-500">Stok: {product.stock > 0 ? 'Tersedia' : 'Habis'}</span>
                  </div>
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="font-black text-xs lg:text-xl text-foreground mb-0.5 lg:mb-1 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  </Link>
                  <p className="text-muted-foreground text-[9px] lg:text-sm mb-2 lg:mb-4">Kemasan {product.weight_kg ? `${product.weight_kg}kg` : product.unit}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-xs lg:text-xl text-primary">Rp {product.price.toLocaleString('id-ID')}</span>
                    <Button size="sm" className="bg-primary hover:bg-evergreen rounded-full h-6 w-6 lg:h-10 lg:w-10 p-0 shadow-lg shadow-primary/10" disabled={product.stock <= 0}>
                      <ShoppingBag className="h-3 w-3 lg:h-4 lg:w-4" />
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
              <Button variant="outline" className="w-full border-primary text-primary font-black rounded-2xl">
                Lihat Semua Katalog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-10 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-black text-foreground uppercase tracking-tight">Testimoni</h2>
            <p className="mt-2 text-[10px] lg:text-base text-muted-foreground font-medium uppercase tracking-widest">Ulasan Pelanggan Setia</p>
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
                <div key={testi.id} className="p-6 lg:p-8 bg-dust-grey/10 rounded-[1.5rem] lg:rounded-[2.5rem] border border-dust-grey/20 relative">
                  <div className="flex mb-3 lg:mb-4 text-dark-khaki">
                    {Array.from({ length: testi.rating || 5 }).map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-foreground italic mb-6 lg:mb-8 text-sm lg:text-lg font-medium leading-relaxed">"{testi.content}"</p>
                  <div className="flex items-center gap-4">
                    {testi.avatar_url ? (
                      <img src={testi.avatar_url} alt={testi.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black lg:text-xl">
                        {testi.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-foreground lg:text-lg">{testi.name}</h4>
                      {testi.role && <p className="text-[9px] lg:text-sm text-dark-khaki font-black uppercase tracking-widest">{testi.role}</p>}
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
      <section className="bg-primary py-12 lg:py-24 text-primary-foreground relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-evergreen/20 rounded-full blur-3xl -z-0" />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="mb-4 lg:mb-6 text-2xl lg:text-6xl font-black tracking-tight uppercase">Butuh Bantuan?</h2>
          <p className="mb-8 lg:mb-10 text-primary-foreground/80 text-xs lg:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">Pemesanan partai besar atau konsultasi produk, tim kami siap melayani Anda via WhatsApp.</p>
          <Button size="lg" className="bg-background text-foreground hover:bg-dust-grey font-black px-8 lg:px-12 h-12 lg:h-16 rounded-xl lg:rounded-[2rem] text-sm lg:text-lg shadow-xl lg:shadow-2xl shadow-black/20 transition-all hover:-translate-y-1">
            Hubungi via WhatsApp
          </Button>
        </div>
      </section>
    </div>
  );
}
