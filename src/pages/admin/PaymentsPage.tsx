import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Image as ImageIcon,
  ExternalLink,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  proof_url: string | null;
  created_at: string;
  orders: {
    order_code: string;
    total_amount: number;
    customers: {
      full_name: string;
    }
  };
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          orders (
            order_code,
            total_amount,
            customers (full_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data as any) || []);
    } catch (error: any) {
      toast.error("Gagal memuat data pembayaran: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string, orderId: string, status: 'verified' | 'rejected') => {
    if (status === "verified" && selectedPayment?.orders?.total_amount !== selectedPayment?.amount) {
      toast.error("Nominal bukti pembayaran tidak sama dengan total tagihan. Periksa ulang sebelum verifikasi.");
      return;
    }

    setIsVerifying(true);
    try {
      const { error: payError } = await (supabase as any)
        .from('payments')
        .update({
          status,
          verified_by: user?.id || null,
          verified_at: status === "verified" ? new Date().toISOString() : null
        })
        .eq('id', paymentId);

      if (payError) throw payError;

      if (status === 'verified') {
        const { error: orderError } = await (supabase as any)
          .from('orders')
          .update({ status: 'processing' })
          .eq('id', orderId);
        
        if (orderError) throw orderError;
        toast.success("Payment verified. Order status updated to 'Processing'.");
      } else {
        toast.error("Payment rejected.");
      }

      setIsProofModalOpen(false);
      fetchPayments();
    } catch (error: any) {
      toast.error("Verification failed: " + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Pending</Badge>;
      case 'submitted': return <Badge variant="outline" className="bg-gray-100 text-black border-gray-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">Upload</Badge>;
      case 'verified': return <Badge variant="outline" className="bg-black text-white border-transparent text-[9px] font-black uppercase tracking-widest px-2 py-0">Lunas</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-white text-gray-300 border-gray-100 text-[9px] font-black uppercase tracking-widest px-2 py-0">Tolak</Badge>;
      default: return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0">{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => 
    p.orders?.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.orders?.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-black tracking-tighter text-black uppercase">Verifikasi</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Konfirmasi Bukti Transfer Pelanggan</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Cari ID Pesanan..." 
            className="pl-9 h-10 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-none">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-gray-50">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">ID Pesanan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Pelanggan</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Nominal</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6">Tanggal</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400 h-10 px-6 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-black/20" />
                  <p className="mt-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Loading payments...</p>
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-6 py-4 font-mono font-black text-black tracking-tighter text-xs">{payment.orders?.order_code}</TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-[11px] font-black text-black uppercase tracking-tight">{payment.orders?.customers?.full_name}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-[11px] font-black tracking-tight text-black">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-6 py-4">{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(payment.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsProofModalOpen(true);
                      }}
                    >
                      Konfirmasi
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Proof Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-md bg-white border-none rounded-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 lg:p-8 border-b border-gray-50 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment Proof</p>
            <h2 className="text-xl lg:text-2xl font-black tracking-tighter uppercase">{selectedPayment?.orders?.order_code}</h2>
          </div>
          
          {selectedPayment && (
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 group">
                {selectedPayment.proof_url ? (
                  <>
                    <img 
                      src={selectedPayment.proof_url} 
                      alt="Bukti Transfer" 
                      className="w-full h-full object-contain"
                    />
                    <a 
                      href={selectedPayment.proof_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                    <ImageIcon size={32} className="opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Tidak ada bukti</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-5 bg-gray-50/50 rounded-xl border border-gray-50">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Tagihan</p>
                  <p className="text-xl font-black text-black">Rp {selectedPayment.amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-black text-white hover:bg-black/90 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/10"
                  disabled={isVerifying || !selectedPayment.proof_url || selectedPayment.status === 'verified'}
                  onClick={() => verifyPayment(selectedPayment.id, selectedPayment.order_id, 'verified')}
                >
                  {isVerifying ? "VERIFIKASI..." : "APPROVE TRANSAKSI"}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100 text-gray-400 hover:text-black transition-all"
                    disabled={isVerifying || selectedPayment.status === 'verified'}
                    onClick={() => verifyPayment(selectedPayment.id, selectedPayment.order_id, 'rejected')}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black hover:bg-transparent"
                    onClick={() => setIsProofModalOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
