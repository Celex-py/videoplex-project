import { useCallback, useEffect, useState } from 'react';
import './AdminContentManager.css';

const blank = { title: '', description: '', posterUrl: '', videoUrl: '', sourceType: 'youtube', category: 'Movies', releaseYear: '', featured: false, visibility: 'UNLISTED' };
const sources = ['youtube', 'mp4', 'webm', 'hls', 'external'];

export default function AdminContentManager({ request, notify }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await request('GET', '/api/admin/library'); setItems(data.items || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { load(); }, [load]);
  const change = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const reset = () => { setForm(blank); setEditing(null); };
  const edit = item => {
    setEditing(item.id);
    setForm({ title: item.title || '', description: item.description || '', posterUrl: item.posterUrl || '', videoUrl: item.videoUrl || '', sourceType: item.sourceType || 'youtube', category: item.category || 'Movies', releaseYear: item.releaseYear || '', featured: !!item.featured, visibility: item.visibility || 'UNLISTED' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, releaseYear: form.releaseYear ? Number(form.releaseYear) : null };
      await request(editing ? 'PATCH' : 'POST', editing ? '/api/admin/library/' + editing : '/api/admin/library', payload);
      notify(editing ? 'Catalogue item updated' : 'Content added to catalogue');
      reset(); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  const remove = async item => {
    if (!window.confirm('Delete "' + item.title + '" from the catalogue?')) return;
    try { await request('DELETE', '/api/admin/library/' + item.id); notify('Catalogue item deleted'); await load(); }
    catch (e) { setError(e.message); }
  };
  const publish = async item => {
    try { await request('PATCH', '/api/admin/library/' + item.id, { visibility: item.visibility === 'PUBLIC' ? 'UNLISTED' : 'PUBLIC' }); notify(item.visibility === 'PUBLIC' ? 'Item unpublished' : 'Item published'); await load(); }
    catch (e) { setError(e.message); }
  };
  return <section className="acm">
    <header className="acm-head"><div><span className="acm-kicker">VIDEOPLEX STUDIO</span><h1>Content manager</h1><p>Add and organise titles in your Movies &amp; Videos catalogue.</p></div><button type="button" onClick={load} className="acm-quiet">↻ Refresh</button></header>
    {error && <div className="acm-error">{error}</div>}
    <form className="acm-form" onSubmit={save}>
      <div className="acm-form-head"><div><h2>{editing ? 'Edit title' : 'Add new content'}</h2><p>Use a video URL that you own or are authorised to embed or distribute.</p></div>{editing && <button type="button" className="acm-quiet" onClick={reset}>Cancel edit</button>}</div>
      <div className="acm-fields">
        <label>Title *<input required value={form.title} onChange={e => change('title', e.target.value)} placeholder="e.g. The Journey" /></label>
        <label>Video source *<select value={form.sourceType} onChange={e => change('sourceType', e.target.value)}>{sources.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label>
        <label className="acm-wide">Video URL *<input required type="url" value={form.videoUrl} onChange={e => change('videoUrl', e.target.value)} placeholder="YouTube link, .mp4, .webm or .m3u8 URL" /></label>
        <label className="acm-wide">Poster image URL<input type="url" value={form.posterUrl} onChange={e => change('posterUrl', e.target.value)} placeholder="https://…" /></label>
        <label>Category<input value={form.category} onChange={e => change('category', e.target.value)} placeholder="Movies, Nigerian Cinema, Documentary…" /></label>
        <label>Release year<input type="number" min="1888" max={new Date().getFullYear()+5} value={form.releaseYear} onChange={e => change('releaseYear', e.target.value)} placeholder="2026" /></label>
        <label className="acm-wide">Description<textarea rows="3" value={form.description} onChange={e => change('description', e.target.value)} placeholder="A short description of this title…" /></label>
      </div>
      <div className="acm-options"><label className="acm-check"><input type="checkbox" checked={form.featured} onChange={e => change('featured', e.target.checked)} /> Feature on catalogue</label><label>Visibility<select value={form.visibility} onChange={e => change('visibility', e.target.value)}><option value="UNLISTED">Draft / Unlisted</option><option value="PUBLIC">Published</option><option value="PRIVATE">Private</option></select></label><button className="acm-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add to catalogue'}</button></div>
    </form>
    <div className="acm-list-head"><div><h2>Catalogue entries</h2><p>{items.length} {items.length === 1 ? 'title' : 'titles'} managed</p></div></div>
    {loading ? <div className="acm-empty">Loading catalogue…</div> : items.length === 0 ? <div className="acm-empty">No catalogue entries yet. Add your first title above.</div> :
      <div className="acm-list">{items.map(item => <article className="acm-item" key={item.id}>
        <div className="acm-poster">{item.posterUrl ? <img src={item.posterUrl} alt="" /> : <span>▶</span>}</div>
        <div className="acm-info"><strong>{item.title}</strong><span>{item.category} {item.releaseYear ? '· ' + item.releaseYear : ''} · {item.sourceType.toUpperCase()}</span><small>{item.visibility === 'PUBLIC' ? 'Published' : item.visibility === 'PRIVATE' ? 'Private' : 'Draft / Unlisted'}{item.featured ? ' · Featured' : ''}</small></div>
        <div className="acm-actions"><button onClick={() => publish(item)}>{item.visibility === 'PUBLIC' ? 'Unpublish' : 'Publish'}</button><button onClick={() => edit(item)}>Edit</button><button className="acm-delete" onClick={() => remove(item)}>Delete</button></div>
      </article>)}</div>}
  </section>;
}
