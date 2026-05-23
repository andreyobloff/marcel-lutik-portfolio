import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import manifest from './generated/photoManifest.json';

const photographerName = 'Марсель Лютик';
const storageKey = 'marcel-lutik-theme';

const contacts = {
  email: '',
  telegram: 'https://t.me/ouji_marcel',
  instagram: '',
};

const derealisationEssay = `Дереализация — это состояние нарушения восприятия, при котором окружающий мир может казаться нереальным, отдалённым, изменённым, плоским или странно искусственным. Человек при этом обычно понимает, что происходящее реально, но субъективное ощущение реальности ослабевает. Такое состояние может возникать на фоне тревоги, стресса, переутомления, деперсонализационно-дереализационных переживаний и других психических или соматических состояний.

Герой серии "дереализация" начинает свой путь взаимодействия с этим состоянием с неудачной попытки успеть на работу в офис. В процессе попытки он остаётся в привычно-необычном подъезде, пытаясь совершить акт удалённой работы. Удалённый день ему не удаётся, поскольку родной подъезд настолько завораживает своими формами и перспективами, что отвлекает от мысли о необходимости вернуться в квартиру и плавно, но непрерывно сводит с ума. Ноутбук выскальзывает из рук, а в сознании возникает ощущение "смерти прежнего я", становления совершенно другим человеком.

Сквозь связь подъездов, которые то и дело бубнят друг на друга гудением канализационных извилин, мысленно удаётся нащупать момент "смерти прежнего" в том дне, когда ошибочно выбранный поезд доставил его в совершенно незнакомое место, где неработающий телефон и очень христианское зеркало дали герою знак. Знак отвержения собственного я, нашёптанный мёртвой тишиной сквозь тело пустого аппарата. И осознание, что жизнь вообще не принадлежит какому-либо из его "ложных я".

Возмущённый осознанием этого экзистенциального примитивизма, герой возвращается в более ранние события, которые предрекли его неприлично долгий путь, окончившийся в чуждом этому миру подъезде единственного многоэтажного дома в том посёлке в форме гробика. Возможно, его путь стал распадаться на осколочные тропы чуть раньше? Когда во время приступа бронхиальной астмы свет от креста на стене озарил его комнату, давая понять, что нет никакой правды в дверях и самом воздухе? Да, именно воздух, его призматизация. Как можно было не заметить, что отравленный воздух душит его, что крест на стене обращался к нему снова и снова, свет говорил с ним через то зеркало, говорил о том, что сам бес душил героя в тот день.

Желая отмыться от подъездной грязи и той ереси, что сознание изначально прислало ему контрафактной почтой, мужчина открывает кран с холодной водой, стараясь, чтобы струя угодила ему точно за шиворот. Ведь именно шиворотом являются подъезды относительно домов, тогда как дома сами по себе — это эквивалент зеркал. По причине подобной эквивалентности в домах легко запутаться и оказаться в прошлом, связанном подъездами в нечестивую Ариаднову нить.

Герой не понимает, что мысли о прошлом и путешествии сквозь время возникают не сами собой: в текущий момент, подобно течению самого момента, они вместе с водой и распадающейся в потоке воды книгой о "попаданце в 90-е" утекают сквозь его пальцы. Это смешно. Смешно и мокро.

Любое прошлое — это искажённый грим на искусственно деформированном лице настоящего. В нём нет смерти "прежнего я": смотря на своё отражение, герой не видит лицо, лишь бинтовую маску; даже настоящее кажется фальшивкой, и он старательно пишет на этой маске свой портрет до тех пор, пока не начинает видеть привычные черты.

Ощущение персональной "масочности" растёт с каждой минутой, и спустя несколько десятков минут истощённый мужчина ложится в постель, где вынужден безвольно наблюдать за тем, как из него вновь и вновь восстают новые, прежние, настоящие и даже вневременные маски и образы.`;

const etherEssay = 'В исторической философии и ранних физических представлениях эфир понимался как тонкая всепроникающая среда, ткань мироздания, через которую могут распространяться свет, движение и взаимодействие тел. Серия «Эфир» обращается к этой идее через фотосессию с девушкой в белом наряде: для неё выбраны природные, архитектурные и пространственные антуражи с мягким «сказочным» холодным светом, который создаёт эффект плотного, «эфирного» воздуха и отсылает к старой философской и физической концепции мироустройства.';

const seriesEssays = {
  Derealisation: derealisationEssay,
  Stilllife: 'Работа с объектами и эстетикой. В данном случае работа идёт с эстетикой разных формулировок чёрного в смерти — через глянцевые и матовые поверхности — и золота вознесения как аллюзии на классический путь от нигредо к золоту.',
  Walk: 'Серия построена как учебная прогулка с камерой. В центре — наблюдение за маршрутом, светом, случайными деталями и изменением пространства при движении. Это работа с повседневной средой, композицией и вниманием к тому, как обычные места складываются в последовательность кадров.',
  Ether: etherEssay,
  'Эфир': etherEssay,
};

const displayTitles = { Ether: 'Эфир' };
const displayTitle = (value) => displayTitles[value] || value;

const themes = {
  obsidian: { label: 'Тёмная', page: 'bg-zinc-950 text-zinc-100', panel: 'bg-black/82', card: 'bg-zinc-950', muted: 'text-zinc-400', border: 'border-zinc-800', accent: 'text-red-500', button: 'bg-zinc-100 text-black' },
  bone: { label: 'Светлая', page: 'bg-stone-100 text-stone-950', panel: 'bg-stone-50/88', card: 'bg-stone-50', muted: 'text-stone-600', border: 'border-stone-300', accent: 'text-stone-950', button: 'bg-stone-950 text-white' },
  crimson: { label: 'Красная', page: 'bg-[#100507] text-[#f5e9df]', panel: 'bg-[#070203]/86', card: 'bg-[#18080b]', muted: 'text-[#b99288]', border: 'border-[#321015]', accent: 'text-[#ff3d4f]', button: 'bg-[#f5e9df] text-[#100507]' },
};

function encodePath(value) { return value.split('/').map((part) => encodeURIComponent(part)).join('/'); }
function assetUrl(item) { return `${import.meta.env.BASE_URL || '/'}${encodePath(item.publicPath)}`; }
function getSeriesEssay(series) { return seriesEssays[series.title] || series.description || `Серия «${displayTitle(series.title)}».`; }
function getSeriesNames() { return (manifest.series || []).map((series) => displayTitle(series.title)).join(', '); }
function getHeroPhoto() { return manifest.series.find((series) => series.slug === 'derealisation')?.photos.find((photo) => photo.id === 'derealisation-10') || manifest.heroPhoto; }
function splitParagraphs(text) { return String(text).split(/\n{2,}/).map((item) => item.trim()).filter(Boolean); }
function getColumnLimit(paragraphCount, width) { if (paragraphCount >= 6 && width >= 1024) return 3; if (paragraphCount >= 4 && width >= 760) return 2; return 1; }
function distributeParagraphs(paragraphs, columnCount) { const count = Math.max(1, Math.min(columnCount, paragraphs.length)); const base = Math.floor(paragraphs.length / count); const rest = paragraphs.length % count; const columns = []; let cursor = 0; for (let i = 0; i < count; i += 1) { const size = base + (i < rest ? 1 : 0); columns.push(paragraphs.slice(cursor, cursor + size)); cursor += size; } return columns; }
function useViewportWidth() { const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth)); useEffect(() => { const onResize = () => setWidth(window.innerWidth); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []); return width; }
function parseHash() { const raw = window.location.hash.replace(/^#\/?/, ''); const [kind, seriesSlug, photoId] = raw.split('/').filter(Boolean); if (kind === 'series' && seriesSlug && photoId) return { view: 'photo', seriesSlug, photoId }; if (kind === 'series' && seriesSlug) return { view: 'series', seriesSlug, photoId: null }; return { view: 'home', seriesSlug: null, photoId: null }; }
function navigateHome() { window.location.hash = '/'; }
function navigateSeries(series) { window.location.hash = `/series/${series.slug}`; }
function navigatePhoto(series, photo) { window.location.hash = `/series/${series.slug}/${photo.id}`; }
function scrollToHomeSection(sectionId) { const scroll = () => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (parseHash().view !== 'home') { window.location.hash = '/'; window.setTimeout(scroll, 80); return; } scroll(); }

function SeriesDescription({ text, activeTheme }) {
  const viewportWidth = useViewportWidth();
  const paragraphs = useMemo(() => splitParagraphs(text), [text]);
  const columnCount = getColumnLimit(paragraphs.length, viewportWidth);
  const columns = useMemo(() => distributeParagraphs(paragraphs, columnCount), [paragraphs, columnCount]);
  return <div data-layout-version="balanced-paragraph-columns-v4" className={`max-w-7xl border-y ${activeTheme.border} py-7 text-base leading-8 md:text-lg ${activeTheme.muted}`}><div className="grid gap-10" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>{columns.map((column, columnIndex) => <div key={columnIndex} className="space-y-6">{column.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>)}</div></div>;
}

function GothicCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef(null);
  const sigilRef = useRef(null);
  const emberRef = useRef(null);
  useEffect(() => {
    const canUseCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canUseCursor) return undefined;
    setEnabled(true);
    document.documentElement.classList.add('gothic-cursor-enabled');
    const style = document.createElement('style');
    style.id = 'marcel-gothic-cursor-style';
    style.textContent = `@media (hover: hover) and (pointer: fine) { html.gothic-cursor-enabled, html.gothic-cursor-enabled * { cursor: none !important; } .gothic-cursor-node { position: fixed; left: 0; top: 0; pointer-events: none; z-index: 2147483647; opacity: 0; will-change: transform, opacity; mix-blend-mode: screen; } .gothic-cursor-ring { width: 34px; height: 34px; border: 1px solid rgba(245,245,245,.78); box-shadow: 0 0 16px rgba(225,29,72,.35), inset 0 0 14px rgba(225,29,72,.12); transform: translate3d(-50%,-50%,0) rotate(45deg); transition: width 160ms ease, height 160ms ease, border-color 160ms ease, box-shadow 160ms ease; } .gothic-cursor-sigil { width: 20px; height: 20px; transform: translate3d(-50%,-50%,0); } .gothic-cursor-sigil::before, .gothic-cursor-sigil::after { content: ''; position: absolute; left: 50%; top: 50%; background: rgba(255,255,255,.9); box-shadow: 0 0 10px rgba(239,68,68,.8); transform: translate(-50%,-50%); } .gothic-cursor-sigil::before { width: 1px; height: 22px; } .gothic-cursor-sigil::after { width: 22px; height: 1px; } .gothic-cursor-ember { width: 7px; height: 7px; background: #ef4444; box-shadow: 0 0 18px rgba(239,68,68,.9), 0 0 32px rgba(127,29,29,.9); transform: translate3d(-50%,-50%,0) rotate(45deg); } .gothic-cursor-node.is-visible { opacity: 1; } .gothic-cursor-node.is-hovered.gothic-cursor-ring { width: 52px; height: 52px; border-color: rgba(248,113,113,.95); box-shadow: 0 0 24px rgba(239,68,68,.65), inset 0 0 22px rgba(248,113,113,.22); } }`;
    document.head.appendChild(style);
    let frame = 0; let x = window.innerWidth / 2; let y = window.innerHeight / 2; let ringX = x; let ringY = y;
    const tick = () => { ringX += (x - ringX) * 0.22; ringY += (y - ringY) * 0.22; if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate3d(-50%, -50%, 0) rotate(45deg)`; if (sigilRef.current) sigilRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`; if (emberRef.current) emberRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0) rotate(45deg)`; frame = window.requestAnimationFrame(tick); };
    const move = (event) => { x = event.clientX; y = event.clientY; ringRef.current?.classList.add('is-visible'); sigilRef.current?.classList.add('is-visible'); emberRef.current?.classList.add('is-visible'); };
    const over = (event) => setHovered(Boolean(event.target.closest('a, button, input, textarea, select, [role="button"]')));
    frame = window.requestAnimationFrame(tick); window.addEventListener('mousemove', move); window.addEventListener('mouseover', over);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); document.documentElement.classList.remove('gothic-cursor-enabled'); style.remove(); };
  }, []);
  if (!enabled) return null;
  const stateClass = hovered ? 'is-hovered' : '';
  return <><div ref={ringRef} className={`gothic-cursor-node gothic-cursor-ring ${stateClass}`} /><div ref={sigilRef} className={`gothic-cursor-node gothic-cursor-sigil ${stateClass}`} /><div ref={emberRef} className={`gothic-cursor-node gothic-cursor-ember ${stateClass}`} /></>;
}

function Header({ activeTheme, setThemeName }) {
  return <header className={`sticky top-0 z-40 border-b ${activeTheme.border} ${activeTheme.panel} backdrop-blur-xl`}><div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8"><button type="button" onClick={navigateHome} className="flex items-center gap-3 text-left"><span className={`grid h-11 w-11 place-items-center border ${activeTheme.border} text-sm font-black tracking-[-0.08em]`}>ML</span><span><span className="block text-sm font-bold uppercase tracking-[0.22em]">{photographerName}</span><span className={`block text-xs uppercase tracking-[0.18em] ${activeTheme.muted}`}>Учебное портфолио</span></span></button><div className="hidden items-center gap-2 md:flex"><button type="button" onClick={() => scrollToHomeSection('series')} className={`border border-transparent px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${activeTheme.muted} hover:border-current/30 hover:text-current`}>Серии</button><button type="button" onClick={() => scrollToHomeSection('about')} className={`border border-transparent px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${activeTheme.muted} hover:border-current/30 hover:text-current`}>О фотографе</button><button type="button" onClick={() => scrollToHomeSection('contacts')} className={`border border-transparent px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${activeTheme.muted} hover:border-current/30 hover:text-current`}>Контакты</button><span className={`mx-1 h-6 border-l ${activeTheme.border}`} />{Object.entries(themes).map(([key, theme]) => <button key={key} type="button" onClick={() => setThemeName(key)} className={`border px-3 py-2 text-[10px] uppercase tracking-[0.18em] transition ${activeTheme.label === theme.label ? activeTheme.button : `border-transparent ${activeTheme.muted} hover:border-current/30`}`}>{theme.label}</button>)}</div></div></header>;
}

function Intro({ activeTheme }) {
  const heroPhoto = getHeroPhoto();
  const seriesNames = getSeriesNames();
  return <section className="grid min-h-[72vh] border-b border-current/10 md:grid-cols-[1.12fr_0.88fr]"><div className="flex flex-col justify-between border-r-0 border-current/10 p-6 md:border-r md:p-10 lg:p-14"><div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] opacity-70"><Icon name="camera" /> Portfolio / Series</div><div className="py-16"><p className={`mb-6 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>Марсель Лютик</p><h1 className="max-w-5xl text-5xl font-semibold uppercase leading-[0.92] tracking-[0.018em] md:text-7xl lg:text-8xl">Учебное портфолио</h1><p className={`mt-8 max-w-2xl text-lg leading-8 ${activeTheme.muted}`}>{seriesNames ? `В портфолио собраны серии: ${seriesNames}.` : 'В портфолио собраны учебные серии.'} Работы строятся вокруг пространства, предметов, света, поверхности и последовательности кадров.</p></div><div className="grid grid-cols-3 border border-current/15 text-center uppercase tracking-[0.18em]"><div className="border-r border-current/15 p-4"><div className="text-3xl tracking-[-0.05em]">{manifest.series.length}</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Серии</div></div><div className="border-r border-current/15 p-4"><div className="text-3xl tracking-[-0.05em]">{manifest.totalPhotos}</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Кадров</div></div><div className="p-4"><div className="text-3xl tracking-[-0.05em]">ML</div><div className={`mt-1 text-[10px] ${activeTheme.muted}`}>Работы</div></div></div></div><div className="relative min-h-[460px] overflow-hidden">{heroPhoto ? <img src={assetUrl(heroPhoto)} alt={heroPhoto.title} className="h-full w-full object-cover grayscale contrast-125" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" /><div className="absolute bottom-6 left-6 right-6 border border-white/20 bg-black/35 p-5 text-white backdrop-blur-sm"><p className="text-xs uppercase tracking-[0.24em] text-white/60">Портфолио</p><p className="mt-2 text-3xl uppercase tracking-[0.018em]">{photographerName}</p></div></div></section>;
}

function SeriesGrid({ activeTheme }) {
  return <section id="series" className="scroll-mt-28 px-4 py-16 md:px-8 md:py-24"><div className="mb-10 grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end"><h2 className="text-4xl font-semibold uppercase leading-none tracking-[0.018em] md:text-6xl">Серии</h2><p className={`max-w-2xl text-base leading-7 ${activeTheme.muted}`}>Разделы портфолио открываются как отдельные серии. Внутри каждой серии — последовательность кадров.</p></div><div className="grid gap-px bg-current/20 md:grid-cols-3">{manifest.series.map((series, index) => <button key={series.slug} type="button" onClick={() => navigateSeries(series)} className={`${activeTheme.card} group relative min-h-[440px] overflow-hidden border ${activeTheme.border} text-left`}>{series.coverPhoto ? <img src={assetUrl(series.coverPhoto)} alt={displayTitle(series.title)} className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" /><div className="absolute left-0 top-0 border-b border-r border-white/20 bg-black/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/70">{String(index + 1).padStart(2, '0')}</div><div className="absolute bottom-0 left-0 right-0 p-5 text-white"><p className="mb-2 text-xs uppercase tracking-[0.24em] text-white/60">{series.photoCount} кадров</p><h3 className="text-4xl uppercase tracking-[0.018em]">{displayTitle(series.title)}</h3></div></button>)}</div></section>;
}

function AboutSection({ activeTheme }) {
  const portrait = manifest.photographerPhoto;
  return <section id="about" className="scroll-mt-28 border-t border-current/10 px-4 py-16 md:px-8 md:py-24"><div className="grid gap-10 md:grid-cols-[0.75fr_1.25fr] md:items-start"><div><p className={`mb-5 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>О фотографе</p><h2 className="text-4xl font-semibold uppercase leading-none tracking-[0.018em] md:text-6xl">Марсель Лютик</h2></div><div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]"><div className={`group relative min-h-[460px] overflow-hidden border ${activeTheme.border} ${activeTheme.card}`}>{portrait ? <img src={assetUrl(portrait)} alt="Марсель Лютик" className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /> : <div className={`flex h-full min-h-[460px] items-center justify-center p-8 text-center text-xs uppercase tracking-[0.18em] ${activeTheme.muted}`}>Фото фотографа появится после обновления локального архива</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /></div><div className={`border-y ${activeTheme.border} py-7 text-base leading-8 md:text-lg ${activeTheme.muted}`}><p>Марсель Лютик работает с учебной фотографией, собирая серии вокруг пространства, предметов, света и последовательности кадров. В портфолио вошли работы о дереализации, натюрморте, прогулке и новых визуальных сериях из локального архива.</p><p className="mt-6">Визуальный язык портфолио держится на строгой композиции, тёмной тональности, внимании к поверхностям и состояниям. Серии показывают разные упражнения: работу с объектами, движение по маршруту, построение сюжетной фотографии и работу с портретным образом в пространстве.</p></div></div></div></section>;
}

function ContactsSection({ activeTheme }) {
  const contactItems = [
    { label: 'Telegram', value: contacts.telegram.replace('https://t.me/', '@'), href: contacts.telegram },
    { label: 'E-mail', value: contacts.email, href: contacts.email ? `mailto:${contacts.email}` : '' },
    { label: 'Instagram', value: contacts.instagram, href: contacts.instagram },
  ].filter((item) => item.value && item.href);
  return <section id="contacts" className="scroll-mt-28 border-t border-current/10 px-4 py-16 md:px-8 md:py-24"><div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start"><div><p className={`mb-5 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>Контакты</p><h2 className="text-4xl font-semibold uppercase leading-none tracking-[0.018em] md:text-6xl">Связь</h2></div><div className={`border-y ${activeTheme.border} py-7`}><p className={`max-w-3xl text-base leading-8 md:text-lg ${activeTheme.muted}`}>Для связи по съёмкам, учебным проектам и сотрудничеству используйте Telegram.</p><div className="mt-8 grid gap-px bg-current/20 md:grid-cols-3">{contactItems.map((item) => <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} className={`${activeTheme.card} border ${activeTheme.border} p-5 transition hover:bg-current/5`}><span className={`block text-[10px] uppercase tracking-[0.24em] ${activeTheme.muted}`}>{item.label}</span><span className="mt-3 block text-sm uppercase tracking-[0.14em]">{item.value}</span></a>)}</div></div></div></section>;
}

function SeriesPage({ series, activeTheme }) { const essay = getSeriesEssay(series); return <main className="px-4 py-10 md:px-8 md:py-14"><button type="button" onClick={navigateHome} className={`mb-10 inline-flex items-center gap-3 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] ${activeTheme.muted} hover:text-current`}><Icon name="arrowLeft" /> Все серии</button><section className="mb-12 border-b border-current/10 pb-12"><div className="mb-10"><p className={`mb-5 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>Серия / {series.photoCount} кадров</p><h1 className="text-6xl font-semibold uppercase leading-[0.92] tracking-[0.018em] md:text-8xl">{displayTitle(series.title)}</h1></div><SeriesDescription text={essay} activeTheme={activeTheme} /></section><div className="grid gap-px bg-current/20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{series.photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => navigatePhoto(series, photo)} className={`${activeTheme.card} group relative aspect-[4/5] overflow-hidden border ${activeTheme.border} text-left`}><img src={assetUrl(photo)} alt={photo.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /><div className="absolute left-0 top-0 bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-white/65">{String(index + 1).padStart(2, '0')}</div></button>)}</div></main>; }
function PhotoPage({ series, photo, activeTheme }) { const currentIndex = series.photos.findIndex((item) => item.id === photo.id); const previous = currentIndex > 0 ? series.photos[currentIndex - 1] : null; const next = currentIndex < series.photos.length - 1 ? series.photos[currentIndex + 1] : null; return <main className="grid min-h-[calc(100vh-80px)] md:grid-cols-[minmax(0,1fr)_360px]"><section className="relative min-h-[62vh] bg-black md:min-h-0"><img src={assetUrl(photo)} alt={photo.title} className="absolute inset-0 h-full w-full object-contain" /></section><aside className={`border-l ${activeTheme.border} ${activeTheme.card} p-6 md:p-8`}><button type="button" onClick={() => navigateSeries(series)} className={`mb-8 inline-flex items-center gap-3 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] ${activeTheme.muted} hover:text-current`}><Icon name="arrowLeft" /> Вернуться к серии</button><p className={`mb-4 text-xs uppercase tracking-[0.28em] ${activeTheme.accent}`}>{displayTitle(series.title)} / {String(currentIndex + 1).padStart(2, '0')}</p><h1 className="text-5xl font-semibold uppercase leading-[0.92] tracking-[0.018em]">{photo.title.replace(series.title, displayTitle(series.title))}</h1><div className={`mt-8 border-t ${activeTheme.border} pt-6 text-xs uppercase tracking-[0.18em] ${activeTheme.muted}`}><p>{photographerName}</p><p className="mt-2">{displayTitle(series.title)}</p></div><div className="mt-10 grid grid-cols-2 gap-3"><button disabled={!previous} type="button" onClick={() => previous && navigatePhoto(series, previous)} className={`inline-flex items-center justify-center gap-2 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-30`}><Icon name="arrowLeft" /> Prev</button><button disabled={!next} type="button" onClick={() => next && navigatePhoto(series, next)} className={`inline-flex items-center justify-center gap-2 border ${activeTheme.border} px-4 py-3 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-30`}>Next <Icon name="arrowRight" /></button></div></aside></main>; }

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
  else content = <><Intro activeTheme={activeTheme} /><SeriesGrid activeTheme={activeTheme} /><AboutSection activeTheme={activeTheme} /><ContactsSection activeTheme={activeTheme} /></>;
  return <div className={`${activeTheme.page} min-h-screen font-serif`}><GothicCursor /><div className="pointer-events-none fixed inset-0 z-30 opacity-[0.045] mix-blend-screen [background-image:linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:18px_18px]" /><Header activeTheme={activeTheme} setThemeName={setThemeName} />{content}<footer className={`border-t ${activeTheme.border} px-4 py-10 text-xs uppercase tracking-[0.22em] md:px-8`}><div className="flex flex-col justify-between gap-4 md:flex-row"><span>{photographerName} © {new Date().getFullYear()}</span><span className={activeTheme.muted}>Портфолио / {manifest.totalPhotos} кадров</span></div></footer></div>;
}
