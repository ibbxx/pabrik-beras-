import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Loader2, Users, Handshake, CheckCircle2,
  Clock, Phone, MapPin, Store, Package, MessageCircle,
  UserPlus, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
  name: string;
  whatsapp: string;
  business_name: string;
  location: string;
  volume_needs: string;
  message: string | null;
  status: string | null;
  created_at: string;
};

/* ── Helpers ─────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  new:       { label: "Baru",       bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  contacted: { label: "Dihubungi",  bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
  approved:  { label: "Disetujui",  bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-400" },
  rejected:  { label: "Ditolak",    bg: "bg-gray-50",   text: "text-gray-400",   dot: "bg-gray-300" },
};

const ORDER_STATUS: Record<string, string> = {
  pending: "Menunggu", processing: "Diproses", shipped: "Dikirim",
  delivered: "Selesai", cancelled: "Batal",
};

function StatusDot({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: any; label: string; value: number; accent: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl lg:text-2xl font-black text-black tracking-tight -mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 lg:py-24 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-sm font-black text-gray-800 tracking-tight">{title}</p>
      <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

/* ── Main Component ──────────────────────── */

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "resellers">("customers");
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderHistory[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [resellers, setResellers] = useState<ResellerApp[]>([]);
  const [resellerSearch, setResellerSearch] = useState("");
  const [selectedReseller, setSelectedReseller] = useState<ResellerApp | null>(null);
  const [isResellerModalOpen, setIsResellerModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedResellerIds, setSelectedResellerIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "customers") {
        const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setCustomers(data || []);
      } else {
        const { data, error } = await (supabase as any).from("reseller_applications").select("*").order("created_at", { ascending: false });
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
      const { data, error } = await supabase.from("orders").select("id, order_code, total_amount, status, created_at").eq("customer_id", customer.id).order("created_at", { ascending: false });
      if (error) throw error;
      setCustomerOrders(data || []);
    } catch (err: any) {
      toast.error("Gagal memuat riwayat: " + err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleViewReseller = (r: ResellerApp) => { setSelectedReseller(r); setIsResellerModalOpen(true); };

  const handleUpdateReseller = async (status: string) => {
    if (!selectedReseller) return;
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from("reseller_applications").update({ status }).eq("id", selectedReseller.id);
      if (error) throw error;
      toast.success("Status mitra berhasil diperbarui");
      setSelectedReseller({ ...selectedReseller, status });
      fetchData();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    const msg = encodeURIComponent(`Halo ${name}, terima kasih sudah mendaftar sebagai mitra reseller Pabrik Beras Desa Kurma. Kami ingin menindaklanjuti pendaftaran Anda.`);
    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank");
  };

  const toggleResellerSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedResellerIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedResellerIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedResellerIds.size === 0) return;
    if (!confirm(`Yakin ingin menghapus ${selectedResellerIds.size} mitra terpilih? Data tidak dapat dikembalikan.`)) return;

    setIsDeletingBulk(true);
    try {
      const ids = Array.from(selectedResellerIds);
      const { error } = await supabase.from("reseller_applications").delete().in("id", ids);
      if (error) throw error;
      
      toast.success(`${ids.length} mitra berhasil dihapus`);
      setSelectedResellerIds(new Set());
      setIsManageMode(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  /* ── Derived data ── */
  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || c.whatsapp.includes(customerSearch)
  );
  const filteredResellers = resellers.filter(r =>
    r.name.toLowerCase().includes(resellerSearch.toLowerCase()) || r.business_name?.toLowerCase().includes(resellerSearch.toLowerCase())
  );

  const resellerStats = useMemo(() => ({
    total: resellers.length,
    baru: resellers.filter(r => (r.status || "new") === "new").length,
    approved: resellers.filter(r => r.status === "approved").length,
  }), [resellers]);

  const tabBtn = (tab: "customers" | "resellers", icon: any, label: string, count: number) => {
    const Icon = icon;
    const active = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
          active
            ? "bg-black text-white shadow-lg shadow-black/10"
            : "bg-white text-gray-500 border border-gray-100 hover:border-gray-200 hover:text-black"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
        <span className={`ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-md ${active ? "bg-white/20" : "bg-gray-100"}`}>{count}</span>
      </button>
    );
  };

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-black">Database</h1>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">Kelola pelanggan & mitra reseller Anda</p>
        </div>
        <div className="flex gap-2">
          {tabBtn("customers", Users, "Pelanggan", customers.length)}
          {tabBtn("resellers", Handshake, "Reseller", resellers.length)}
        </div>
      </div>

      {/* ── CUSTOMERS VIEW ── */}
      {activeTab === "customers" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard icon={Users} label="Total Pelanggan" value={customers.length} accent="bg-black" />
            <StatCard icon={UserPlus} label="Bulan Ini" value={customers.filter(c => { const d = new Date(c.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length} accent="bg-gray-700" />
          </div>

          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <Input
              placeholder="Cari nama atau nomor WA..."
              className="pl-10 h-11 border-gray-100 rounded-xl text-xs font-medium focus-visible:ring-black/20 bg-white shadow-sm"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && (
              <button onClick={() => setCustomerSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-300 hover:text-black transition-colors" />
              </button>
            )}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada pelanggan" sub="Data pelanggan akan muncul setelah ada pesanan masuk." />
          ) : (
            <div className="grid gap-2.5">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleViewCustomer(c)}
                  className="w-full text-left bg-white border border-gray-100 rounded-2xl px-4 py-3.5 lg:px-5 lg:py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors text-gray-400">
                    <span className="text-xs font-black uppercase">{c.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs lg:text-sm font-bold text-black truncate">{c.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {c.whatsapp}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {c.city}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium hidden sm:block">
                    {new Date(c.created_at).toLocaleDateString("id-ID")}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RESELLERS VIEW ── */}
      {activeTab === "resellers" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Handshake} label="Total Mitra" value={resellerStats.total} accent="bg-black" />
            <StatCard icon={Clock} label="Pending" value={resellerStats.baru} accent="bg-amber-500" />
            <StatCard icon={CheckCircle2} label="Disetujui" value={resellerStats.approved} accent="bg-emerald-500" />
          </div>

          {/* Search and Manage */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input
                placeholder="Cari nama atau bisnis..."
                className="pl-10 h-11 border-gray-100 rounded-xl text-xs font-medium focus-visible:ring-black/20 bg-white shadow-sm"
                value={resellerSearch}
                onChange={(e) => setResellerSearch(e.target.value)}
              />
              {resellerSearch && (
                <button onClick={() => setResellerSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-300 hover:text-black transition-colors" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isManageMode && selectedResellerIds.size > 0 && (
                <Button 
                  variant="destructive" 
                  className="rounded-xl h-11 text-xs font-bold"
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                >
                  {isDeletingBulk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Hapus ({selectedResellerIds.size})
                </Button>
              )}
              <Button
                variant={isManageMode ? "outline" : "default"}
                className={`rounded-xl h-11 text-xs font-bold ${!isManageMode ? "bg-black text-white hover:bg-black/90" : "border-gray-200"}`}
                onClick={() => {
                  setIsManageMode(!isManageMode);
                  setSelectedResellerIds(new Set());
                }}
              >
                {isManageMode ? "Batal" : "Kelola"}
              </Button>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : filteredResellers.length === 0 ? (
            <EmptyState icon={Handshake} title="Belum ada pendaftar" sub="Calon mitra yang mengisi formulir kemitraan akan muncul di sini." />
          ) : (
            <div className="grid gap-2.5">
              {filteredResellers.map((r) => (
                <div
                  key={r.id}
                  onClick={(e) => {
                    if (isManageMode) toggleResellerSelection(r.id, e);
                    else handleViewReseller(r);
                  }}
                  className={`w-full text-left bg-white border ${selectedResellerIds.has(r.id) ? "border-black shadow-md ring-1 ring-black" : "border-gray-100 hover:border-gray-200"} rounded-2xl px-4 py-3.5 lg:px-5 lg:py-4 flex items-center gap-4 hover:shadow-sm transition-all group cursor-pointer`}
                >
                  {isManageMode && (
                    <div className="shrink-0 mr-1">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedResellerIds.has(r.id) ? "bg-black border-black text-white" : "border-gray-300 bg-gray-50"
                      }`}>
                        {selectedResellerIds.has(r.id) && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </div>
                  )}
                  <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors text-gray-400 ${
                    selectedResellerIds.has(r.id) ? "bg-black text-white" : "bg-gray-50 group-hover:bg-black group-hover:text-white"
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs lg:text-sm font-bold text-black truncate">{r.name}</p>
                      <StatusDot status={r.status || "new"} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 truncate">
                        <Store className="w-2.5 h-2.5 shrink-0" /> {r.business_name || "-"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" /> {r.location || "-"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <Package className="w-2.5 h-2.5 shrink-0" /> {r.volume_needs || "-"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium hidden sm:block whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </span>
                  {!isManageMode && <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CUSTOMER DETAIL MODAL ── */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-xl bg-white border-none rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 lg:p-6 border-b border-gray-100">
            <DialogTitle className="text-base lg:text-lg font-black tracking-tight flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-xs font-black">
                {selectedCustomer?.full_name.charAt(0)}
              </div>
              {selectedCustomer?.full_name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="p-5 lg:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">WhatsApp</p>
                  <p className="text-xs font-bold text-black">{selectedCustomer.whatsapp}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Kota</p>
                  <p className="text-xs font-bold text-black">{selectedCustomer.city}</p>
                </div>
                <div className="col-span-2 bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Alamat</p>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">
                    {selectedCustomer.address}, Kec. {selectedCustomer.district}, {selectedCustomer.city}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Riwayat Pesanan</h3>
                {loadingOrders ? (
                  <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-300" /></div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-[11px] text-gray-300 font-medium text-center py-6">Belum ada pesanan.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100/70 transition-colors">
                        <div>
                          <p className="font-mono font-bold text-[11px] text-black">{order.order_code}</p>
                          <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                            {new Date(order.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black text-xs">Rp {order.total_amount.toLocaleString("id-ID")}</p>
                          <Badge variant="outline" className="text-[8px] font-bold px-2 py-0 bg-white mt-1">
                            {ORDER_STATUS[order.status] || order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-black text-white rounded-xl h-11 font-bold text-xs hover:bg-black/90 transition-all active:scale-[0.98]"
                onClick={() => openWhatsApp(selectedCustomer.whatsapp, selectedCustomer.full_name)}
              >
                <MessageCircle className="mr-2 h-3.5 w-3.5" /> Hubungi via WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── RESELLER DETAIL MODAL ── */}
      <Dialog open={isResellerModalOpen} onOpenChange={setIsResellerModalOpen}>
        <DialogContent className="max-w-lg bg-white border-none rounded-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 lg:p-6 border-b border-gray-100">
            <DialogTitle className="text-base lg:text-lg font-black tracking-tight flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              Detail Mitra
            </DialogTitle>
          </DialogHeader>
          {selectedReseller && (
            <div className="p-5 lg:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Nama", value: selectedReseller.name },
                  { label: "WhatsApp", value: selectedReseller.whatsapp },
                  { label: "Nama Usaha", value: selectedReseller.business_name || "-" },
                  { label: "Lokasi", value: selectedReseller.location || "-" },
                  { label: "Volume/Bulan", value: selectedReseller.volume_needs || "-" },
                  { label: "Tanggal Daftar", value: new Date(selectedReseller.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                    <p className="text-xs font-bold text-black">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Message */}
              {selectedReseller.message && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Pesan Tambahan</p>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">
                      "{selectedReseller.message}"
                    </p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Status Saat Ini</p>
                <div className="flex flex-wrap gap-2">
                  {(["new", "contacted", "approved", "rejected"] as const).map((s) => {
                    const isActive = (selectedReseller.status || "new") === s;
                    const meta = STATUS_MAP[s];
                    return (
                      <button
                        key={s}
                        disabled={isSaving}
                        onClick={() => handleUpdateReseller(s)}
                        className={`h-9 px-4 rounded-xl text-[10px] font-bold transition-all active:scale-95 border ${
                          isActive
                            ? "bg-black text-white border-black shadow-md shadow-black/10"
                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-black"
                        }`}
                      >
                        {isSaving && isActive ? <Loader2 className="h-3 w-3 animate-spin mr-1.5 inline" /> : null}
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1 bg-black text-white rounded-xl h-11 font-bold text-xs hover:bg-black/90 transition-all active:scale-[0.98]"
                  onClick={() => openWhatsApp(selectedReseller.whatsapp, selectedReseller.name)}
                >
                  <MessageCircle className="mr-2 h-3.5 w-3.5" /> Hubungi via WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 text-xs font-bold text-gray-400 hover:text-black hover:bg-transparent"
                  onClick={() => setIsResellerModalOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
