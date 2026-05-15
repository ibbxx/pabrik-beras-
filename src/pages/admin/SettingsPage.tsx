import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  FileText,
  Star,
  Layout,
  Globe,
  Phone,
  Save,
  Info,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { createImageStoragePath, validateImageFile, compressImageFile } from "@/lib/media";

// ── Types ──
type FAQ = { id: string; question: string; answer: string; order_num: number | null; is_active: boolean | null; };
type Article = { id: string; title: string; slug: string; content: string; excerpt: string | null; image_url: string | null; is_active: boolean | null; published_at: string | null; created_at: string; };
type Testimonial = { id: string; name: string; role: string | null; content: string; rating: number | null; is_active: boolean | null; };
type SiteSetting = { id: string; key: string; value: any; description: string | null; };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("faq");
  const [loading, setLoading] = useState(true);

  // Data
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [, setSiteSettings] = useState<SiteSetting[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Dynamic Settings Map
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});

  // Drag and drop refs
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  // Track which data categories have already been loaded to avoid overwriting
  // unsaved edits when switching between tabs.
  const loadedRef = useRef<Set<string>>(new Set());

  // Force a re-fetch for the current tab (used after save/delete)
  const forceRefetchCurrentTab = useCallback(() => {
    const settingsTabs = ["appearance", "business", "seo"];
    if (settingsTabs.includes(activeTab)) {
      loadedRef.current.delete("site_settings");
    } else {
      loadedRef.current.delete(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    // For settings-type tabs, reuse already-loaded data to preserve edits
    const settingsTabs = ["appearance", "business", "seo"];
    const isSettingsTab = settingsTabs.includes(activeTab);
    if (isSettingsTab && loadedRef.current.has("site_settings")) {
      // Data sudah dimuat sebelumnya, jangan timpa settingsMap
      return;
    }
    if (!isSettingsTab && loadedRef.current.has(activeTab)) {
      return;
    }

    setLoading(true);
    try {
      if (activeTab === "faq") {
        const { data, error } = await supabase.from("faqs").select("*").order("order_num");
        if (error) throw error;
        setFaqs(data || []);
        loadedRef.current.add(activeTab);
      } else if (activeTab === "articles") {
        const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setArticles(data || []);
        loadedRef.current.add(activeTab);
      } else if (activeTab === "testimonials") {
        const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setTestimonials(data || []);
        loadedRef.current.add(activeTab);
      } else if (isSettingsTab) {
        const { data, error } = await supabase.from("site_settings").select("*").order("key");
        if (error) throw error;
        setSiteSettings(data || []);
        const map: Record<string, any> = {};
        (data || []).forEach((s: SiteSetting) => {
          let val = s.value;
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { val = JSON.parse(val); } catch (e) {}
          }
          map[s.key] = val;
        });
        setSettingsMap(map);
        loadedRef.current.add("site_settings");
      }
    } catch (err: any) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries((formData as any).entries());

    // Handle checkboxes
    const checkInputs = e.currentTarget.querySelectorAll('input[type="checkbox"]');
    checkInputs.forEach((input: any) => { data[input.id] = input.checked; });

    try {
      let table = "";
      if (activeTab === "faq") table = "faqs";
      else if (activeTab === "articles") table = "articles";
      else if (activeTab === "testimonials") table = "testimonials";

      if (editingItem) {
        const { error } = await (supabase.from(table as any) as any).update(data).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Updated successfully");
      } else {
        const { error } = await (supabase.from(table as any) as any).insert([data]);
        if (error) throw error;
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      forceRefetchCurrentTab();
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      let table = "";
      if (activeTab === "faq") table = "faqs";
      else if (activeTab === "articles") table = "articles";
      else if (activeTab === "testimonials") table = "testimonials";

      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted successfully");
      forceRefetchCurrentTab();
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const saveSettings = async (keys: string[]) => {
    setIsSaving(true);
    try {
      for (const key of keys) {
        const newValue = settingsMap[key];
        if (newValue !== undefined) {
          let valueToSave = newValue;
          if (typeof newValue === 'object' && newValue !== null) {
            valueToSave = JSON.stringify(newValue);
          }
          const { error } = await (supabase as any).from("site_settings").upsert({ key, value: valueToSave }, { onConflict: 'key' });
          if (error) throw error;
        }
      }
      toast.success("Settings updated successfully!");
      // Don't re-fetch after saving settings — we already have the latest data in state
    } catch (err: any) { toast.error(err.message); } finally { setIsSaving(false); }
  };

  const handleImageUpload = async (key: string, file: File) => {
    setIsSaving(true);
    const toastId = toast.loading("Mengunggah dan mengompresi gambar...");
    try {
      const compressedFile = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });

      const validationError = validateImageFile(compressedFile, { maxSizeMB: 2 });
      if (validationError) {
        toast.error(validationError, { id: toastId });
        setIsSaving(false);
        return;
      }

      const filePath = createImageStoragePath(`settings/${key}`, compressedFile);

      const { error: uploadError } = await supabase.storage
        .from('product_images') // Using existing bucket for simplicity, or we can use another one
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      setSettingsMap(prev => ({ ...prev, [key]: publicUrl }));
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingField = (key: string, label: string, type: "text" | "textarea" | "number" | "image" | "images" = "text", description?: string) => (
    <div key={key} className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</Label>
        {description && (
          <div className="group relative">
            <Info size={12} className="text-gray-300 cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {description}
            </div>
          </div>
        )}
      </div>
      {type === "textarea" ? (
        <Textarea
          value={settingsMap[key] || ""}
          onChange={(e) => setSettingsMap({ ...settingsMap, [key]: e.target.value })}
          className="min-h-[100px] rounded-xl border-gray-100 focus:border-black transition-all resize-none p-4 text-sm"
        />
      ) : type === "image" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
              {settingsMap[key] ? (
                <img src={settingsMap[key]} alt={label} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-200" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="text"
                placeholder="Image URL"
                value={settingsMap[key] || ""}
                onChange={(e) => setSettingsMap({ ...settingsMap, [key]: e.target.value })}
                className="h-10 rounded-xl border-gray-100 focus:border-black transition-all px-4 text-xs"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-gray-100 flex-1 gap-2 text-xs font-bold"
                  onClick={() => document.getElementById(`file-${key}`)?.click()}
                  disabled={isSaving}
                >
                  <Upload size={14} /> Upload Image
                </Button>
                {settingsMap[key] && (
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl shrink-0" onClick={() => setSettingsMap({ ...settingsMap, [key]: "" })}>
                    <Trash2 size={16} />
                  </Button>
                )}
                <input
                  type="file"
                  id={`file-${key}`}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleImageUpload(key, e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : type === "images" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {(Array.isArray(settingsMap[key]) ? settingsMap[key] : (settingsMap[key] ? [settingsMap[key]] : [])).map((url: string, index: number) => (
              <div key={index} className="w-24 h-24 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm relative group flex items-center justify-center shrink-0">
                <img src={url} alt={`${label} ${index + 1}`} className="w-full h-full object-cover" />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                  onClick={() => {
                    const newUrls = (Array.isArray(settingsMap[key]) ? [...settingsMap[key]] : [settingsMap[key]]).filter((_, i) => i !== index);
                    setSettingsMap({ ...settingsMap, [key]: newUrls });
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
            <div className="flex-1 space-y-2 flex flex-col justify-center min-w-[200px]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-gray-100 flex-1 gap-2 text-xs font-bold"
                  onClick={() => document.getElementById(`file-${key}`)?.click()}
                  disabled={isSaving}
                >
                  <Upload size={14} /> Upload Images
                </Button>
                <input
                  type="file"
                  id={`file-${key}`}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setIsSaving(true);
                      const currentUrls = Array.isArray(settingsMap[key]) ? [...settingsMap[key]] : (settingsMap[key] ? [settingsMap[key]] : []);
                      const toastId = toast.loading("Mengunggah dan mengompresi gambar...");
                      try {
                        for (let i = 0; i < e.target.files.length; i++) {
                          const file = e.target.files[i];
                          const compressedFile = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
                          const validationError = validateImageFile(compressedFile, { maxSizeMB: 2 });
                          if (validationError) {
                            toast.error(`File ${file.name}: ${validationError}`, { id: toastId });
                            continue;
                          }
                          const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
                          const filePath = createImageStoragePath(`settings/${key}_${uniqueId}`, compressedFile);
                          const { error: uploadError } = await supabase.storage.from('product_images').upload(filePath, compressedFile);
                          if (uploadError) throw uploadError;
                          const { data: { publicUrl } } = supabase.storage.from('product_images').getPublicUrl(filePath);
                          currentUrls.push(publicUrl);
                        }
                        setSettingsMap({ ...settingsMap, [key]: currentUrls });
                        toast.success("Images uploaded successfully!", { id: toastId });
                      } catch (err: any) {
                        toast.error("Upload failed: " + err.message, { id: toastId });
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Input
          type={type}
          value={settingsMap[key] || ""}
          onChange={(e) => setSettingsMap({ ...settingsMap, [key]: e.target.value })}
          className="h-12 rounded-xl border-gray-100 focus:border-black transition-all px-4"
        />
      )}
    </div>
  );

  const sidebarItems = [
    { id: 'faq', icon: MessageSquare, label: 'FAQ', desc: 'Kelola pertanyaan umum pelanggan' },
    { id: 'articles', icon: FileText, label: 'Artikel', desc: 'Publikasi berita & edukasi produk' },
    { id: 'testimonials', icon: Star, label: 'Testimoni', desc: 'Tampilkan ulasan pelanggan' },
    { id: 'appearance', icon: Layout, label: 'Tampilan', desc: 'Hero, profil & benefit website' },
    { id: 'business', icon: Phone, label: 'Bisnis', desc: 'Kontak, pembayaran & layanan' },
    { id: 'seo', icon: Globe, label: 'SEO', desc: 'Optimasi mesin pencari' },
  ];


  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-black">Pengaturan</h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Kelola konten, tampilan & konfigurasi website</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full gap-5">
        {/* Sidebar */}
        <div className="w-full md:w-56 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-2 md:sticky md:top-6 space-y-1">
            {sidebarItems.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    active ? "bg-black text-white shadow-md shadow-black/10" : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  <Icon size={16} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{tab.label}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${active ? "text-white/60" : "text-gray-400"}`}>{tab.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="space-y-6">

            {/* ── FAQ TAB ── */}
            {activeTab === "faq" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Pertanyaan Umum (FAQ)</h2>
                  <p className="text-sm text-gray-500">Kelola konten bantuan untuk pelanggan Anda.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="h-11 w-full rounded-xl bg-black px-6 font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-gray-800 sm:w-auto">
                  <Plus size={18} className="mr-2" /> Tambah Pertanyaan
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : faqs.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Belum ada FAQ</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate">{faq.question}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{faq.answer}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-300 shrink-0">#{faq.order_num || '-'}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${faq.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {faq.is_active ? 'Aktif' : 'Hidden'}
                      </span>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenModal(faq)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(faq.id)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* ── ARTICLES TAB ── */}
            {activeTab === "articles" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Berita & Artikel</h2>
                  <p className="text-sm text-gray-500">Publikasikan pembaruan dan edukasi tentang produk Anda.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="h-11 w-full rounded-xl bg-black px-6 font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-gray-800 sm:w-auto">
                  <Plus size={18} className="mr-2" /> Artikel Baru
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : articles.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Belum ada artikel</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {articles.map((art) => (
                    <div key={art.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate">{art.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{art.excerpt || art.slug}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${art.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {art.is_active ? 'Publik' : 'Draft'}
                      </span>
                      <span className="text-[10px] text-gray-300 font-medium hidden sm:block">{art.published_at ? new Date(art.published_at).toLocaleDateString('id-ID') : '-'}</span>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenModal(art)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(art.id)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {activeTab === "testimonials" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">Testimoni Pelanggan</h2>
                  <p className="text-sm text-gray-500">Tampilkan ulasan positif dari pelanggan setia Anda.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="h-11 w-full rounded-xl bg-black px-6 font-bold text-white shadow-lg shadow-black/10 transition-all hover:bg-gray-800 sm:w-auto">
                  <Plus size={18} className="mr-2" /> Tambah Ulasan
                </Button>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
              ) : testimonials.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <Star className="w-8 h-8 text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Belum ada testimoni</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {testimonials.map((testi) => (
                    <div key={testi.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                        <span className="text-xs font-black">{testi.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black">{testi.name}</p>
                        <p className="text-[10px] text-gray-400">{testi.role || 'Pelanggan'}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold">{testi.rating || 5}</span>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${testi.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {testi.is_active ? 'Terlihat' : 'Hidden'}
                      </span>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenModal(testi)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(testi.id)}><Trash2 size={14} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {activeTab === "appearance" && (
            <div className="space-y-5">
              <Tabs defaultValue="hero_section" className="w-full">
                <Card className="border border-gray-100 shadow-sm rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2"><Layout size={20} /> Pengaturan Tampilan</CardTitle>
                      <CardDescription>Sesuaikan konten visual di halaman beranda Anda.</CardDescription>
                    </div>
                    <TabsList className="bg-gray-100/80 p-1 rounded-xl h-auto self-start md:self-center">
                      <TabsTrigger value="hero_section" className="px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Hero</TabsTrigger>
                      <TabsTrigger value="profile_section" className="px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Profil</TabsTrigger>
                      <TabsTrigger value="benefits_section" className="px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Keunggulan</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="p-8">
                    <TabsContent value="hero_section" className="mt-0 outline-none space-y-6">
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          {renderSettingField("hero_badge", "Teks Badge Kecil")}
                          {renderSettingField("hero_headline", "Headline Utama", "textarea")}
                          {renderSettingField("hero_subheadline", "Sub-headline", "textarea")}
                        </div>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between pt-0 border-t-0 border-gray-50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slide Carousel (Geser untuk mengurutkan)</p>
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm" 
                              className="h-8 rounded-lg text-[10px] font-black uppercase"
                              onClick={() => {
                                const currentSlides = Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [];
                                setSettingsMap({
                                  ...settingsMap,
                                  "hero_slides": [...currentSlides, { image_url: "", cta_text: "", cta_link: "" }]
                                });
                              }}
                            >
                              <Plus size={14} className="mr-1" /> Tambah Slide
                            </Button>
                          </div>

                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {(!settingsMap["hero_slides"] || settingsMap["hero_slides"].length === 0) && (
                              <div className="p-4 rounded-2xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                                <p className="text-xs text-gray-400">Belum ada slide tambahan. Klik "Tambah Slide".</p>
                              </div>
                            )}

                            {(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : []).map((slide: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-4 relative group/slide cursor-move active:cursor-grabbing hover:border-gray-300 transition-colors"
                                draggable
                                onDragStart={() => (dragItemRef.current = index)}
                                onDragEnter={() => (dragOverItemRef.current = index)}
                                onDragEnd={() => {
                                  if (dragItemRef.current !== null && dragOverItemRef.current !== null && dragItemRef.current !== dragOverItemRef.current) {
                                    const currentSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                    const draggedItemContent = currentSlides.splice(dragItemRef.current, 1)[0];
                                    currentSlides.splice(dragOverItemRef.current, 0, draggedItemContent);
                                    setSettingsMap({ ...settingsMap, "hero_slides": currentSlides });
                                  }
                                  dragItemRef.current = null;
                                  dragOverItemRef.current = null;
                                }}
                                onDragOver={(e) => e.preventDefault()}
                              >
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute top-2 right-2 h-8 w-8 text-gray-300 hover:text-red-500 rounded-lg"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const newSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                    const slideToDelete = newSlides[index];
                                    
                                    // Delete from Supabase Storage
                                    if (slideToDelete.image_url) {
                                      try {
                                        const urlObj = new URL(slideToDelete.image_url);
                                        const bucketPath = urlObj.pathname.split('/product_images/')[1];
                                        if (bucketPath) {
                                          await supabase.storage.from('product_images').remove([bucketPath]);
                                        }
                                      } catch (err) {
                                        console.error("Failed to delete from storage:", err);
                                      }
                                    }
                                    
                                    newSlides.splice(index, 1);
                                    setSettingsMap({ ...settingsMap, "hero_slides": newSlides });
                                  }}
                                >
                                  <Trash2 size={14} />
                                </Button>

                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
                                      {slide.image_url ? (
                                        <img src={slide.image_url} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                                      ) : (
                                        <ImageIcon className="h-6 w-6 text-gray-200" />
                                      )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        placeholder="Image URL"
                                        value={slide.image_url || ""}
                                        onChange={(e) => {
                                          const newSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                          newSlides[index].image_url = e.target.value;
                                          setSettingsMap({ ...settingsMap, "hero_slides": newSlides });
                                        }}
                                        className="h-9 rounded-lg border-gray-100 text-[10px]"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 rounded-lg border-gray-100 w-full gap-2 text-[10px] font-bold"
                                        onClick={() => {
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'image/*';
                                          input.onchange = async (e: any) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              try {
                                                const toastId = toast.loading("Mengunggah dan mengompresi gambar...");
                                                const compressedFile = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
                                                const validationError = validateImageFile(compressedFile, { maxSizeMB: 2 });
                                                
                                                if (validationError) {
                                                  toast.error(validationError, { id: toastId });
                                                  return;
                                                }

                                                const filePath = createImageStoragePath(`settings/hero_slide_${Date.now()}`, compressedFile);
                                                const { error: uploadError } = await supabase.storage.from('product_images').upload(filePath, compressedFile);
                                                
                                                if (uploadError) throw uploadError;
                                                
                                                const { data: { publicUrl } } = supabase.storage.from('product_images').getPublicUrl(filePath);
                                                const newSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                                newSlides[index].image_url = publicUrl;
                                                setSettingsMap({ ...settingsMap, "hero_slides": newSlides });
                                                
                                                toast.success("Gambar berhasil diunggah!", { id: toastId });
                                              } catch (err: any) {
                                                toast.error("Gagal mengunggah: " + err.message);
                                              }
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        <Upload size={12} /> Upload Image
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Label Tombol</Label>
                                      <Input 
                                        placeholder="Belanja Sekarang" 
                                        value={slide.cta_text || ""}
                                        onChange={(e) => {
                                          const newSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                          newSlides[index].cta_text = e.target.value;
                                          setSettingsMap({ ...settingsMap, "hero_slides": newSlides });
                                        }}
                                        className="h-9 rounded-lg text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Link Tombol</Label>
                                      <Input 
                                        placeholder="/products" 
                                        value={slide.cta_link || ""}
                                        onChange={(e) => {
                                          const newSlides = [...(Array.isArray(settingsMap["hero_slides"]) ? settingsMap["hero_slides"] : [])];
                                          newSlides[index].cta_link = e.target.value;
                                          setSettingsMap({ ...settingsMap, "hero_slides": newSlides });
                                        }}
                                        className="h-9 rounded-lg text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {renderSettingField("hero_cta_text", "Label Tombol Default")}
                            {renderSettingField("hero_cta_link", "Link Tombol Default")}
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 space-y-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poin Kepercayaan (Trust Points)</p>
                        <div className="grid md:grid-cols-3 gap-4">
                          {renderSettingField("trust_1", "Poin 1")}
                          {renderSettingField("trust_2", "Poin 2")}
                          {renderSettingField("trust_3", "Poin 3")}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <Button onClick={() => saveSettings(["hero_badge", "hero_headline", "hero_subheadline", "hero_image_url", "hero_cta_text", "hero_cta_link", "trust_1", "trust_2", "trust_3", "hero_slides"])} disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10 transition-all">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Perubahan Hero
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="profile_section" className="mt-0 outline-none space-y-6">
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          {renderSettingField("about_intro", "Pernyataan Intro", "textarea")}
                          {renderSettingField("about_history", "Sejarah", "textarea")}
                        </div>
                        <div className="space-y-4">
                          {renderSettingField("about_image_url", "Foto Profil", "images")}
                          <div className="grid grid-cols-2 gap-4">
                            {renderSettingField("about_vision", "Visi", "text")}
                            {renderSettingField("about_mission", "Misi", "text")}
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <Button onClick={() => saveSettings(["about_intro", "about_history", "about_vision", "about_mission", "about_image_url"])} disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10 transition-all">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Profil Pabrik
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="benefits_section" className="mt-0 outline-none space-y-6">
                      <div className="grid lg:grid-cols-2 gap-8 mb-6">
                        {renderSettingField("benefit_title", "Judul Bagian")}
                        {renderSettingField("benefit_subtitle", "Sub-judul")}
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          {renderSettingField("benefit_1_title", "Keunggulan 1")}
                          {renderSettingField("benefit_1_desc", "Deskripsi", "textarea")}
                        </div>
                        <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          {renderSettingField("benefit_2_title", "Keunggulan 2")}
                          {renderSettingField("benefit_2_desc", "Deskripsi", "textarea")}
                        </div>
                        <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          {renderSettingField("benefit_3_title", "Keunggulan 3")}
                          {renderSettingField("benefit_3_desc", "Deskripsi", "textarea")}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <Button onClick={() => saveSettings(["benefit_title", "benefit_subtitle", "benefit_1_title", "benefit_1_desc", "benefit_2_title", "benefit_2_desc", "benefit_3_title", "benefit_3_desc"])} disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10 transition-all">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Keunggulan
                        </Button>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Card>
              </Tabs>
            </div>
            )}

            {activeTab === "business" && (
            <div className="space-y-5">
              <Tabs defaultValue="contact_info" className="w-full">
                <Card className="border border-gray-100 shadow-sm rounded-3xl bg-white overflow-hidden">
                  <CardHeader className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2"><Phone size={20} /> Pengaturan Bisnis</CardTitle>
                      <CardDescription>Kelola informasi kontak dan detail operasional bisnis Anda.</CardDescription>
                    </div>
                    <TabsList className="bg-gray-100/80 p-1 rounded-xl h-auto self-start md:self-center">
                      <TabsTrigger value="contact_info" className="px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Kontak</TabsTrigger>
                      <TabsTrigger value="payment_service" className="px-4 py-2 rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Pembayaran</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent className="p-8">
                    <TabsContent value="contact_info" className="mt-0 outline-none space-y-6">
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          {renderSettingField("business_name", "Nama Bisnis")}
                          {renderSettingField("footer_description", "Deskripsi Footer", "textarea")}
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {renderSettingField("contact_whatsapp", "WhatsApp")}
                            {renderSettingField("contact_email", "Email")}
                          </div>
                          {renderSettingField("contact_address", "Alamat", "textarea")}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50">
                        {renderSettingField("contact_maps_iframe", "Embed Maps", "textarea")}
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <Button onClick={() => saveSettings(["business_name", "footer_description", "contact_whatsapp", "contact_email", "contact_address", "contact_maps_iframe"])} disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10 transition-all">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Informasi Kontak
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="payment_service" className="mt-0 outline-none space-y-6">
                      <div className="grid lg:grid-cols-2 gap-8">
                        {renderSettingField("payment_bank_info", "Info Bank (Transfer)", "textarea")}
                        <div className="space-y-6">
                          {renderSettingField("payment_dana_number", "Nomor E-Wallet (DANA/OVO)")}
                          {renderSettingField("service_areas", "Area Layanan Pengiriman", "textarea")}
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-50 flex justify-end">
                        <Button onClick={() => saveSettings(["payment_bank_info", "payment_dana_number", "service_areas"])} disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10 transition-all">
                          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Detail Pembayaran
                        </Button>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Card>
              </Tabs>
            </div>
            )}

            {activeTab === "seo" && (
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden max-w-4xl mx-auto">
                <CardHeader className="bg-gray-50/50 px-10 py-8">
                  <CardTitle className="text-xl font-bold flex items-center gap-2"><Globe size={20} /> Manajemen SEO</CardTitle>
                  <CardDescription>Kontrol bagaimana situs web Anda muncul di mesin pencari seperti Google.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="space-y-6">
                    {renderSettingField("seo_title", "Meta Title", "text", "Direkomendasikan 50-60 karakter.")}
                    {renderSettingField("seo_keywords", "Keywords", "text", "Pisahkan dengan koma.")}
                    {renderSettingField("seo_description", "Meta Description", "textarea", "Direkomendasikan 150-160 karakter.")}
                  </div>

                  {/* Live Preview */}
                  <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pratinjau Mesin Pencari</p>
                    <div className="p-8 border border-gray-100 rounded-3xl bg-[#fafafa]">
                      <p className="text-[#1a0dab] text-xl font-medium truncate hover:underline cursor-pointer">{settingsMap["seo_title"] || "Pratinjau Judul Situs"}</p>
                      <p className="text-[#006621] text-sm truncate mt-1">https://pabrikberaskurma.com</p>
                      <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                        {settingsMap["seo_description"] || "Pratinjau deskripsi situs akan muncul di sini setelah Anda mengetiknya."}
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => saveSettings(["seo_title", "seo_keywords", "seo_description"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold shadow-xl shadow-black/10">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Simpan Konfigurasi SEO
                  </Button>
                </CardContent>
              </Card>
            </div>
            )}

          </div>
        </div>
      </div>

      {/* ── UNIVERSAL MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-gray-50/50 px-10 py-8 border-b border-gray-100">
            <DialogTitle className="text-2xl font-black">
              {editingItem ? 'Ubah Data' : 'Tambah Data Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-10">
            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === "faq" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pertanyaan</Label>
                    <Input id="question" name="question" defaultValue={editingItem?.question} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Jawaban</Label>
                    <Textarea id="answer" name="answer" defaultValue={editingItem?.answer} required className="min-h-[120px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Urutan Tampil</Label>
                      <Input id="order_num" name="order_num" type="number" defaultValue={editingItem?.order_num} className="h-12 rounded-xl border-gray-100 focus:border-black" />
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                      <Label htmlFor="is_active" className="text-sm font-bold">Aktif & Terlihat</Label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "articles" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Judul Artikel</Label>
                    <Input id="title" name="title" defaultValue={editingItem?.title} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug (URL)</Label>
                    <Input id="slug" name="slug" defaultValue={editingItem?.slug} placeholder="judul-artikel-anda" required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ringkasan (Excerpt)</Label>
                    <Textarea id="excerpt" name="excerpt" defaultValue={editingItem?.excerpt} className="h-20 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Konten Artikel</Label>
                    <Textarea id="content" name="content" defaultValue={editingItem?.content} required className="min-h-[200px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">URL Gambar Sampul</Label>
                    <Input id="image_url" name="image_url" defaultValue={editingItem?.image_url} className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                    <Label htmlFor="is_active" className="text-sm font-bold">Terbitkan Artikel</Label>
                  </div>
                </>
              )}

              {activeTab === "testimonials" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Pelanggan</Label>
                      <Input id="name" name="name" defaultValue={editingItem?.name} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Peran / Lokasi</Label>
                      <Input id="role" name="role" defaultValue={editingItem?.role} placeholder="Reseller, Ibu Rumah Tangga..." className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Isi Testimoni</Label>
                    <Textarea id="content" name="content" defaultValue={editingItem?.content} required className="min-h-[100px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">URL Foto Pelanggan</Label>
                    <Input id="avatar_url" name="avatar_url" defaultValue={editingItem?.avatar_url} placeholder="https://..." className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rating (1-5)</Label>
                      <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={editingItem?.rating || 5} className="h-12 rounded-xl border-gray-100 focus:border-black" />
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                      <Label htmlFor="is_active" className="text-sm font-bold">Terlihat di Situs</Label>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="ghost" className="rounded-xl h-12" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
