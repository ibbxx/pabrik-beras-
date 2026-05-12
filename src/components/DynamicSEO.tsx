import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

export default function DynamicSEO() {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings.seo_title) {
      document.title = settings.seo_title;
    } else {
      document.title = "Pabrik Beras Desa Kurma - Beras Premium Langsung dari Penggilingan";
    }

    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      let element = document.querySelector(isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) element.setAttribute('property', name);
        else element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (settings.seo_description) {
      updateMetaTag('description', settings.seo_description);
      updateMetaTag('og:description', settings.seo_description, true);
    }

    if (settings.seo_keywords) {
      updateMetaTag('keywords', settings.seo_keywords);
    }

    updateMetaTag('og:title', document.title, true);
    updateMetaTag('og:type', 'website', true);

  }, [settings]);

  return null;
}
