import { Link } from "react-router-dom";
import { Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <div className="container mx-auto py-8 lg:py-12 px-4 max-w-6xl">
      <h1 className="text-2xl lg:text-3xl font-black text-evergreen mb-8 uppercase tracking-tight">Keranjang Belanja</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-neutral-100 shadow-sm">
          <div className="w-24 h-24 bg-neutral-100 text-black rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h2 className="text-2xl font-black text-evergreen mb-2 uppercase tracking-tight">Keranjang Belanja Kosong</h2>
          <p className="text-gray-500 mb-8 font-medium">Anda belum menambahkan produk apa pun ke keranjang belanja.</p>
          <Link to="/products">
            <Button size="lg" className="bg-primary hover:bg-evergreen rounded-2xl h-14 px-10 font-black shadow-xl shadow-primary/20 uppercase tracking-widest transition-all active:scale-95">Mulai Belanja</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
              <div className="p-6">
                {cartItems.map((item, index) => (
                  <div key={item.id} className={`flex gap-4 py-6 ${index !== cartItems.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                    <div className="w-24 h-24 bg-neutral-100 rounded-xl flex-shrink-0 relative overflow-hidden">
                      {item.image ? (
                        <div className="w-full h-full flex items-center justify-center p-2">
                          <img 
                            src={item.image.includes('supabase.co') ? item.image.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=200&quality=80&resize=contain' : item.image} 
                            alt={item.name} 
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">Tanpa Gambar</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-evergreen text-lg uppercase tracking-tight">{item.name}</h3>
                          <p className="text-primary font-black mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-600 p-2 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-sm text-gray-500">Kuantitas:</span>
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-neutral-50 text-gray-600"
                          >-</button>
                          <span className="px-4 py-1 border-x border-gray-200 text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-neutral-50 text-gray-600"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 sticky top-24">
              <h2 className="text-xl font-black text-evergreen mb-6 uppercase tracking-tight">Ringkasan Pesanan</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.length} produk)</span>
                  <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Pengiriman</span>
                  <span className="text-sm italic">Dihitung di checkout</span>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-evergreen uppercase tracking-tight">Total Belanja</span>
                  <span className="font-black text-2xl text-primary tracking-tighter">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebd5a] h-14 text-base rounded-2xl font-black shadow-xl shadow-[#25D366]/20 transition-all active:scale-95 uppercase tracking-widest text-white border-none">
                  Lanjut ke Checkout <ArrowRight className="ml-2 h-5 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
