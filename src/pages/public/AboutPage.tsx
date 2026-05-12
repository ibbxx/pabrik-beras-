import { useSettings } from "@/hooks/useSettings";
import { Loader2, Target, Eye } from "lucide-react";

export default function AboutPage() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 max-w-6xl">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">Tentang Pabrik Beras Desa Kurma</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          {settings.about_intro || "Sejak 2010, kami telah berdedikasi untuk memproduksi beras berkualitas tinggi dengan harga yang kompetitif langsung dari pabrik penggilingan."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
        <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative">
          <img 
            src={settings.about_image_url || "https://images.unsplash.com/photo-1595054173874-54526d11f964?q=80&w=2074&auto=format&fit=crop"} 
            alt="Pabrik Kami" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Sejarah Kami</h2>
            <p className="text-gray-600 leading-relaxed">
              {settings.about_history || "Beras Desa Kurma diproses menggunakan mesin penggilingan padi (Rice Milling Unit) modern yang menjamin beras lebih bersih, putih alami tanpa pemutih, dan tidak mudah patah."}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                <Target size={20} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Visi</h3>
              <p className="text-sm text-gray-500">{settings.about_vision || "Menjadi produsen beras terpercaya skala nasional."}</p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mb-4">
                <Eye size={20} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Misi</h3>
              <p className="text-sm text-gray-500">{settings.about_mission || "Menjaga kualitas dan ketersediaan stok pangan."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
