import { useState, useEffect } from "react";
import { Calendar, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Artikel & Berita</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Temukan tips bermanfaat, edukasi seputar beras, dan berita terbaru dari Pabrik Beras Desa Kurma.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 w-full">
          <Loader2 className="animate-spin h-10 w-10 text-black" />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex flex-col hover:shadow-md transition-shadow">
              <div className="relative h-60 overflow-hidden bg-neutral-100">
                {article.image_url ? (
                  <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">Tidak ada gambar</div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black text-black rounded-full uppercase tracking-widest">
                    Artikel
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
                  {article.excerpt || "Baca selengkapnya untuk melihat isi artikel ini."}
                </p>
                
                <Button variant="ghost" className="text-black font-bold hover:bg-neutral-50 justify-start px-0 group">
                  Baca Selengkapnya <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-white rounded-3xl border border-neutral-100">
          Belum ada artikel yang dipublikasikan saat ini.
        </div>
      )}
      
      <div className="mt-16 text-center">
        <Button variant="outline" size="lg" className="border-black text-black font-bold hover:bg-neutral-50 rounded-2xl px-10">
          Muat Lebih Banyak Artikel
        </Button>
      </div>
    </div>
  );
}
