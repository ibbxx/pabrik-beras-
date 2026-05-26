import { useState, useEffect } from "react";
import { Calendar, User, Loader2, Clock, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("is_active", true)
          .order("published_at", { ascending: false });

        if (error) throw error;
        setArticles(data || []);
      } catch (err) {
        console.error("Error fetching articles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tanggal tidak diketahui";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper logic to map articles to categories dynamically based on their slug or title
  const getCategory = (article: any) => {
    const slug = (article.slug || "").toLowerCase();
    const title = (article.title || "").toLowerCase();
    if (slug.includes("tips") || slug.includes("cara") || title.includes("tips") || title.includes("cara")) {
      return "Tips & Trik";
    }
    if (slug.includes("mitra") || slug.includes("kemitraan") || title.includes("mitra") || title.includes("kemitraan")) {
      return "Kemitraan";
    }
    if (slug.includes("tani") || slug.includes("pertanian") || title.includes("tani") || title.includes("pertanian")) {
      return "Info Tani";
    }
    return "Edukasi";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Tips & Trik":
        return "bg-amber-50 text-amber-800 border-amber-200/50";
      case "Kemitraan":
        return "bg-blue-50 text-blue-800 border-blue-200/50";
      case "Info Tani":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/50";
      default:
        return "bg-purple-50 text-purple-800 border-purple-200/50";
    }
  };

  const calculateReadingTime = (content: string = "") => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / wordsPerMinute));
  };

  const openArticle = (article: any) => {
    setSelectedArticle(article);
    setIsDialogOpen(true);
  };

  // Fetch related articles (excluding the current opened one)
  const getRelatedArticles = (currentArticle: any) => {
    const category = getCategory(currentArticle);
    return articles
      .filter((a) => a.id !== currentArticle.id && getCategory(a) === category)
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      {/* Reverted Plain Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-black text-[#1F331E] mb-4 uppercase tracking-widest leading-relaxed">Berita</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Temukan tips bermanfaat, edukasi seputar beras, dan berita terbaru dari Pabrik Beras Desa Kurma.
        </p>
      </div>

      {/* Grid of Articles */}
      {loading ? (
        <div className="flex justify-center items-center py-20 w-full">
          <Loader2 className="animate-spin h-10 w-10 text-[#1F331E]" />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => {
            const category = getCategory(article);
            const readTime = calculateReadingTime(article.content);
            return (
              <article 
                key={article.id} 
                className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl border border-neutral-100 flex flex-col transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer"
                onClick={() => openArticle(article)}
              >
                {/* Body Content */}
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Category Tag (Placed inside card body now since images are removed) */}
                  <div className="mb-4">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-4 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(article.published_at || article.created_at)}</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {readTime} mnt baca</span>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-snug line-clamp-2 group-hover:text-[#1F331E] transition-colors">
                    {article.title}
                  </h2>
                  
                  {/* Excerpt (Justified text-justify) */}
                  <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed text-justify">
                    {article.excerpt || "Klik untuk membaca pembahasan lengkap tentang berita ini..."}
                  </p>
                  
                  {/* Footer Action */}
                  <div className="pt-4 border-t border-neutral-50 flex items-center justify-between">
                    <span className="text-[#1F331E] text-xs font-black uppercase tracking-widest inline-flex items-center gap-1">
                      Baca Berita <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold">Admin</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-neutral-100">
          Belum ada berita yang dipublikasikan saat ini.
        </div>
      )}
      
      {/* Pagination / Load More */}
      {articles.length > 0 && (
        <div className="mt-16 text-center">
          <Button variant="outline" size="lg" className="border-[#1F331E] text-[#1F331E] font-bold hover:bg-[#1F331E]/5 rounded-2xl px-12 transition-all hover:scale-102">
            Muat Lebih Banyak Berita
          </Button>
        </div>
      )}

      {/* Premium Detail Article Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-[2.5rem] border border-neutral-100 bg-white shadow-2xl">
          {selectedArticle && (
            <div className="flex flex-col">
              {/* Category Tag Header (Clean text header instead of image banner) */}
              <div className="p-6 md:p-8 pb-0 flex items-center rounded-t-[2.5rem]">
                <span className={`px-3 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${getCategoryColor(getCategory(selectedArticle))}`}>
                  {getCategory(selectedArticle)}
                </span>
              </div>
              
              {/* Content Body */}
              <div className="p-6 md:p-8 pt-4 flex-1">
                {/* Meta Details */}
                <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-4 font-bold">
                  <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(selectedArticle.published_at || selectedArticle.created_at)}</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {calculateReadingTime(selectedArticle.content)} menit membaca</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><User size={13} /> Admin</span>
                </div>
                
                {/* News Title */}
                <DialogTitle className="text-2xl md:text-3xl font-black text-gray-900 mb-6 leading-tight text-left">
                  {selectedArticle.title}
                </DialogTitle>
                
                {/* Main Article Content (Justified text-justify) */}
                <DialogDescription className="text-gray-800 text-sm md:text-base leading-relaxed whitespace-pre-line text-justify block border-b border-neutral-100 pb-10 mb-8 font-normal">
                  {selectedArticle.content}
                </DialogDescription>

                {/* Related Recommendations inside Pop-up */}
                {getRelatedArticles(selectedArticle).length > 0 && (
                  <div className="text-left">
                    <h4 className="font-black text-[#1F331E] uppercase tracking-widest text-xs mb-4">
                      Rekomendasi Berita Lainnya
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {getRelatedArticles(selectedArticle).map((related) => (
                        <div 
                          key={related.id} 
                          onClick={() => setSelectedArticle(related)}
                          className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 hover:bg-[#1F331E]/2 hover:border-[#1F331E]/10 cursor-pointer transition-all flex flex-col justify-between"
                        >
                          <h5 className="font-bold text-gray-900 text-sm line-clamp-2 mb-2 hover:text-[#1F331E]">
                            {related.title}
                          </h5>
                          <span className="text-[10px] text-gray-500 font-bold block">
                            {formatDate(related.published_at || related.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
