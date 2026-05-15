import { useState, useEffect, useMemo } from "react";
import { Search, HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "../../components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";

export default function FAQPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from("faqs")
          .select("*")
          .eq("is_active", true)
          .order("order_num", { ascending: true });

        if (error) throw error;
        setFaqs(data || []);
      } catch (err) {
        console.error("Error fetching FAQs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    const lowerQuery = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) => 
        faq.question.toLowerCase().includes(lowerQuery) || 
        faq.answer.toLowerCase().includes(lowerQuery)
    );
  }, [faqs, searchQuery]);

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1F331E] text-white mb-6">
          <HelpCircle size={32} />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#1F331E] mb-4 uppercase tracking-widest leading-relaxed">Pusat Bantuan & FAQ</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Temukan jawaban cepat untuk pertanyaan-pertanyaan yang sering diajukan oleh pelanggan kami.
        </p>
        
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            className="w-full pl-12 h-14 rounded-full text-base bg-white border-neutral-200 shadow-sm focus-visible:ring-[#1F331E]" 
            placeholder="Cari pertanyaan Anda di sini..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-neutral-100">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-black" />
          </div>
        ) : filteredFaqs.length > 0 ? (
          <Accordion className="w-full space-y-4">
            {filteredFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={`item-${faq.id}`} className="border border-neutral-200 px-6 rounded-2xl bg-neutral-50/50 data-[state=open]:bg-white data-[state=open]:border-[#1F331E] data-[state=open]:shadow-sm transition-all">
                <AccordionTrigger className="text-left font-bold text-gray-900 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? "Tidak ada pertanyaan yang sesuai dengan pencarian Anda." : "Belum ada data FAQ."}
          </div>
        )}
      </div>

      <div className="mt-12 bg-[#1F331E] rounded-3xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Masih Butuh Bantuan?</h2>
        <p className="text-neutral-400 mb-6 max-w-lg mx-auto">
          Jika Anda tidak menemukan jawaban yang dicari, tim kami siap membantu Anda kapan saja.
        </p>
        <Button size="lg" className="bg-white text-black hover:bg-neutral-100 h-12 rounded-xl font-bold">
          Hubungi Admin Sekarang
        </Button>
      </div>
    </div>
  );
}
