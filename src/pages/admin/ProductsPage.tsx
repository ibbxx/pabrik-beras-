import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// --- Types ---
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  main_image_url: string;
  is_featured: boolean;
  is_active: boolean;
};

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodForm, setProdForm] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock: "",
    is_featured: false,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodError) throw prodError;
      setProducts(prodData || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  // --- Product Handlers ---
  const handleOpenProdModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdForm({
        name: prod.name,
        slug: prod.slug,
        description: prod.description || "",
        price: prod.price.toString(),
        stock: prod.stock.toString(),
        is_featured: prod.is_featured,
        is_active: prod.is_active,
      });
      setImagePreview(prod.main_image_url || "");
    } else {
      setEditingProduct(null);
      setProdForm({
        name: "",
        slug: "",
        description: "",
        price: "",
        stock: "",
        is_featured: false,
        is_active: true,
      });
      setImagePreview("");
    }
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const handleProdNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProdForm(prev => ({
      ...prev,
      name: e.target.value,
      slug: !editingProduct ? generateSlug(e.target.value) : prev.slug
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('product_images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.slug || !prodForm.price) {
      toast.error("Lengkapi kolom wajib!");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = editingProduct?.main_image_url || "";

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: prodForm.name,
        slug: prodForm.slug,
        description: prodForm.description,
        price: parseFloat(prodForm.price),
        stock: parseInt(prodForm.stock) || 0,
        is_featured: prodForm.is_featured,
        is_active: prodForm.is_active,
        main_image_url: finalImageUrl
      };

      if (editingProduct) {
        const { error } = await (supabase as any)
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success("Produk berhasil diubah");
      } else {
        const { error } = await (supabase as any)
          .from('products')
          .insert(payload);
        if (error) throw error;
        toast.success("Produk berhasil ditambahkan");
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success("Produk dihapus");
      fetchProducts();
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-black/10" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Product Management</h1>
          <p className="text-gray-500 text-sm">Create and manage your rice products and inventory.</p>
        </div>
        <Button onClick={() => handleOpenProdModal()} className="rounded-xl bg-black text-white hover:bg-gray-800 h-11 px-6 font-bold shadow-lg shadow-black/10 transition-all">
          <Plus size={18} className="mr-2" /> New Product
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="relative max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 h-12 rounded-xl border-gray-100 focus:border-black transition-all bg-gray-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-gray-400 font-medium font-heading italic">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => (
                <TableRow key={prod.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex items-center justify-center shrink-0">
                        {prod.main_image_url ? (
                          <img src={prod.main_image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-200" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-black">{prod.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{prod.slug}</p>
                        {prod.is_featured && (
                          <Badge variant="outline" className="mt-1 bg-black text-white border-black text-[8px] font-black uppercase tracking-tighter px-1.5 py-0">Featured</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 font-black text-black">
                    Rp {prod.price.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-gray-400 font-bold italic">
                    {prod.stock} kg
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${prod.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {prod.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => handleOpenProdModal(prod)}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="icon" className="rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteProduct(prod.id)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-30 px-10 py-8 border-b border-gray-100 flex justify-between items-center">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tighter text-black">
                {editingProduct ? 'UPDATE PRODUCT' : 'NEW PRODUCT'}
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {editingProduct ? 'Modify existing inventory' : 'Add a new item to your factory catalog'}
              </p>
            </DialogHeader>
            <DialogClose className="relative -top-2 -right-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <XCircle className="h-6 w-6 text-gray-300" />
            </DialogClose>
          </div>
          
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="product-form" onSubmit={handleSaveProduct} className="p-10 space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">01</div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Identity & Basics</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="prodName" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Product Name *</Label>
                    <Input id="prodName" value={prodForm.name} onChange={handleProdNameChange} placeholder="e.g. Beras Pandan Wangi" required className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-black transition-all text-sm font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="prodSlug" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Slug (Auto-generated) *</Label>
                    <Input id="prodSlug" value={prodForm.slug} onChange={(e) => setProdForm({...prodForm, slug: e.target.value})} required className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-black transition-all font-mono text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Price per KG (IDR) *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Rp</span>
                      <Input id="price" type="number" value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})} required className="pl-12 h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-black transition-all font-black text-lg tracking-tight" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Initial Stock (KG)</Label>
                    <div className="relative">
                      <Input id="stock" type="number" value={prodForm.stock} onChange={(e) => setProdForm({...prodForm, stock: e.target.value})} className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-black transition-all font-bold" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">KG</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">02</div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Content & Visibility</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Description</Label>
                  <Textarea id="description" value={prodForm.description} onChange={(e) => setProdForm({...prodForm, description: e.target.value})} placeholder="Describe the quality, texture, and origin..." className="min-h-[140px] rounded-2xl border-gray-100 bg-gray-50/30 focus:bg-white focus:border-black transition-all resize-none p-5 text-sm leading-relaxed" />
                </div>
                
                <div className="flex flex-wrap gap-10 bg-gray-50/50 p-6 rounded-3xl border border-gray-50">
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${prodForm.is_featured ? 'bg-black border-black scale-110' : 'border-gray-200 group-hover:border-black'}`}>
                      {prodForm.is_featured && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={prodForm.is_featured} onChange={(e) => setProdForm({...prodForm, is_featured: e.target.checked})} className="hidden" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-black uppercase tracking-widest block">Featured</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Show on Homepage</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${prodForm.is_active ? 'bg-black border-black scale-110' : 'border-gray-200 group-hover:border-black'}`}>
                      {prodForm.is_active && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={prodForm.is_active} onChange={(e) => setProdForm({...prodForm, is_active: e.target.checked})} className="hidden" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-black uppercase tracking-widest block">Published</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Visible to Customers</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-8 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center text-xs font-bold">03</div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-black">Product Media</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-10 p-10 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30 hover:bg-gray-50 transition-colors">
                  <div className="w-40 h-40 rounded-3xl border-4 border-white shadow-2xl overflow-hidden bg-white shrink-0 flex items-center justify-center group relative">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="text-white h-8 w-8" />
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="text-gray-100 h-12 w-12" />
                    )}
                  </div>
                  <div className="space-y-5 text-center sm:text-left flex-1">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-black uppercase tracking-tight">Product Showcase Image</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended: 1000x1000px, Under 2MB</p>
                    </div>
                    <Label htmlFor="image-upload" className="inline-flex h-12 px-10 items-center justify-center rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95">
                      Choose Photo
                    </Label>
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-50 p-8 px-10 flex justify-end gap-4 z-30">
            <Button 
              type="button" 
              variant="ghost" 
              className="rounded-2xl h-14 px-8 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" 
              onClick={() => setIsProductModalOpen(false)}
            >
              Discard Changes
            </Button>
            <Button 
              form="product-form"
              type="submit" 
              disabled={isSaving} 
              className="bg-black text-white hover:bg-gray-800 rounded-2xl px-14 h-14 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" /> 
                  Saving...
                </>
              ) : (
                editingProduct ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


