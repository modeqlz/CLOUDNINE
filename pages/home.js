import { useEffect, useState } from 'react';
import Head from 'next/head';

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

export default function HomePage() {
  const [p, setP] = useState(null);

  useEffect(() => {
    // если пользователь вышел — на главную
    if (sessionStorage.getItem('logged_out') === '1') {
      window.location.replace('/');
      return;
    }
    const cached = readStoredProfile();
    if (!cached) {
      // нет профиля — на экран логина
      window.location.replace('/');
      return;
    }
    setP(cached);
  }, []);

  if (!p) {
    return (
      <div className="container">
        <div className="hero" style={{maxWidth:560, textAlign:'center'}}>Загружаем меню…</div>
      </div>
    );
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Гость';
  const avatar = p.photo_url || '/placeholder.png';
  const at = p.username ? '@' + p.username : '';

  return (
    <>
      <Head><title>Главное меню — CloudNine Market</title></Head>
      <div className="container">
        <div className="hero" style={{maxWidth:980}}>
          {/* top bar */}
          <div className="topbar">
            <div className="topbar-left">
              <img className="avatar" src={avatar} alt="avatar" />
              <div className="hello">
                <div className="hello-hi">Привет, {name}</div>
                <div className="hello-sub">{at || 'Добро пожаловать!'}</div>
              </div>
            </div>
            <a className="btn btn-ghost" href="/profile" aria-label="Профиль">
              Профиль
            </a>
          </div>

          {/* grid tiles */}
          <div className="grid">
            {/* Auctions */}
            <a className="tile tile-auction" href="/auctions">
              <div className="tile-head">
                <div className="tile-title">Аукционы</div>
                <div className="tile-badge">Live</div>
              </div>
              <div className="tile-desc">
                Делай ставки на редкие подарки в реальном времени.
              </div>
            </a>

            {/* Gifts */}
            <a className="tile tile-gifts" href="/gifts">
              <div className="tile-head">
                <div className="tile-title">Подарки</div>
              </div>
              <div className="tile-desc">
                Каталог наборов и коллекций — отправляй друзьям в один тап.
              </div>
            </a>

            {/* Plans */}
            <a className="tile tile-plans" href="/plans">
              <div className="tile-head">
                <div className="tile-title">Тарифы</div>
              </div>
              <ul className="tile-list">
                <li>Бесплатный — стартуй без рисков</li>
                <li>Plus — расширенная витрина</li>
                <li>Pro — максимум для продавцов</li>
              </ul>
            </a>

            {/* My purchases */}
            <a className="tile tile-orders" href="/orders">
              <div className="tile-head">
                <div className="tile-title">Покупки</div>
              </div>
              <div className="tile-desc">История покупок и статусы отправки.</div>
            </a>

            {/* Create gift */}
            <a className="tile tile-create" href="/create">
              <div className="tile-head">
                <div className="tile-title">Создать подарок</div>
              </div>
              <div className="tile-desc">Загрузи арт, опиши и выставь на продажу.</div>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}