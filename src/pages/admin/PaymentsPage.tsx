import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon,
  ExternalLink,
  Search,
  Calendar,
  Clock,
  ArrowRight
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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
    setIsVerifying(true);
    try {
      const { error: payError } = await (supabase as any)
        .from('payments')
        .update({ status: status })
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
      case 'pending': return <Badge variant="outline" className="bg-white text-gray-400 border-gray-100 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Pending</Badge>;
      case 'submitted': return <Badge variant="outline" className="bg-black text-white border-black text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Submitted</Badge>;
      case 'verified': return <Badge variant="outline" className="bg-white text-black border-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Verified</Badge>;
      case 'rejected': return <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Rejected</Badge>;
      default: return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => 
    p.orders?.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.orders?.customers?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Payment Verification</h1>
          <p className="text-gray-500 text-sm">Monitor and verify transactions from your customers.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
          <Input 
            placeholder="Search Order Code..." 
            className="pl-10 h-12 rounded-xl border-gray-100 focus:border-black transition-all bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50 border-b border-gray-50">
            <TableRow>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Order Code</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Customer</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Amount</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Status</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Submission</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] text-right">Verification</TableHead>
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
                <TableRow key={payment.id} className="hover:bg-gray-50/50 transition-colors group">
                  <TableCell className="px-8 py-6 font-mono font-bold text-black tracking-tighter">{payment.orders?.order_code}</TableCell>
                  <TableCell className="px-8 py-6">
                    <p className="text-sm font-bold text-black">{payment.orders?.customers?.full_name}</p>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-sm font-black tracking-tight text-black">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="px-8 py-6">{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
                      <Calendar size={12} /> {new Date(payment.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <Button 
                      variant="ghost" 
                      className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-black/10"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsProofModalOpen(true);
                      }}
                    >
                      Process <ArrowRight size={14} className="ml-2" />
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
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Transaction Detail</p>
              <h2 className="text-2xl font-black tracking-tight">{selectedPayment?.orders?.order_code}</h2>
            </div>
            
            {selectedPayment && (
              <div className="space-y-8">
                <div className="space-y-3 text-center">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-4 border-gray-50 bg-gray-50 shadow-inner group">
                    {selectedPayment.proof_url ? (
                      <>
                        <img 
                          src={selectedPayment.proof_url} 
                          alt="Proof of Transfer" 
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        />
                        <a 
                          href={selectedPayment.proof_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute bottom-4 right-4 bg-black text-white p-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                        <ImageIcon size={48} className="opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No proof uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                <Card className="border-none bg-gray-50/50 shadow-inner rounded-2xl">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none">Total Bill</p>
                      <p className="text-2xl font-black text-black">Rp {selectedPayment.amount.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <Clock size={20} className="text-black" />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                  <Button 
                    className="w-full bg-black text-white hover:bg-gray-800 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transition-all disabled:opacity-20"
                    disabled={isVerifying || !selectedPayment.proof_url || selectedPayment.status === 'verified'}
                    onClick={() => verifyPayment(selectedPayment.id, selectedPayment.order_id, 'verified')}
                  >
                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Approve Transaction
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                      disabled={isVerifying || selectedPayment.status === 'verified'}
                      onClick={() => verifyPayment(selectedPayment.id, selectedPayment.order_id, 'rejected')}
                    >
                      <XCircle size={14} className="mr-2" /> Reject
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-all"
                      onClick={() => setIsProofModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
