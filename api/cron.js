export default async function handler(req, res) {
  // Opsional: Proteksi API agar hanya Vercel Cron yang bisa memanggilnya
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Ambil URL dan Anon Key dari environment variables (mengikuti prefix Vite)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: 'Supabase Env Vars missing' });
    }

    // Melakukan PING ke Supabase dengan fetch biasa (menggunakan REST API ke salah satu tabel)
    // Di sini kita fetch 1 data dari tabel apa saja, misalnya 'site_settings'
    const response = await fetch(`${supabaseUrl}/rest/v1/site_settings?limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'Ping Supabase Berhasil!' });
    } else {
      const errorText = await response.text();
      return res.status(500).json({ success: false, message: 'Ping gagal', error: errorText });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
