import { useEffect, useMemo, useRef, useState } from "react";

export default function LoadingCard({
  messages = [
    "Считываем данные Telegram…",
    "Проверяем подпись WebApp…",
    "Создаём профиль…",
    "Готово!"
  ],
  intervalMs = 900,
  done = false
}) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.length ? messages : ["Загрузка…"]),
    [messages]
  );

  useEffect(() => {
    if (done) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % safeMessages.length);
    }, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [safeMessages.length, intervalMs, done]);

  return (
    <div className="loading-card">
      <div className="loading-ring">
        <div className="ring"></div>
        <div className="ring blur"></div>
      </div>
      <div className="loading-text">
        <div className="line">{safeMessages[idx]}</div>
      </div>
      <div className="loading-bar">
        <div className="track"><span className="fill" /></div>
      </div>
    </div>
  );
}