import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem("site_settings");
    if (cached) {
      try {
        setSettings(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }

    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from("site_settings").select("key, value");
        if (error) throw error;

        const map: Record<string, any> = {};
        ((data as any[]) || []).forEach((row) => {
          let val = row.value;
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { val = JSON.parse(val); } catch (e) {}
          }
          map[row.key] = val;
        });

        if (!map["contact_whatsapp"] || map["contact_whatsapp"].includes("082355148758") || map["contact_whatsapp"].includes("0812")) {
          map["contact_whatsapp"] = "082355148758";
        }
        if (!map["contact_address"] || map["contact_address"].includes("Demak")) {
          map["contact_address"] = "Jl. H. S. Mengga, Lorong Makassar Baru, Dusun Paredeang, Desa Kurma, Kecamatan Mapilli, Sulawesi Barat";
        }
        
        localStorage.setItem("site_settings", JSON.stringify(map));
        setSettings(map);
      } catch (err) {
        console.error("Error fetching site settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
