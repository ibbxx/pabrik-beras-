import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Module-level cache so all useSettings() callers share one fetch
let cachedSettings: Record<string, any> | null = null;
let fetchPromise: Promise<Record<string, any>> | null = null;
const listeners: Set<(s: Record<string, any>) => void> = new Set();

async function loadSettings(): Promise<Record<string, any>> {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const map: Record<string, any> = {};
      ((data as any[]) || []).forEach((row) => {
        let val = row.value;
        if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
          try { val = JSON.parse(val); } catch (e) {}
        }
        map[row.key] = val;
      });

      // Defaults
      if (!map["contact_whatsapp"] || map["contact_whatsapp"].includes("0812")) {
        map["contact_whatsapp"] = "082355148758";
      }
      if (!map["contact_address"] || map["contact_address"].includes("Demak")) {
        map["contact_address"] =
          "Jl. H. S. Mengga, Lorong Makassar Baru, Dusun Paredeang, Mapaili, Kecamatan Mapilli, Sulawesi Barat";
      }
      if (!map["warehouse_address"]) {
        map["warehouse_address"] =
          "Jl. Andi Mappaodang No.125, Balang Baru, Kec. Tamalate, Kota Makassar, Sulawesi Selatan 90224";
      }

      localStorage.setItem("site_settings", JSON.stringify(map));
      cachedSettings = map;
      listeners.forEach((cb) => cb(map));
      return map;
    } catch (err) {
      console.error("Error fetching site settings:", err);
      fetchPromise = null; // allow retry on next mount
      return cachedSettings ?? {};
    }
  })();

  return fetchPromise;
}

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, any>>(() => {
    // Reuse in-memory cache first
    if (cachedSettings) return cachedSettings;
    // Fall back to localStorage
    try {
      const raw = localStorage.getItem("site_settings");
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  });
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoading(false);
      return;
    }

    let active = true;

    loadSettings().then((map) => {
      if (active) {
        setSettings(map);
        setLoading(false);
      }
    });

    // Subscribe to future updates (e.g. second call finishes after component mounts)
    const cb = (map: Record<string, any>) => {
      if (active) {
        setSettings(map);
        setLoading(false);
      }
    };
    listeners.add(cb);

    return () => {
      active = false;
      listeners.delete(cb);
    };
  }, []);

  return { settings, loading };
}
