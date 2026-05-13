import { useState, useEffect } from "react";
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
  User,
  ShieldCheck,
  CreditCard,
  Globe,
  Phone,
  Save,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

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
  const [_siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Dynamic Settings Map
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "faq") {
        const { data, error } = await supabase.from("faqs").select("*").order("order_num");
        if (error) throw error;
        setFaqs(data || []);
      } else if (activeTab === "articles") {
        const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setArticles(data || []);
      } else if (activeTab === "testimonials") {
        const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setTestimonials(data || []);
      } else if (["appearance", "business", "seo"].includes(activeTab)) {
        const { data, error } = await supabase.from("site_settings").select("*").order("key");
        if (error) throw error;
        setSiteSettings(data || []);
        const map: Record<string, string> = {};
        (data || []).forEach((s: SiteSetting) => { 
          map[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value); 
        });
        setSettingsMap(map);
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
          let parsedValue: any;
          try { parsedValue = JSON.parse(newValue); } catch { parsedValue = newValue; }
          const { error } = await (supabase as any).from("site_settings").upsert({ key, value: parsedValue }, { onConflict: 'key' });
          if (error) throw error;
        }
      }
      toast.success("Settings updated successfully!");
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setIsSaving(false); }
  };

  const renderSettingField = (key: string, label: string, type: "text" | "textarea" | "number" = "text", description?: string) => (
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
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-black">Pengaturan & Konten</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola tampilan, informasi, dan pengaturan inti website Anda.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex gap-8 items-start">
          {/* Sidebar Navigation */}
          <TabsList className="flex flex-col gap-1 p-2 bg-white border border-gray-100 rounded-3xl shadow-sm h-auto w-64 shrink-0">
            <p className="px-4 pt-2 pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Menu Pengaturan</p>
            {sidebarItems.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="w-full justify-start gap-3 px-4 py-3 h-auto rounded-xl text-left data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-black/10 transition-all duration-200"
              >
                <tab.icon size={16} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight">{tab.label}</p>
                  <p className="text-[10px] opacity-60 leading-tight truncate mt-0.5">{tab.desc}</p>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content Area */}
          <div className="flex-1 min-w-0">

        {/* ── FAQ TAB ── */}
        <TabsContent value="faq" className="space-y-6 outline-none">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-500">Manage help center content for your customers.</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="rounded-xl bg-black text-white hover:bg-gray-800 h-11 px-6 font-bold shadow-lg shadow-black/10 transition-all">
              <Plus size={18} className="mr-2" /> Add Question
            </Button>
          </div>
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-black/10" /></TableCell></TableRow>
                ) : faqs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 font-medium">No FAQ records found.</TableCell></TableRow>
                ) : faqs.map((faq) => (
                  <TableRow key={faq.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-medium">{faq.question}</td>
                    <td className="px-8 py-5 text-gray-400 font-mono text-xs">{faq.order_num || '-'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${faq.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {faq.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => handleOpenModal(faq)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(faq.id)}><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ARTICLES TAB ── */}
        <TabsContent value="articles" className="space-y-6 outline-none">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">News & Articles</h2>
              <p className="text-sm text-gray-500">Publish updates and education about your products.</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="rounded-xl bg-black text-white hover:bg-gray-800 h-11 px-6 font-bold shadow-lg shadow-black/10 transition-all">
              <Plus size={18} className="mr-2" /> New Article
            </Button>
          </div>
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Published</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-black/10" /></TableCell></TableRow>
                ) : articles.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 font-medium">No articles found.</TableCell></TableRow>
                ) : articles.map((art) => (
                  <TableRow key={art.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold">{art.title}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${art.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {art.is_active ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-400 text-[10px] font-black uppercase tracking-tighter">
                      {art.published_at ? new Date(art.published_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => handleOpenModal(art)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(art.id)}><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── TESTIMONIALS TAB ── */}
        <TabsContent value="testimonials" className="space-y-6 outline-none">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">Customer Testimonials</h2>
              <p className="text-sm text-gray-500">Highlight positive feedback from your happy customers.</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="rounded-xl bg-black text-white hover:bg-gray-800 h-11 px-6 font-bold shadow-lg shadow-black/10 transition-all">
              <Plus size={18} className="mr-2" /> Add Feedback
            </Button>
          </div>
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-black/10" /></TableCell></TableRow>
                ) : testimonials.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-gray-400 font-medium">No testimonials found.</TableCell></TableRow>
                ) : testimonials.map((testi) => (
                  <TableRow key={testi.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-black">{testi.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{testi.role || 'Customer'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex text-yellow-500"><Star size={12} fill="currentColor" /> <span className="text-xs font-bold ml-1">{testi.rating || 5}</span></div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${testi.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {testi.is_active ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => handleOpenModal(testi)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(testi.id)}><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── APPEARANCE TAB ── */}
        <TabsContent value="appearance" className="space-y-8 outline-none">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 px-10 py-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Layout size={20} /> Hero Section</CardTitle>
                <CardDescription>Update the main banner content of your homepage.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                {renderSettingField("hero_badge", "Small Badge Text", "text", "Text shown above headline (e.g. 'Flash Sale')")}
                {renderSettingField("hero_headline", "Main Headline", "textarea", "Use [green]text[/green] to highlight text in green color.")}
                {renderSettingField("hero_subheadline", "Sub-headline", "textarea", "Descriptive text below the main headline.")}
                {renderSettingField("hero_image_url", "Hero Background Image (URL)", "text", "Recommend Unsplash image URL for best look.")}
                <div className="grid grid-cols-2 gap-4">
                  {renderSettingField("hero_cta_text", "CTA Button Text")}
                  {renderSettingField("hero_cta_link", "CTA Button Link")}
                </div>
                {renderSettingField("trust_1", "Trust Item 1")}
                {renderSettingField("trust_2", "Trust Item 2")}
                {renderSettingField("trust_3", "Trust Item 3")}
                <Button onClick={() => saveSettings(["hero_badge", "hero_headline", "hero_subheadline", "hero_image_url", "hero_cta_text", "hero_cta_link", "trust_1", "trust_2", "trust_3"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold mt-4 shadow-xl shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 px-10 py-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><User size={20} /> Factory Profile</CardTitle>
                <CardDescription>Tell your story and vision to your visitors.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                {renderSettingField("about_intro", "Intro Statement", "textarea")}
                {renderSettingField("about_history", "History Content", "textarea")}
                {renderSettingField("about_vision", "Vision Statement", "text")}
                {renderSettingField("about_mission", "Mission Statement", "text")}
                {renderSettingField("about_image_url", "Profile Image (URL)")}
                <Button onClick={() => saveSettings(["about_intro", "about_history", "about_vision", "about_mission", "about_image_url"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold mt-4 shadow-xl shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 px-10 py-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} /> Benefits Section (Why Choose Us)</CardTitle>
                <CardDescription>Configure the 3 key benefits shown on the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    {renderSettingField("benefit_title", "Section Title")}
                    {renderSettingField("benefit_subtitle", "Section Subtitle")}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField("benefit_1_title", "Benefit 1 Title")}
                    {renderSettingField("benefit_1_desc", "Benefit 1 Desc", "textarea")}
                  </div>
                  <div className="space-y-4">
                    {renderSettingField("benefit_2_title", "Benefit 2 Title")}
                    {renderSettingField("benefit_2_desc", "Benefit 2 Desc", "textarea")}
                    {renderSettingField("benefit_3_title", "Benefit 3 Title")}
                    {renderSettingField("benefit_3_desc", "Benefit 3 Desc", "textarea")}
                  </div>
                </div>
                <Button onClick={() => saveSettings(["benefit_title", "benefit_subtitle", "benefit_1_title", "benefit_1_desc", "benefit_2_title", "benefit_2_desc", "benefit_3_title", "benefit_3_desc"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold mt-8 shadow-xl shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save Benefits
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BUSINESS TAB ── */}
        <TabsContent value="business" className="space-y-8 outline-none">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 px-10 py-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><Phone size={20} /> Contact Details</CardTitle>
                <CardDescription>Primary communication channels.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                {renderSettingField("contact_whatsapp", "WhatsApp Number", "text", "Include country code (e.g. 628...)")}
                {renderSettingField("contact_email", "Public Email")}
                {renderSettingField("contact_address", "Physical Address", "textarea")}
                {renderSettingField("contact_maps_iframe", "Google Maps Embed Code", "textarea", "Paste the <iframe> code from Google Maps share.")}
                <Button onClick={() => saveSettings(["contact_whatsapp", "contact_email", "contact_address", "contact_maps_iframe"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold mt-4 shadow-xl shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save Contact Info
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 px-10 py-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2"><CreditCard size={20} /> Payments & Service</CardTitle>
                <CardDescription>Account info and logistics area.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                {renderSettingField("payment_bank_info", "Bank Account Details", "textarea", "Format: Bank Name - Account No - Holder Name")}
                {renderSettingField("payment_dana_number", "DANA Number")}
                {renderSettingField("service_areas", "Service Areas", "textarea", "List cities or regions you serve.")}
                <Button onClick={() => saveSettings(["payment_bank_info", "payment_dana_number", "service_areas"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold mt-4 shadow-xl shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Update Business Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── SEO TAB ── */}
        <TabsContent value="seo" className="space-y-8 outline-none">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden max-w-4xl mx-auto">
            <CardHeader className="bg-gray-50/50 px-10 py-8">
              <CardTitle className="text-xl font-bold flex items-center gap-2"><Globe size={20} /> SEO Management</CardTitle>
              <CardDescription>Control how your website appears on search engines like Google.</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
              <div className="space-y-6">
                {renderSettingField("seo_title", "Meta Title", "text", "Recommended 50-60 characters.")}
                {renderSettingField("seo_keywords", "Keywords", "text", "Separate with commas.")}
                {renderSettingField("seo_description", "Meta Description", "textarea", "Recommended 150-160 characters.")}
              </div>

              {/* Live Preview */}
              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Engine Preview</p>
                <div className="p-8 border border-gray-100 rounded-3xl bg-[#fafafa]">
                  <p className="text-[#1a0dab] text-xl font-medium truncate hover:underline cursor-pointer">{settingsMap["seo_title"] || "Site Title Preview"}</p>
                  <p className="text-[#006621] text-sm truncate mt-1">https://pabrikberaskurma.com</p>
                  <p className="text-[#545454] text-sm mt-1 line-clamp-2">
                    {settingsMap["seo_description"] || "Site description preview will appear here once you type it."}
                  </p>
                </div>
              </div>

              <Button onClick={() => saveSettings(["seo_title", "seo_keywords", "seo_description"])} disabled={isSaving} className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-bold shadow-xl shadow-black/10">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save SEO Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* ── UNIVERSAL MODAL ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-gray-50/50 px-10 py-8 border-b border-gray-100">
            <DialogTitle className="text-2xl font-black">
              {editingItem ? 'Edit Entry' : 'Create New Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-10">
            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === "faq" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question</Label>
                    <Input id="question" name="question" defaultValue={editingItem?.question} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Answer</Label>
                    <Textarea id="answer" name="answer" defaultValue={editingItem?.answer} required className="min-h-[120px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Order</Label>
                      <Input id="order_num" name="order_num" type="number" defaultValue={editingItem?.order_num} className="h-12 rounded-xl border-gray-100 focus:border-black" />
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                      <Label htmlFor="is_active" className="text-sm font-bold">Active & Visible</Label>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "articles" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Title</Label>
                    <Input id="title" name="title" defaultValue={editingItem?.title} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug (URL)</Label>
                    <Input id="slug" name="slug" defaultValue={editingItem?.slug} placeholder="my-article-title" required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Excerpt (Summary)</Label>
                    <Textarea id="excerpt" name="excerpt" defaultValue={editingItem?.excerpt} className="h-20 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content</Label>
                    <Textarea id="content" name="content" defaultValue={editingItem?.content} required className="min-h-[200px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cover Image URL</Label>
                    <Input id="image_url" name="image_url" defaultValue={editingItem?.image_url} className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                    <Label htmlFor="is_active" className="text-sm font-bold">Publish Article</Label>
                  </div>
                </>
              )}

              {activeTab === "testimonials" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Name</Label>
                      <Input id="name" name="name" defaultValue={editingItem?.name} required className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Role / Location</Label>
                      <Input id="role" name="role" defaultValue={editingItem?.role} placeholder="Reseller, Ibu Rumah Tangga..." className="h-12 rounded-xl border-gray-100 focus:border-black transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Testimonial Content</Label>
                    <Textarea id="content" name="content" defaultValue={editingItem?.content} required className="min-h-[100px] rounded-xl border-gray-100 focus:border-black transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rating (1-5)</Label>
                      <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue={editingItem?.rating || 5} className="h-12 rounded-xl border-gray-100 focus:border-black" />
                    </div>
                    <div className="flex items-center gap-3 pt-8">
                      <input type="checkbox" id="is_active" defaultChecked={editingItem ? editingItem.is_active : true} className="w-5 h-5 accent-black" />
                      <Label htmlFor="is_active" className="text-sm font-bold">Visible on Site</Label>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="ghost" className="rounded-xl h-12" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-black text-white hover:bg-gray-800 rounded-xl px-10 h-12 font-bold shadow-lg shadow-black/10">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
