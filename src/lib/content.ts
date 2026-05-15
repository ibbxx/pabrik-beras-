export function renderGreenMarkup(value: string) {
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return escaped.replace(/\[green\](.*?)\[\/green\]/g, '<span class="text-green-500">$1</span>');
}

export function sanitizeGoogleMapsIframe(value: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  const iframe = doc.querySelector("iframe");
  const src = iframe?.getAttribute("src") || "";

  if (!src.startsWith("https://www.google.com/maps") && !src.startsWith("https://maps.google.com/maps")) {
    return "";
  }

  return `<iframe src="${src}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}
