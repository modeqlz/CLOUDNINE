import { useEffect, useState } from 'react';
import Head from 'next/head';
import LoadingCard from '../components/LoadingCard';

function readStoredProfile() {
  try {
    const a = localStorage.getItem('profile');
    if (a) return JSON.parse(a);
  } catch {}
  try {
    const b = sessionStorage.getItem('profile');
    if (b) return JSON.parse(b);
  } catch {}
  return null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      setBusy(true);
      setMsg('');

      // ⛔ если пользователь нажал «Выйти» — не автологиним
      if (sessionStorage.getItem('logged_out') === '1') {
        setBusy(false);
        setMsg('Вы вышли из аккаунта.');
        return;
      }

      // 1) пробуем взять из local/session storage
      const cached = readStoredProfile();
      if (cached) {
        setProfile(cached);
        setBusy(false);
        return;
      }

      // 2) тихий ре-логин, если есть initData из Telegram
      try {
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
        const initData = tg?.initData || '';
        if (initData) {
          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
          }).then(r => r.json());

          if (res.ok && res.profile) {
            try { localStorage.setItem('profile', JSON.stringify(res.profile)); } catch {}
            setProfile(res.profile);
            setBusy(false);
            return;
          }
        }
      } catch {}

      // 3) не вышло
      setBusy(false);
      setMsg('Нет данных профиля. Вернитесь на главную и войдите заново.');
    })();
  }, []);

  function handleLogout() {
    try { localStorage.removeItem('profile'); } catch {}
    try { sessionStorage.removeItem('profile'); } catch {}
    try { sessionStorage.setItem('logged_out', '1'); } catch {}
    // уходим на главную так, чтобы нельзя было вернуться «Назад»
    window.location.replace('/');
  }

  if (busy) {
    return (
      <>
        <Head><title>Профиль — CloudNine Market</title></Head>
        <div className="overlay" aria-hidden>
          <div className="overlay-backdrop" />
          <div className="overlay-panel">
            <LoadingCard
              messages={[
                'Ищем сохранённый профиль…',
                'Проверяем авторизацию…',
                'Восстанавливаем сессию…',
                'Готовим профиль…'
              ]}
              intervalMs={700}
            />
            <div className="overlay-hint">Секунду…</div>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Head><title>Профиль — CloudNine Market</title></Head>
        <div className="container">
          <div className="hero" style={{maxWidth:560, textAlign:'center', padding:'32px'}}>
            <p className="lead" style={{marginBottom:16}}>{msg || 'Нет данных профиля.'}</p>
            <div className="row" style={{justifyContent:'center'}}>
              <a className="btn btn-primary" href="/">На главную</a>
            </div>
          </div>
        </div>
      </>
    );
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Без имени';
  const at = profile.username ? '@' + profile.username : 'без username';
  const avatar = profile.photo_url || '/placeholder.png';

  return (
    <>
      <Head><title>Профиль — CloudNine Market</title></Head>
      <div className="container">
        <div className="hero" style={{maxWidth:560}}>
          <div className="brand" style={{justifyContent:'space-between', width:'100%'}}>
            <span>Профиль</span>
            <button className="btn btn-ghost" onClick={handleLogout}>Выйти</button>
          </div>

          <div style={{display:'flex', alignItems:'center', gap:14, marginTop:6}}>
            <img
              src={avatar}
              alt="avatar"
              style={{
                width:56, height:56, borderRadius:16,
                objectFit:'cover', border:'1px solid var(--border)'
              }}
            />
            <div>
              <div className="h1" style={{fontSize:22, margin:'0 0 4px'}}>{name}</div>
              <div className="lead" style={{fontSize:14, margin:0}}>{at}</div>
            </div>
          </div>

          <div style={{marginTop:16, opacity:.85, fontSize:14}}>
            <div><b>ID:</b> {profile.id}</div>
            <div><b>Источник:</b> Telegram WebApp</div>
          </div>
        </div>
      </div>
    </>
  );
}