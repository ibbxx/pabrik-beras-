import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sudah login? Langsung ke dashboard
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Silakan masukkan email dan kata sandi");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      toast.success("Login berhasil!");
      navigate("/admin");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("Email atau kata sandi salah");
      } else {
        toast.error("Gagal login: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 lg:p-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-black text-white mb-6">
            <Lock size={20} />
          </div>
          <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tighter text-black">Admin Access</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Desa Kurma Factory</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@desapabrik.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 lg:h-12 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kata Sandi</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 lg:h-12 border-gray-100 rounded-lg text-xs font-bold focus-visible:ring-black"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 lg:h-12 bg-black hover:bg-black/90 text-white font-black text-xs uppercase tracking-widest mt-4 rounded-lg transition-all active:scale-95"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "PROSES..." : "MASUK"}
          </Button>
        </form>
      </div>

      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-10">
        &copy; {new Date().getFullYear()} DESA KURMA FACTORY
      </p>
    </div>
  );
}
