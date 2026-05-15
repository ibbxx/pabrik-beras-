import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle2
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createImageStoragePath, validateImageFile } from "@/lib/media";

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
      const validationError = validateImageFile(file, { maxSizeMB: 2 });

      if (validationError) {
        toast.error(validationError);
        e.target.value = "";
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const validationError = validateImageFile(file, { maxSizeMB: 2 });
    if (validationError) throw new Error(validationError);

    const filePath = createImageStoragePath("products", file);

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
    if (!prodForm.name.trim() || !prodForm.slug.trim() || !prodForm.price) {
      toast.error("Lengkapi kolom wajib!");
      return;
    }

    const price = Number(prodForm.price);
    const stock = Number(prodForm.stock || 0);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Harga produk harus lebih dari 0.");
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Stok tidak boleh bernilai negatif.");
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = editingProduct?.main_image_url || "";

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: prodForm.name.trim(),
        slug: prodForm.slug.trim(),
        description: prodForm.description,
        price,
        stock: Math.floor(stock),
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
    if (!window.confirm("Produk akan disembunyikan dari katalog, bukan dihapus permanen. Lanjutkan?")) return;
    try {
      const { error } = await (supabase as any).from('products').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      toast.success("Produk disembunyikan dari katalog");
      fetchProducts();
    } catch (err: any) {
      toast.error("Gagal menyembunyikan produk: " + err.message);
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black tracking-tighter text-black uppercase">Inventory</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kelola Stok & Produk Beras</p>
        </div>
        <Button onClick={() => handleOpenProdModal()} className="bg-black text-white hover:bg-black/90 h-10 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all active:scale-95">
          Tambah Produk
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-none">
        <div className="p-4 border-b border-gray-50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Cari produk..." 
              className="pl-9 h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Produk</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Harga</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Stok</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Aksi</TableHead>
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
                <TableRow key={prod.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-gray-100 overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {prod.main_image_url ? (
                          <img src={prod.main_image_url} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-200" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-black text-xs uppercase tracking-tight">{prod.name}</p>
                        <p className="text-[9px] text-gray-400 font-mono tracking-tighter">{prod.slug}</p>
                        {prod.is_featured && (
                          <Badge variant="outline" className="mt-1 bg-black text-white border-transparent text-[8px] font-black uppercase tracking-widest px-1.5 py-0">Unggulan</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-black text-black text-[11px]">
                    Rp {prod.price.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-500 font-bold text-[11px] uppercase tracking-tight">
                    {prod.stock} kg
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${prod.is_active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 border border-gray-100'}`}>
                      {prod.is_active ? 'Aktif' : 'Sembunyi'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent" onClick={() => handleOpenProdModal(prod)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-black hover:bg-transparent" onClick={() => handleDeleteProduct(prod.id)}>Nonaktif</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-xl bg-white border-none rounded-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 lg:p-8 border-b border-gray-50 shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-black">
              {editingProduct ? 'UPDATE PRODUK' : 'PRODUK BARU'}
            </DialogTitle>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              {editingProduct ? 'Perbarui data stok & informasi produk' : 'Tambah item baru ke dalam database pabrik'}
            </p>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            <form id="product-form" onSubmit={handleSaveProduct} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label htmlFor="prodName" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Produk</Label>
                  <Input id="prodName" value={prodForm.name} onChange={handleProdNameChange} placeholder="e.g. Beras Pandan Wangi" required className="h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prodSlug" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</Label>
                  <Input id="prodSlug" value={prodForm.slug} onChange={(e) => setProdForm({...prodForm, slug: e.target.value})} required className="h-10 border-gray-100 rounded-lg font-mono text-[10px] focus-visible:ring-black" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Harga per KG</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">Rp</span>
                    <Input id="price" type="number" min="1" value={prodForm.price} onChange={(e) => setProdForm({...prodForm, price: e.target.value})} required className="pl-9 h-10 border-gray-100 rounded-lg text-xs font-black focus-visible:ring-black" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stok (KG)</Label>
                  <div className="relative">
                    <Input id="stock" type="number" min="0" value={prodForm.stock} onChange={(e) => setProdForm({...prodForm, stock: e.target.value})} className="h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">KG</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deskripsi Produk</Label>
                  <Textarea id="description" value={prodForm.description} onChange={(e) => setProdForm({...prodForm, description: e.target.value})} placeholder="Kualitas, tekstur, asal beras..." className="min-h-[100px] border-gray-100 rounded-lg text-xs leading-relaxed focus-visible:ring-black resize-none" />
                </div>
                
                <div className="flex flex-wrap gap-6 p-4 bg-gray-50/50 rounded-xl border border-gray-50">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${prodForm.is_featured ? 'bg-black border-black' : 'border-gray-200'}`}>
                      {prodForm.is_featured && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={prodForm.is_featured} onChange={(e) => setProdForm({...prodForm, is_featured: e.target.checked})} className="hidden" />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Produk Unggulan</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${prodForm.is_active ? 'bg-black border-black' : 'border-gray-200'}`}>
                      {prodForm.is_active && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <input type="checkbox" checked={prodForm.is_active} onChange={(e) => setProdForm({...prodForm, is_active: e.target.checked})} className="hidden" />
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Aktifkan di Katalog</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Media Produk</p>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-gray-50 rounded-xl bg-gray-50/50">
                  <div className="w-24 h-24 rounded-lg border border-gray-100 overflow-hidden bg-white shrink-0 flex items-center justify-center relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-100 h-8 w-8" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-black uppercase tracking-tight">Foto Produk Utama</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Format: JPG, PNG, WEBP. Maks 2MB.</p>
                    </div>
                    <Label htmlFor="image-upload" className="inline-flex h-8 px-6 items-center justify-center rounded-lg bg-black text-white text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-black/90 transition-all active:scale-95">
                      Pilih Foto
                    </Label>
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" id="image-upload" />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-gray-50 flex justify-end gap-3 shrink-0">
            <Button 
              variant="ghost" 
              className="h-10 px-6 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent" 
              onClick={() => setIsProductModalOpen(false)}
            >
              Batal
            </Button>
            <Button 
              form="product-form"
              type="submit" 
              disabled={isSaving} 
              className="bg-black text-white hover:bg-black/90 rounded-lg px-8 h-10 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              {isSaving ? "MENYIMPAN..." : (editingProduct ? 'UPDATE PRODUK' : 'SIMPAN PRODUK')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
