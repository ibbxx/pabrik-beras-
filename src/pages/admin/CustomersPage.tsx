import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Loader2,
  Eye,
  Phone,
  User,
  ShoppingBag,
  Users,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Customer = {
  id: string;
  full_name: string;
  whatsapp: string;
  address: string;
  city: string;
  district: string;
  created_at: string;
};

type OrderHistory = {
  id: string;
  order_code: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type ResellerApp = {
  id: string;
  full_name: string;
  whatsapp: string;
  business_name: string;
  city: string;
  follow_up_status: string;
  admin_notes: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("customers");
  const [loading, setLoading] = useState(true);

  // Customer states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderHistory[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Reseller states
  const [resellers, setResellers] = useState<ResellerApp[]>([]);
  const [resellerSearch, setResellerSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<ResellerApp | null>(null);
  const [isResellerModalOpen, setIsResellerModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "customers") {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setCustomers(data || []);
      } else {
        const { data, error } = await (supabase as any)
          .from("reseller_applications")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setResellers(data || []);
      }
    } catch (err: any) {
      toast.error("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, total_amount, status, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err: any) {
      toast.error("Gagal memuat riwayat: " + err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleViewReseller = (reseller: ResellerApp) => {
    setSelectedReseller(reseller);
    setAdminNote(reseller.admin_notes || "");
    setIsResellerModalOpen(true);
  };

  const handleUpdateReseller = async (status: string) => {
    if (!selectedReseller) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("reseller_applications")
        .update({ follow_up_status: status, admin_notes: adminNote })
        .eq("id", selectedReseller.id);
      if (error) throw error;
      toast.success("Data mitra berhasil diperbarui");
      setIsResellerModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(
      `Halo ${name}, terima kasih sudah mendaftar sebagai mitra reseller Pabrik Beras Desa Kurma. Kami ingin menindaklanjuti pendaftaran Anda.`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Baru</Badge>;
      case "contacted": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-100">Dihubungi</Badge>;
      case "approved": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 font-bold">Disetujui</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "Menunggu", processing: "Diproses", shipped: "Dikirim",
      delivered: "Selesai", cancelled: "Dibatalkan"
    };
    return <Badge variant="outline" className="text-xs">{map[status] || status}</Badge>;
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.whatsapp.includes(customerSearch)
  );

  const filteredResellers = resellers.filter(r =>
    r.full_name.toLowerCase().includes(resellerSearch.toLowerCase()) ||
    r.business_name?.toLowerCase().includes(resellerSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pelanggan & Mitra Reseller</h1>
        <p className="text-gray-500 text-sm">Kelola data pembeli dan mitra reseller Anda.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <User size={14} /> Pelanggan
          </TabsTrigger>
          <TabsTrigger value="resellers" className="flex items-center gap-2">
            <Users size={14} /> Mitra Reseller
          </TabsTrigger>
        </TabsList>

        {/* ── CUSTOMERS TAB ── */}
        <TabsContent value="customers" className="space-y-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari nama atau nomor WhatsApp..."
              className="pl-9 h-10"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Belum ada pelanggan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium text-gray-900">{customer.full_name}</TableCell>
                      <TableCell>
                        <a
                          href={`https://wa.me/${customer.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-green-700 hover:underline text-sm"
                        >
                          <Phone size={12} /> {customer.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{customer.city}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye size={14} className="mr-1" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── RESELLERS TAB ── */}
        <TabsContent value="resellers" className="space-y-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari nama atau nama usaha..."
              className="pl-9 h-10"
              value={resellerSearch}
              onChange={(e) => setResellerSearch(e.target.value)}
            />
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Nama Usaha</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                    </TableCell>
                  </TableRow>
                ) : filteredResellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Belum ada pendaftar reseller.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResellers.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-gray-900">{r.full_name}</TableCell>
                      <TableCell className="text-gray-600">{r.business_name || "-"}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{r.city || "-"}</TableCell>
                      <TableCell>{getStatusBadge(r.follow_up_status || "new")}</TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => openWhatsApp(r.whatsapp, r.full_name)}
                        >
                          <MessageCircle size={14} className="mr-1" /> WA
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewReseller(r)}
                        >
                          <Eye size={14} className="mr-1" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── CUSTOMER DETAIL MODAL ── */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={18} /> {selectedCustomer?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">WhatsApp</p>
                  <a
                    href={`https://wa.me/${selectedCustomer.whatsapp.replace(/\D/g, "").replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:underline font-medium flex items-center gap-1"
                  >
                    <Phone size={12} /> {selectedCustomer.whatsapp}
                  </a>
                </div>
                <div>
                  <p className="text-gray-500">Kota</p>
                  <p className="font-medium">{selectedCustomer.city}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Alamat</p>
                  <p className="font-medium">
                    {selectedCustomer.address}, Kec. {selectedCustomer.district}, {selectedCustomer.city}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 border-b pb-1 flex items-center gap-2">
                  <ShoppingBag size={16} /> Riwayat Pesanan
                </h3>
                {loadingOrders ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-green-600" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Belum ada pesanan.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                        <div>
                          <p className="font-mono font-bold text-sm text-gray-900">{order.order_code}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700 text-sm">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                          {getOrderStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── RESELLER DETAIL MODAL ── */}
      <Dialog open={isResellerModalOpen} onOpenChange={setIsResellerModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Mitra: {selectedReseller?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedReseller && (
            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs">Nama</p>
                  <p className="font-semibold">{selectedReseller.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">WhatsApp</p>
                  <p className="font-semibold">{selectedReseller.whatsapp}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Nama Usaha</p>
                  <p className="font-semibold">{selectedReseller.business_name || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Kota</p>
                  <p className="font-semibold">{selectedReseller.city || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Status Saat Ini</p>
                  <div className="mt-1">{getStatusBadge(selectedReseller.follow_up_status || "new")}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Catatan Admin</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Tulis catatan untuk pendaftar ini..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-gray-700">Perbarui Status</p>
                <div className="flex flex-wrap gap-2">
                  {["new", "contacted", "approved", "rejected"].map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedReseller.follow_up_status === s ? "default" : "outline"}
                      disabled={isSaving}
                      onClick={() => handleUpdateReseller(s)}
                      className="capitalize rounded-full"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {{ new: "Baru", contacted: "Dihubungi", approved: "Setujui", rejected: "Tolak" }[s]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t gap-3">
                <Button
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50 flex items-center gap-2"
                  onClick={() => openWhatsApp(selectedReseller.whatsapp, selectedReseller.full_name)}
                >
                  <MessageCircle size={16} /> Hubungi via WhatsApp
                </Button>
                <Button variant="ghost" onClick={() => setIsResellerModalOpen(false)}>Tutup</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
