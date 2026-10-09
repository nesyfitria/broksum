// ===== Konfigurasi bersama semua halaman =====
const SUPABASE_URL = "https://mocdrsgehlyjbxgjtxam.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2Ryc2dlaGx5amJ4Z2p0eGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODI4NjEsImV4cCI6MjA5NjA1ODg2MX0.AoQHv1kOBj6XJXdKJUbECZ0OHnCHvJcglzVY0XDu6jM";
// ==============================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const parse = s => s.split(/[\s,;]+/).map(x => x.trim().toUpperCase()).filter(Boolean);
const msg = t => $("msg").textContent = t || "";

function navLinks() {
  const q = () => new URLSearchParams({
    from: $("from").value, to: $("to").value, em: $("emiten").value,
    br: $("broker") ? $("broker").value : (new URLSearchParams(location.search).get("br") || "")
  }).toString();
  const upd = () => document.querySelectorAll("nav a").forEach(a => a.href = a.dataset.p + "?" + q());
  document.querySelectorAll(".bar input").forEach(i => i.addEventListener("input", upd));
  upd();
}

// Isi input dari alamat (?from=&to=&em=&br=) atau default 30 hari terakhir. Mengembalikan true jika perlu langsung dijalankan.
async function initInputs() {
  const p = new URLSearchParams(location.search);
  if (p.get("em")) $("emiten").value = p.get("em");
  if ($("broker") && p.get("br")) $("broker").value = p.get("br");
  const has = !!(p.get("from") && p.get("to"));
  try {
    if (has) { $("from").value = p.get("from"); $("to").value = p.get("to"); $("info").textContent = "Siap"; }
    else {
      const {data, error} = await sb.from("v_broksum").select("trade_date").order("trade_date", {ascending: false}).limit(1);
      if (error) throw error;
      const last = data[0].trade_date, d = new Date(last); d.setDate(d.getDate() - 30);
      $("to").value = last; $("from").value = d.toISOString().slice(0, 10);
      $("info").textContent = "Data terakhir: " + last;
    }
  } catch (e) {
    msg("Tidak bisa terhubung ke Supabase: " + (e.message || e) + ". Cek anon key dan policy RLS.");
    $("info").textContent = "Belum terhubung";
  }
  navLinks();
  return has;
}
