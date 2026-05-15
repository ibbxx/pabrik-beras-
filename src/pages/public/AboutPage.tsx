import { useSettings } from "@/hooks/useSettings";
import { Loader2, Target, Eye } from "lucide-react";
import { CircularImageCarousel } from "@/components/ui/circular-image-carousel";

export default function AboutPage() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  const rawIntro = settings.about_intro || "Mapailli adalah pabrik beras yang berlokasi di Dusun Paredeang, Desa Kurma, Kecamatan Mapilli, Polewali Mandar.\n\nSudah berdiri sejak tahun 1987, fokus kami menyediakan beras segar yang diambil langsung dari petani lokal. Sebagai satu-satunya tempat giling padi di Desa Kurma, kami selalu memastikan setiap butir beras diproses dengan bersih dan dijemur alami di bawah matahari supaya kualitasnya tetap terjaga.\n\nKami selalu memegang teguh kejujuran dalam timbangan dan pelayanan yang cepat, jadi Anda bisa mendapatkan beras lokal yang pulen dan sehat untuk keluarga dengan harga yang jujur dan terpercaya.";

  // Parse text intro menjadi beberapa paragraf agar mudah dibaca
  const introParagraphs = rawIntro.split('\n').filter(p => p.trim() !== '');
  const leadParagraph = introParagraphs.length > 0 ? introParagraphs[0] : "";
  const remainingParagraphs = introParagraphs.slice(1);

  return (
    <div className="min-h-screen bg-white pb-10">
      
      {/* SECTION 1: HERO & INTRO */}
      <section className="container mx-auto pt-16 pb-12 md:pt-24 md:pb-20 px-4 max-w-5xl">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
            Tentang Pabrik Beras<br className="hidden md:block" /> Desa Kurma
          </h1>
        </div>
        
        <div className="space-y-8 md:space-y-12">
          {leadParagraph && (
            <p className="text-xl md:text-2xl text-gray-900 leading-relaxed font-medium text-center max-w-4xl mx-auto">
              {leadParagraph}
            </p>
          )}
          
          {remainingParagraphs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6 md:gap-12 mt-8 text-base md:text-lg text-gray-600 leading-loose">
              <div className="space-y-6">
                  {remainingParagraphs.slice(0, Math.ceil(remainingParagraphs.length / 2)).map((p, i) => (
                    <p key={`left-${i}`}>{p}</p>
                  ))}
              </div>
              <div className="space-y-6">
                  {remainingParagraphs.slice(Math.ceil(remainingParagraphs.length / 2)).map((p, i) => (
                    <p key={`right-${i}`}>{p}</p>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: VISI & MISI (Dark Section) */}
      <section className="bg-black text-white py-16 md:py-24 w-full">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            {/* Visi */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left group">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300">
                <Target size={32} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Visi Kami</h2>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                {settings.about_vision || "Menjadi produsen beras terpercaya skala nasional."}
              </p>
            </div>
            
            {/* Misi */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left group">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300">
                <Eye size={32} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Misi Kami</h2>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                {settings.about_mission || "Menjaga kualitas dan ketersediaan stok pangan."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SEJARAH & GALLERY */}
      <section className="container mx-auto py-16 md:py-24 px-4 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          
          <div className="order-2 lg:order-1 space-y-6 md:space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6">Sejarah Kami</h2>
              <div className="w-20 h-1.5 bg-black rounded-full"></div>
            </div>
            <p className="text-base md:text-lg text-gray-600 leading-loose whitespace-pre-line">
              {settings.about_history || "Berdiri sejak 1987, Pabrik Beras Mapailli telah menjadi mitra setia petani di Desa Kurma.\n\nMelalui perjalanan lebih dari tiga dekade, kami terus mempertahankan metode tradisional penjemuran alami di bawah sinar matahari sekaligus meningkatkan kualitas pelayanan. Dedikasi kami terhadap kualitas dan transparansi menjadikan kami satu-satunya pilihan terpercaya di wilayah Mapilli."}
            </p>
          </div>

          <div className="order-1 lg:order-2 w-full max-w-[320px] md:max-w-[450px] lg:max-w-none mx-auto relative bg-transparent flex items-center justify-center">
            {(() => {
              let urls = Array.isArray(settings.about_image_url)
                ? settings.about_image_url
                : settings.about_image_url
                ? [settings.about_image_url]
                : [];

              if (urls.length === 0) {
                urls = [
                  "/images/about/about-1.jpeg",
                  "/images/about/about-2.jpeg",
                  "/images/about/about-3.jpeg",
                ];
              }

              return <CircularImageCarousel images={urls} />;
            })()}
          </div>

        </div>
      </section>

    </div>
  );
}
