// pages/search.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  async function runSearch(query) {
    const trimmed = (query || '').replace(/^@/, '').trim();
    if (!trimmed) { setResults([]); return; }
    try {
      setBusy(true); setError(null);
      const res = await fetch(`/api/searchUsers?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search error');
      setResults(data.items || []);
    } catch (e) {
      setError(e.message || 'Ошибка поиска');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => runSearch(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <Head><title>Найти человека — CloudNine</title></Head>
      <div className="container">
        <div className="hero">
          <div className="brand"><span className="badge">Search</span></div>
          <h1 className="h1">Найти человека</h1>
          <p className="lead">Напишите @никнейм, нажмите на результат — откроется профиль.</p>

          <div className="search-row">
            <span className="at">@</span>
            <input
              className="input"
              placeholder="modelqz"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary" onClick={()=>runSearch(q)} disabled={busy}>
              {busy ? 'Ищем…' : 'Найти'}
            </button>
          </div>

          {error && <div className="foot" style={{color:'#ffb4b4'}}>Ошибка: {error}</div>}

          <div className="user-list">
            {results.map(u => (
              <a key={u.username} className="user-row" href={`/user/${u.username}`}>
                <img src={u.avatar} alt="" />
                <div className="user-meta">
                  <div className="user-name">{u.name || u.username}</div>
                  <div className="user-handle">@{u.username}</div>
                </div>
                <span className="user-open">Открыть</span>
              </a>
            ))}
            {!busy && !error && results.length === 0 && q.trim() !== '' && (
              <div className="foot">Ничего не найдено.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}