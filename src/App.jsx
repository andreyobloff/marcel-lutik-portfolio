import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './icons.jsx';
import manifest from './generated/photoManifest.json';

const photographerName = 'Марсель Лютик';
const storageKey = 'marcel-lutik-theme';

const themes = {
  obsidian: { label: 'Obsidian Chapel', page: 'bg-zinc-950 text-zinc-100', panel: 'bg-black/82', card: 'bg-zinc-950', muted: 'text-zinc-400', border: 'border-zinc-800', accent: 'text-red-500', button: 'bg-zinc-100 text-black' },
  bone: { label: 'Bone Archive', page: 'bg-stone-100 text-stone-950', panel: 'bg-stone-50/88', card: 'bg-stone-50', muted: 'text-stone-600', border: 'border-stone-300', accent: 'text-stone-950', button: 'bg-stone-950 text-white' },
  crimson: { label: 'Crimson Nocturne', page: 'bg-[#100507] text-[#f5e9df]', panel: 'bg-[#070203]/86', card: 'bg-[#18080b]', muted: 'text-[#b99288]', border: 'border-[#321015]', accent: 'text-[#ff3d4f]', button: 'bg-[#f5e9df] text-[#100507]' },
};

function encodePath(path) { return path.split('/').map((part) => encodeURIComponent(part)).join('/'); }
function photoUrl(photo) { return `${import.meta.env.BASE_URL || '/'}${encodePath(photo.publicPath)}`; }
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [kind, seriesSlug, photoId] = raw.split('/').filter(Boolean);
  if (kind === 'series' && seriesSlug && photoId) return { view: 'photo', seriesSlug, photoId };
  if (kind === 'series' && seriesSlug) return { view: 'series', seriesSlug, photoId: null };
  return { view: 'home', seriesSlug: null, photoId: null };
}
function navigateHome() { window.location.hash = '/'; }
function navigateSeries(series) { window.location.hash = `/series/${series.slug}`; }
function navigatePhoto(series, photo) { window.location.hash = `/series/${series.slug}/${photo.id}`; }

function Header({ activeTheme, setThemeName }) {
  return <header className={`sticky top-0 z-40 border-b ${activeTheme.border} ${activeTheme.panel} backdrop-blur-xl`}>
    <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
      <button type="button" onClick={navigateHome} className="flex items-center gap-3 text-left">
        <span className={`grid h-11 w-11 place-items-center border ${activeTheme.border} text-sm font-black tracking-[-0.08em]`}>ML</span>
        <span><span className="block text-sm font-bold uppercase tracking-[0.22em]">{photographerName}</span><span className={`block text-xs uppercase tracking-[0.18em] ${activeTheme.muted}`}>Auto-generated photo archive</span></span>
      </button>
      <div className="hidden items-center gap-1 md:flex">{Object.entries(themes).map(([key, theme]) => <button key={key} type="button" onClick={() => setThemeName(key)} className={`border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition ${activeTheme.label === theme.label ? activeTheme.button : `border-transparent ${activeTheme.muted} hover:border-current/30`}`}>{theme.label}</button>)}</div>
    </div>
  </header>;
}

function Intro({ activeTheme }) {
  return <section className="grid min-h-[72vh] border-b border-current/10 md:grid-cols-[1.12fr_0.88fr]">
    <div className="flex flex-col justify-between border-r-0 border-current/10 p-6 md:border-r md:p-10 lg:p-14">
      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] opacity-70"><Icon name="camera" /> Portfolio / {manifest.generatedAt.slice(0, 4)}</div>
      <div className="py-16"><p className={`mb-6 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>Generated archive</p><h1 className="max-w-5xl text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.065em] md:text-7xl lg:text-8xl">Фотоархив, собранный из реальных серий</h1><p className={`mt-8 max-w-2xl text-lg leading-8 ${activeTheme.muted}`}>Сайт автоматически создаёт страницы серий и карточки фотографий из локальной папки photo. В Git публикуются оптимизированные web-копии.</p></div>
      <div className="grid grid-cols-3 border border-current/15 text-center uppercase tracking-[0.18em]"><div className="border-r border-current/15 p-4"><div className="text-3xl tracking-[-0.05em]">{manifest.series.length}</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Series</div></div><div className="border-r border-current/15 p-4"><div className="text-3xl tracking-[-0.05em]">{manifest.totalPhotos}</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Photos</div></div><div className="p-4"><div className="text-3xl tracking-[-0.05em]">∞</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Extensible</div></div></div>
    </div>
    <div className="relative min-h-[460px] overflow-hidden">{manifest.heroPhoto ? <img src={photoUrl(manifest.heroPhoto)} alt={manifest.heroPhoto.title} className="h-full w-full object-cover grayscale contrast-125" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" /><div className="absolute bottom-6 left-6 right-6 border border-white/20 bg-black/35 p-5 text-white backdrop-blur-sm"><p className="text-xs uppercase tracking-[0.24em] text-white/60">Current archive</p><p className="mt-2 text-3xl uppercase tracking-[-0.05em]">{photographerName}</p></div></div>
  </section>;
}

function SeriesGrid({ activeTheme }) {
  return <section className="px-4 py-16 md:px-8 md:py-24"><div className="mb-10 grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end"><h2 className="text-4xl font-semibold uppercase leading-none tracking-[-0.05em] md:text-6xl">Серии</h2><p className={`max-w-2xl text-base leading-7 ${activeTheme.muted}`}>Каждая подпапка становится отдельной серией. Количество фотографий не ограничено интерфейсом.</p></div><div className="grid gap-px bg-current/20 md:grid-cols-3">{manifest.series.map((series, index) => <button key={series.slug} type="button" onClick={() => navigateSeries(series)} className={`${activeTheme.card} group relative min-h-[440px] overflow-hidden border ${activeTheme.border} text-left`}>{series.coverPhoto ? <img src={photoUrl(series.coverPhoto)} alt={series.title} className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" /><div className="absolute left-0 top-0 border-b border-r border-white/20 bg-black/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/70">{String(index + 1).padStart(2, '0')}</div><div className="absolute bottom-0 left-0 right-0 p-5 text-white"><p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/60">{series.photoCount} photos</p><h3 className="text-4xl uppercase tracking-[-0.06em]">{series.title}</h3><p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">{series.description}</p></div></button>)}</div></section>;
}

function SeriesPage({ series, activeTheme }) {
  return <main className="px-4 py-10 md:px-8 md:py-14"><button type="button" onClick={navigateHome} className={`mb-10 inline-flex items-center gap-3 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] ${activeTheme.muted} hover:text-current`}><Icon name="arrowLeft" /> Все серии</button><section className="mb-12 grid gap-8 border-b border-current/10 pb-12 md:grid-cols-[0.85fr_1.15fr] md:items-end"><div><p className={`mb-5 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>Series / {series.photoCount} photos</p><h1 className="text-6xl font-semibold uppercase leading-[0.86] tracking-[-0.065em] md:text-8xl">{series.title}</h1></div><p className={`max-w-3xl text-lg leading-8 ${activeTheme.muted}`}>{series.description}</p></section><div className="grid gap-px bg-current/20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{series.photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => navigatePhoto(series, photo)} className={`${activeTheme.card} group relative aspect-[4/5] overflow-hidden border ${activeTheme.border} text-left`}><img src={photoUrl(photo)} alt={photo.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" /><div className="absolute left-0 top-0 bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-white/65">{String(index + 1).padStart(2, '0')}</div><div className="absolute bottom-0 left-0 right-0 p-4 text-white"><p className="text-lg uppercase tracking-[-0.04em]">{photo.title}</p></div></button>)}</div></main>;
}

function PhotoPage({ series, photo, activeTheme }) {
  const currentIndex = series.photos.findIndex((item) => item.id === photo.id);
  const previous = currentIndex > 0 ? series.photos[currentIndex - 1] : null;
  const next = currentIndex < series.photos.length - 1 ? series.photos[currentIndex + 1] : null;
  return <main className="grid min-h-[calc(100vh-80px)] md:grid-cols-[minmax(0,1fr)_420px]"><section className="relative min-h-[62vh] bg-black md:min-h-0"><img src={photoUrl(photo)} alt={photo.title} className="absolute inset-0 h-full w-full object-contain" /></section><aside className={`border-l ${activeTheme.border} ${activeTheme.card} p-6 md:p-8`}><button type="button" onClick={() => navigateSeries(series)} className={`mb-8 inline-flex items-center gap-3 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] ${activeTheme.muted} hover:text-current`}><Icon name="arrowLeft" /> Вернуться к серии</button><p className={`mb-4 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>{series.title} / {String(currentIndex + 1).padStart(2, '0')}</p><h1 className="text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.06em]">{photo.title}</h1><p className={`mt-7 text-base leading-8 ${activeTheme.muted}`}>{photo.description}</p><div className={`mt-8 border-t ${activeTheme.border} pt-6 text-xs uppercase tracking-[0.18em] ${activeTheme.muted}`}><p>File: {photo.fileName}</p><p className="mt-2">Series: {series.title}</p></div><div className="mt-10 grid grid-cols-2 gap-3"><button disabled={!previous} type="button" onClick={() => previous && navigatePhoto(series, previous)} className={`inline-flex items-center justify-center gap-2 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-30`}><Icon name="arrowLeft" /> Prev</button><button disabled={!next} type="button" onClick={() => next && navigatePhoto(series, next)} className={`inline-flex items-center justify-center gap-2 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-30`}>Next <Icon name="arrowRight" /></button></div></aside></main>;
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [themeName, setThemeName] = useState(() => localStorage.getItem(storageKey) || 'obsidian');
  const activeTheme = themes[themeName] || themes.obsidian;
  useEffect(() => { const onHashChange = () => setRoute(parseHash()); window.addEventListener('hashchange', onHashChange); return () => window.removeEventListener('hashchange', onHashChange); }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, themeName); } catch {} }, [themeName]);
  const activeSeries = useMemo(() => manifest.series.find((series) => series.slug === route.seriesSlug) || null, [route.seriesSlug]);
  const activePhoto = useMemo(() => activeSeries?.photos.find((photo) => photo.id === route.photoId) || null, [activeSeries, route.photoId]);
  let content = null;
  if (route.view === 'photo' && activeSeries && activePhoto) content = <PhotoPage series={activeSeries} photo={activePhoto} activeTheme={activeTheme} />;
  else if ((route.view === 'series' || route.view === 'photo') && activeSeries) content = <SeriesPage series={activeSeries} activeTheme={activeTheme} />;
  else content = <><Intro activeTheme={activeTheme} /><SeriesGrid activeTheme={activeTheme} /></>;
  return <div className={`${activeTheme.page} min-h-screen font-serif`}><div className="pointer-events-none fixed inset-0 z-30 opacity-[0.045] mix-blend-screen [background-image:linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:18px_18px]" /><Header activeTheme={activeTheme} setThemeName={setThemeName} />{content}<footer className={`border-t ${activeTheme.border} px-4 py-10 text-xs uppercase tracking-[0.22em] md:px-8`}><div className="flex flex-col justify-between gap-4 md:flex-row"><span>{photographerName} © {new Date().getFullYear()}</span><span className={activeTheme.muted}>Generated / {manifest.totalPhotos} photos</span></div></footer></div>;
}