import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase.from("site_settings").select("key, value");
        if (error) throw error;

        const map: Record<string, any> = {};
        ((data as any[]) || []).forEach((row) => {
          map[row.key] = row.value;
        });
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
