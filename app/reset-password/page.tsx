
"use client";

import { useEffect, useState, type FormEvent, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("جاري التحقق من رابط الاستعادة...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyLink() {
      const supabase = createClient();

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const hash = new URLSearchParams(url.hash.slice(1));

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const errorDescription = hash.get("error_description");

        if (errorDescription) {
          throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          throw new Error("رابط الاستعادة غير صالح أو منتهي. اطلبي رابطًا جديدًا.");
        }

        if (active) {
          setReady(true);
          setMessage("");
        }
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "تعذر التحقق من الرابط. اطلبي رابطًا جديدًا."
          );
        }
      }
    }

    verifyLink();

    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 خانات على الأقل.");
      return;
    }

    if (password !== confirm) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();

      setMessage("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
      setTimeout(() => router.replace("/"), 1500);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "تعذر تغيير كلمة المرور."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <section style={panel}>
        <div style={{ fontWeight: 900, letterSpacing: 3, color: "#2766d9" }}>
          AMAN
        </div>

        <h1 style={{ fontSize: 25, margin: "18px 0 8px" }}>
          تغيير كلمة المرور
        </h1>

        {ready && (
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <label>
              كلمة المرور الجديدة
              <input
                style={field}
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label>
              تأكيد كلمة المرور
              <input
                style={field}
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>

            <button disabled={busy} style={button}>
              {busy ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}

        {message && (
          <p role="status" style={{ lineHeight: 1.7, color: "#9b2434" }}>
            {message}
          </p>
        )}

        <button
          onClick={() => router.replace("/")}
          style={{ ...button, background: "#eef2f8", color: "#263449", marginTop: 12 }}
        >
          العودة إلى AMAN
        </button>
      </section>
    </main>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#f5f7fb",
  fontFamily: "Arial, sans-serif",
};

const panel: CSSProperties = {
  width: "min(440px, 100%)",
  background: "white",
  padding: 28,
  borderRadius: 18,
  boxShadow: "0 12px 40px #17255418",
};

const field: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  marginTop: 7,
  border: "1px solid #ccd5e2",
  borderRadius: 9,
  fontSize: 16,
};

const button: CSSProperties = {
  width: "100%",
  padding: 13,
  border: 0,
  borderRadius: 9,
  background: "#2766d9",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
