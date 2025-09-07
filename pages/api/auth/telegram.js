// pages/api/auth/telegram.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Явно укажем Node-runtime (на всякий случай)
export const config = { runtime: "nodejs" };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Разбор строки initData в объект
function parseQueryString(qs) {
  const out = {};
  for (const part of String(qs).split("&")) {
    const [k, v = ""] = part.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return out;
}

// Проверка подписи initData (Telegram WebApp)
function verifyInitData(initData, botToken) {
  const obj = parseQueryString(initData);
  if (!obj.hash) return { ok: false, reason: "hash missing" };

  const { hash, ...rest } = obj;

  // data_check_string: отсортированные "key=value", без hash, через \n
  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

  // Наш хэш:
  const calcHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (calcHash !== hash) return { ok: false, reason: "invalid hash" };

  // TTL по auth_date (например, 24ч)
  const authDateSec = Number(rest.auth_date || "0");
  if (!authDateSec || Date.now() / 1000 - authDateSec > 60 * 60 * 24) {
    return { ok: false, reason: "auth_date too old" };
  }

  // user приходит JSON-строкой в поле 'user'
  let user = null;
  try {
    user = JSON.parse(rest.user || "{}");
  } catch {
    return { ok: false, reason: "bad user json" };
  }

  if (!user || !user.id) return { ok: false, reason: "no user" };

  return { ok: true, user };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Проверим наличие env
  if (!TELEGRAM_BOT_TOKEN) return res.status(500).json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" });
  if (!SUPABASE_URL) return res.status(500).json({ ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL" });
  if (!SUPABASE_SERVICE_ROLE) return res.status(500).json({ ok: false, error: "Missing SUPABASE_SERVICE_ROLE" });

  try {
    // Поддержим и raw string, и body { initData }
    const initData = typeof req.body === "string" ? req.body : (req.body && req.body.initData) || "";
    if (!initData) return res.status(400).json({ ok: false, error: "No initData provided" });

    // Валидация initData
    const v = verifyInitData(initData, TELEGRAM_BOT_TOKEN);
    if (!v.ok) return res.status(401).json({ ok: false, error: v.reason || "Invalid initData" });

    const u = v.user;

    // Профиль для ответа
    const profile = {
      id: u.id,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      username: u.username || "",
      photo_url: u.photo_url || "",
      language_code: u.language_code || null,
      is_premium: u.is_premium ?? null,
    };

    // Сохраняем/обновляем в Supabase (таблица public.users)
    // См. SQL схему ниже, если ещё не создал таблицу
    const { error, data } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: u.id,
          username: u.username ?? null,
          first_name: u.first_name ?? null,
          last_name: u.last_name ?? null,
          photo_url: u.photo_url ?? null,
          language_code: u.language_code ?? null,
          is_premium: u.is_premium ?? null,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "telegram_id" }
      )
      .select();

    if (error) {
      console.error("Supabase upsert error:", error);
      profile.database_saved = false;
      profile.database_error = error.message;
      // авторизацию не рвём — просто сообщим в ответе
      return res.status(200).json({ ok: true, profile });
    }

    profile.database_saved = true;
    profile.database_row = data?.[0] ?? null;

    return res.status(200).json({ ok: true, profile });
  } catch (e) {
    console.error("[api/auth/telegram] error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}