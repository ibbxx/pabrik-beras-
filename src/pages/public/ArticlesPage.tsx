import { useState, useEffect } from "react";
import { Calendar, User, Loader2 } from "lucide-react";
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

  const openArticle = (article: any) => {
    setSelectedArticle(article);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-5xl font-black text-[#1F331E] mb-4 uppercase tracking-widest leading-relaxed">Berita</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Temukan tips bermanfaat, edukasi seputar beras, dan berita terbaru dari Pabrik Beras Desa Kurma.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 w-full">
          <Loader2 className="animate-spin h-10 w-10 text-[#1F331E]" />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article 
              key={article.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col hover:shadow-md transition-shadow group cursor-pointer"
              onClick={() => openArticle(article)}
            >
              <div className="relative h-60 overflow-hidden bg-neutral-100">
                {article.image_url ? (
                  <img 
                    src={article.image_url} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Tidak ada gambar</div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black text-black rounded-full uppercase tracking-widest">
                    Berita
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(article.published_at || article.created_at)}</span>
                  <span className="flex items-center gap-1"><User size={14} /> Admin Pabrik</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 leading-snug line-clamp-2">
                  {article.title}
                </h2>
                
                <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                  {article.excerpt || "Klik untuk membaca selengkapnya..."}
                </p>
                
                <span className="text-[#1F331E] font-bold text-sm inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Baca Selengkapnya →
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-neutral-100">
          Belum ada berita yang dipublikasikan saat ini.
        </div>
      )}
      
      <div className="mt-16 text-center">
        <Button variant="outline" size="lg" className="border-[#1F331E] text-[#1F331E] font-bold hover:bg-[#1F331E]/5 rounded-2xl px-10">
          Muat Lebih Banyak Berita
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-[2.5rem]">
          {selectedArticle && (
            <div className="flex flex-col">
              {selectedArticle.image_url ? (
                <div className="relative h-64 md:h-80 w-full overflow-hidden bg-neutral-100 rounded-t-[2.5rem]">
                  <img 
                    src={selectedArticle.image_url} 
                    alt={selectedArticle.title} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black text-black rounded-full uppercase tracking-widest">
                      Berita
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-20 bg-neutral-50 border-b border-neutral-100 flex items-center px-6 rounded-t-[2.5rem]">
                  <span className="bg-[#1F331E]/10 text-[#1F331E] px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest">
                    Berita
                  </span>
                </div>
              )}
              
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {formatDate(selectedArticle.published_at || selectedArticle.created_at)}</span>
                  <span className="flex items-center gap-1"><User size={14} /> Admin Pabrik</span>
                </div>
                
                <DialogTitle className="text-2xl md:text-3xl font-black text-gray-900 mb-6 leading-tight">
                  {selectedArticle.title}
                </DialogTitle>
                
                <DialogDescription className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-line text-left block">
                  {selectedArticle.content}
                </DialogDescription>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
