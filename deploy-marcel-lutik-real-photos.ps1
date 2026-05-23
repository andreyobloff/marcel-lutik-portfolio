<#
.SYNOPSIS
  Deploy Marcel Lutik photo portfolio to GitHub Pages from local photo folders.

.DESCRIPTION
  Expected structure:

    C:\PROJECTSPE\MarcelLuticPortf
      photo
        Derealisation
        Stilllife
        Walk

  Important behavior:
  - original photo/ is NOT committed to Git;
  - optimized web copies are generated into public/photo;
  - src/generated/photoManifest.json is generated locally and committed;
  - every series folder becomes a series page;
  - every image becomes a photo page;
  - rerun this script after adding photos, then push happens automatically.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File "C:\PROJECTSPE\MarcelLuticPortf\deploy-marcel-lutik-real-photos.ps1" `
    -ProjectDir "C:\PROJECTSPE\MarcelLuticPortf" `
    -RepoName "marcel-lutik-portfolio" `
    -Visibility public `
    -OpenWhenDone
#>

[CmdletBinding()]
param(
  [string]$ProjectDir = "C:\PROJECTSPE\MarcelLuticPortf",
  [string]$PhotoDirName = "photo",
  [string]$RepoName = "marcel-lutik-portfolio",
  [string]$GitHubOwner = "",
  [ValidateSet("public", "private")]
  [string]$Visibility = "public",
  [string]$Branch = "main",
  [switch]$OpenWhenDone,
  [switch]$SkipToolInstall,
  [switch]$KeepGitHistory
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Step([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "OK: $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "WARN: $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "ERROR: $Message" -ForegroundColor Red }

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Refresh-Path {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Invoke-External {
  param(
    [Parameter(Mandatory = $true)][string]$File,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path,
    [switch]$AllowFailure
  )

  Push-Location $WorkingDirectory
  try {
    & $File @Arguments
    $code = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($code -ne 0 -and -not $AllowFailure) {
    throw "Command failed with exit code ${code}: ${File} $($Arguments -join ' ')"
  }
  return $code
}

function Get-ExternalOutput {
  param(
    [Parameter(Mandatory = $true)][string]$File,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path
  )

  Push-Location $WorkingDirectory
  try {
    $output = & $File @Arguments 2>&1
    $code = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($code -ne 0) {
    throw "Command failed with exit code ${code}: ${File} $($Arguments -join ' ')`n$($output -join "`n")"
  }
  return (($output -join "`n").Trim())
}

function Test-ExternalSuccess {
  param(
    [Parameter(Mandatory = $true)][string]$File,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path
  )

  Push-Location $WorkingDirectory
  try {
    & $File @Arguments *> $null
    return ($LASTEXITCODE -eq 0)
  }
  catch {
    return $false
  }
  finally {
    Pop-Location
  }
}

function Ensure-Chocolatey {
  if (Get-Command choco -ErrorAction SilentlyContinue) { return }
  if (-not (Test-IsAdmin)) {
    throw "winget was not found and Chocolatey is not installed. Run PowerShell as Administrator or install winget/choco manually."
  }

  Write-Step "Installing Chocolatey fallback package manager"
  Set-ExecutionPolicy Bypass -Scope Process -Force
  $installScript = Invoke-RestMethod "https://community.chocolatey.org/install.ps1"
  Invoke-Expression $installScript
  Refresh-Path
}

function Get-PackageInstaller {
  if (Get-Command winget -ErrorAction SilentlyContinue) { return "winget" }
  if (Get-Command choco -ErrorAction SilentlyContinue) { return "choco" }
  Ensure-Chocolatey
  return "choco"
}

function Install-ToolPackage {
  param(
    [Parameter(Mandatory = $true)][string]$ToolName,
    [Parameter(Mandatory = $true)][string]$WingetId,
    [Parameter(Mandatory = $true)][string]$ChocolateyId
  )

  if ($SkipToolInstall) {
    throw "$ToolName is missing and -SkipToolInstall was specified."
  }

  $installer = Get-PackageInstaller
  Write-Step "Installing $ToolName via $installer"

  if ($installer -eq "winget") {
    $code = Invoke-External "winget" @("install", "--id", $WingetId, "--exact", "--source", "winget", "--accept-package-agreements", "--accept-source-agreements") -AllowFailure
    if ($code -ne 0) {
      Ensure-Chocolatey
      Invoke-External "choco" @("install", $ChocolateyId, "-y")
    }
  }
  else {
    Invoke-External "choco" @("install", $ChocolateyId, "-y")
  }

  Refresh-Path
}

function Ensure-Command {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $true)][string]$ToolName,
    [Parameter(Mandatory = $true)][string]$WingetId,
    [Parameter(Mandatory = $true)][string]$ChocolateyId
  )

  if (Get-Command $Command -ErrorAction SilentlyContinue) {
    Write-Ok "$ToolName found"
    return
  }

  Install-ToolPackage -ToolName $ToolName -WingetId $WingetId -ChocolateyId $ChocolateyId

  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "$ToolName was installed but command '$Command' is still not available. Restart PowerShell and retry."
  }

  Write-Ok "$ToolName installed"
}

function Ensure-NodeVersion {
  $majorText = Get-ExternalOutput "node" @("-p", "process.versions.node.split('.')[0]")
  $major = [int]$majorText
  if ($major -lt 18) {
    Install-ToolPackage -ToolName "Node.js LTS" -WingetId "OpenJS.NodeJS.LTS" -ChocolateyId "nodejs-lts"
    Refresh-Path
    $majorText = Get-ExternalOutput "node" @("-p", "process.versions.node.split('.')[0]")
    $major = [int]$majorText
    if ($major -lt 18) { throw "Node.js 18+ is required." }
  }
  Write-Ok "Node.js major=$major"
}

function Write-Utf8File {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
    [switch]$NoOverwrite
  )

  if ($NoOverwrite -and (Test-Path $Path)) {
    Write-Ok "File exists, not overwriting: $Path"
    return
  }

  $dir = Split-Path $Path -Parent
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Assert-SafeNames {
  if ($RepoName -notmatch "^[A-Za-z0-9._-]+$") { throw "RepoName contains invalid characters." }
  if ($Branch -notmatch "^[A-Za-z0-9._/-]+$") { throw "Branch contains invalid characters." }
  if ($PhotoDirName -notmatch "^[A-Za-z0-9._ -]+$") { throw "PhotoDirName contains invalid characters." }
}

function Ensure-GhAuth {
  if (Test-ExternalSuccess "gh" @("auth", "status")) {
    Write-Ok "GitHub CLI authenticated"
    return
  }

  Write-Step "GitHub CLI login is required"
  Invoke-External "gh" @("auth", "login", "-w", "-s", "repo,workflow")

  if (-not (Test-ExternalSuccess "gh" @("auth", "status"))) {
    throw "GitHub CLI is not authenticated."
  }
}

function Ensure-GitIdentity {
  param([string]$Owner)

  try { $name = Get-ExternalOutput "git" @("config", "user.name") -WorkingDirectory $ProjectDir } catch { $name = "" }
  try { $email = Get-ExternalOutput "git" @("config", "user.email") -WorkingDirectory $ProjectDir } catch { $email = "" }

  if ([string]::IsNullOrWhiteSpace($name)) {
    Invoke-External "git" @("config", "user.name", $Owner) -WorkingDirectory $ProjectDir
  }
  if ([string]::IsNullOrWhiteSpace($email)) {
    Invoke-External "git" @("config", "user.email", "$Owner@users.noreply.github.com") -WorkingDirectory $ProjectDir
  }
}

function Assert-PhotoLibrary {
  param([string]$PhotoRoot)

  if (-not (Test-Path $ProjectDir)) { throw "Project directory not found: $ProjectDir" }
  if (-not (Test-Path $PhotoRoot)) { throw "Photo directory not found: $PhotoRoot" }

  $allowed = @(".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif")
  $seriesDirs = @(Get-ChildItem -Path $PhotoRoot -Directory | Sort-Object Name)
  if ($seriesDirs.Count -eq 0) { throw "No series folders found in $PhotoRoot" }

  $photos = @(Get-ChildItem -Path $PhotoRoot -File -Recurse | Where-Object { $allowed -contains $_.Extension.ToLowerInvariant() })
  if ($photos.Count -eq 0) { throw "No supported images found in $PhotoRoot" }

  $totalMb = [math]::Round((($photos | Measure-Object Length -Sum).Sum / 1MB), 2)
  Write-Ok "Found series=$($seriesDirs.Count), photos=$($photos.Count), original size=$totalMb MB"

  if ($totalMb -gt 500) {
    Write-Warn "Original photos are large. This script will NOT commit photo/. It will commit optimized public/photo only."
  }
}

function Enable-GitHubPagesWorkflow {
  param([string]$FullRepo)

  Write-Step "Enabling GitHub Pages via GitHub Actions"

  $createCode = Invoke-External "gh" @("api", "--method", "POST", "repos/$FullRepo/pages", "-f", "build_type=workflow") -AllowFailure
  if ($createCode -eq 0) { Write-Ok "GitHub Pages enabled"; return }

  $updateCode = Invoke-External "gh" @("api", "--method", "PUT", "repos/$FullRepo/pages", "-f", "build_type=workflow") -AllowFailure
  if ($updateCode -eq 0) { Write-Ok "GitHub Pages updated"; return }

  Write-Warn "Could not enable Pages automatically. In GitHub: Settings -> Pages -> Source -> GitHub Actions."
}

function Create-ProjectFiles {
  param(
    [Parameter(Mandatory = $true)][string]$BasePath,
    [Parameter(Mandatory = $true)][string]$FullRepo,
    [Parameter(Mandatory = $true)][string]$PagesUrl,
    [Parameter(Mandatory = $true)][string]$PhotoFolderName,
    [Parameter(Mandatory = $true)][string]$WorkflowBranch
  )

  Write-Step "Creating/updating site files"

  $packageJson = @'
{
  "name": "marcel-lutik-photo-portfolio",
  "private": true,
  "version": "0.3.0",
  "type": "module",
  "scripts": {
    "generate:photos": "node ./scripts/generate-photo-manifest.mjs",
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "node ./scripts/smoke-test.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-react": "4.3.4",
    "vite": "5.4.11",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "autoprefixer": "10.4.20",
    "postcss": "8.4.49",
    "sharp": "0.34.3",
    "tailwindcss": "3.4.17"
  }
}
'@

  $viteConfig = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '$BasePath',
  plugins: [react()],
});
"@

  $tailwindConfig = @'
export default {
  content: ['./index.html', './src/**/*.{js,jsx,json}'],
  theme: { extend: {} },
  plugins: [],
};
'@

  $postcssConfig = @'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
'@

  $indexHtml = @'
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Марсель Лютик — фотографическое портфолио: серии, кадры, визуальные архивы." />
    <meta name="theme-color" content="#050505" />
    <title>Марсель Лютик — Portfolio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@

  $indexCss = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  font-synthesis: none;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; min-height: 100vh; background: #050505; }
button, a, input, textarea, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
::selection { background: #991b1b; color: #fff; }
'@

  $mainJsx = @'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
'@

  $iconsJsx = @'
import React from 'react';

export function Icon({ name, className = 'h-4 w-4' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'square', strokeLinejoin: 'miter', 'aria-hidden': true };
  const paths = {
    arrowLeft: <><path d="M19 12H5" /><path d="m12 5-7 7 7 7" /></>,
    arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    camera: <><path d="M4 8h4l2-3h4l2 3h4v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
    external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M20 14v6H4V4h6" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    spark: <><path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5z" /><path d="M19 3v4" /><path d="M17 5h4" /></>,
  };
  return <svg {...common}>{paths[name] || paths.spark}</svg>;
}
'@

  $appJsx = @'
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
'@

  $generator = @'
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const photoDirName = '__PHOTO_FOLDER_NAME__';
const photoRoot = path.join(root, photoDirName);
const publicPhotoRoot = path.join(root, 'public', 'photo');
const generatedDir = path.join(root, 'src', 'generated');
const manifestPath = path.join(generatedDir, 'photoManifest.json');
const contentDir = path.join(root, 'content');
const seriesDescriptionsPath = path.join(contentDir, 'series-descriptions.json');
const photoDescriptionsPath = path.join(contentDir, 'photo-descriptions.json');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const animatedExtensions = new Set(['.gif']);

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readJsonSafe(filePath, fallback) { try { return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback; } catch (error) { throw new Error(`Cannot parse JSON: ${filePath}\n${error.message}`); } }
function writeJson(filePath, value) { ensureDir(path.dirname(filePath)); fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
function slugify(value) { const normalized = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80); return normalized || crypto.createHash('sha1').update(value).digest('hex').slice(0, 10); }
function toPosix(value) { return value.split(path.sep).join('/'); }
function naturalSort(a, b) { return a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' }); }
function walkFiles(dir) { if (!fs.existsSync(dir)) return []; const entries = fs.readdirSync(dir, { withFileTypes: true }); const result = []; for (const entry of entries) { const fullPath = path.join(dir, entry.name); if (entry.isDirectory()) result.push(...walkFiles(fullPath)); if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) result.push(fullPath); } return result.sort((a, b) => naturalSort(a, b)); }
function getUniqueTargetPath(targetDir, desiredName, usedTargets) { const ext = path.extname(desiredName); const base = path.basename(desiredName, ext); let candidate = desiredName; let index = 2; while (usedTargets.has(path.join(targetDir, candidate))) { candidate = `${base}-${index}${ext}`; index += 1; } const fullPath = path.join(targetDir, candidate); usedTargets.add(fullPath); return fullPath; }
async function optimizeImage(sourceFile, targetFile) { ensureDir(path.dirname(targetFile)); const ext = path.extname(sourceFile).toLowerCase(); if (animatedExtensions.has(ext)) { fs.copyFileSync(sourceFile, targetFile); return; } await sharp(sourceFile).rotate().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(targetFile); }

if (!fs.existsSync(photoRoot)) throw new Error(`Photo folder not found: ${photoRoot}`);

const seriesDirs = fs.readdirSync(photoRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort(naturalSort);
if (seriesDirs.length === 0) throw new Error(`No series directories found in: ${photoRoot}`);

ensureDir(contentDir);
fs.rmSync(publicPhotoRoot, { recursive: true, force: true });
ensureDir(publicPhotoRoot);
ensureDir(generatedDir);

const existingSeriesDescriptions = readJsonSafe(seriesDescriptionsPath, {});
const existingPhotoDescriptions = readJsonSafe(photoDescriptionsPath, {});
const nextSeriesDescriptions = { ...existingSeriesDescriptions };
const usedSlugs = new Map();
const usedOutputTargets = new Set();
const series = [];
let totalPhotos = 0;
let heroPhoto = null;
let createdSeriesDescriptionTemplate = false;

for (const seriesName of seriesDirs) {
  const seriesRoot = path.join(photoRoot, seriesName);
  const files = walkFiles(seriesRoot);
  if (files.length === 0) continue;

  if (!nextSeriesDescriptions[seriesName]) {
    nextSeriesDescriptions[seriesName] = `Серия «${seriesName}». Основное описание можно изменить в content/series-descriptions.json.`;
    createdSeriesDescriptionTemplate = true;
  }

  const rawSlug = slugify(seriesName);
  const count = usedSlugs.get(rawSlug) || 0;
  usedSlugs.set(rawSlug, count + 1);
  const seriesSlug = count === 0 ? rawSlug : `${rawSlug}-${count + 1}`;
  const photos = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const relativeFromPhoto = toPosix(path.relative(photoRoot, file));
    const relativeFromSeries = toPosix(path.relative(seriesRoot, file));
    const fileName = path.basename(file);
    const sourceExt = path.extname(fileName).toLowerCase();
    const sourceBaseName = path.basename(fileName, sourceExt);
    const number = String(index + 1).padStart(2, '0');
    const id = `${seriesSlug}-${number}`;
    const photoDescriptionKey = `${seriesName}/${relativeFromSeries}`;
    const targetSeriesDir = path.join(publicPhotoRoot, seriesName);
    const targetFileName = animatedExtensions.has(sourceExt) ? fileName : `${sourceBaseName}.webp`;
    const targetFile = getUniqueTargetPath(targetSeriesDir, targetFileName, usedOutputTargets);
    await optimizeImage(file, targetFile);
    const relativePublicPath = toPosix(path.relative(path.join(root, 'public'), targetFile));

    photos.push({
      id,
      title: `${seriesName} — ${number}`,
      description: existingPhotoDescriptions[photoDescriptionKey] || `Фотография из серии «${seriesName}». Номер ${number}. Описание можно переопределить в content/photo-descriptions.json по ключу «${photoDescriptionKey}».`,
      fileName,
      sourcePath: `${photoDirName}/${relativeFromPhoto}`,
      publicPath: relativePublicPath,
    });
  }

  const item = { slug: seriesSlug, title: seriesName, description: nextSeriesDescriptions[seriesName], sourceFolder: `${photoDirName}/${seriesName}`, photoCount: photos.length, coverPhoto: photos[0], photos };
  if (!heroPhoto) heroPhoto = photos[0];
  totalPhotos += photos.length;
  series.push(item);
}

if (series.length === 0 || totalPhotos === 0) throw new Error(`No supported images found. Supported extensions: ${Array.from(supportedExtensions).join(', ')}`);
if (!fs.existsSync(seriesDescriptionsPath) || createdSeriesDescriptionTemplate) writeJson(seriesDescriptionsPath, nextSeriesDescriptions);
if (!fs.existsSync(photoDescriptionsPath)) writeJson(photoDescriptionsPath, { '_example': 'Ключ должен выглядеть так: Derealisation/file-name.jpg. Значение станет описанием конкретного фото.' });

writeJson(manifestPath, { generatedAt: new Date().toISOString(), sourceFolder: photoDirName, totalSeries: series.length, totalPhotos, heroPhoto, series });
console.log(`Generated optimized photo manifest: ${series.length} series, ${totalPhotos} photos.`);
'@
  $generator = $generator.Replace('__PHOTO_FOLDER_NAME__', $PhotoFolderName)

  $smokeTest = @'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'src', 'generated', 'photoManifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const errors = [];
if (!manifest || typeof manifest !== 'object') errors.push('manifest must be an object');
if (!Array.isArray(manifest.series) || manifest.series.length === 0) errors.push('manifest.series must contain at least one series');
if (!Number.isInteger(manifest.totalPhotos) || manifest.totalPhotos <= 0) errors.push('manifest.totalPhotos must be positive');
const seenSeriesSlugs = new Set();
const seenPhotoIds = new Set();
for (const series of manifest.series || []) {
  if (!series.slug) errors.push(`series without slug: ${series.title}`);
  if (seenSeriesSlugs.has(series.slug)) errors.push(`duplicate series slug: ${series.slug}`);
  seenSeriesSlugs.add(series.slug);
  if (!series.title) errors.push(`series without title: ${series.slug}`);
  if (!series.description) errors.push(`series without description: ${series.slug}`);
  if (!Array.isArray(series.photos) || series.photos.length === 0) errors.push(`series has no photos: ${series.slug}`);
  if (series.photoCount !== series.photos.length) errors.push(`photoCount mismatch for series: ${series.slug}`);
  for (const photo of series.photos || []) {
    if (!photo.id) errors.push(`photo without id in series: ${series.slug}`);
    if (seenPhotoIds.has(photo.id)) errors.push(`duplicate photo id: ${photo.id}`);
    seenPhotoIds.add(photo.id);
    if (!photo.title) errors.push(`photo without title: ${photo.id}`);
    if (!photo.description) errors.push(`photo without description: ${photo.id}`);
    if (!photo.publicPath) errors.push(`photo without publicPath: ${photo.id}`);
    if (photo.publicPath && !fs.existsSync(path.join(root, 'public', photo.publicPath))) errors.push(`public photo file not found: ${photo.publicPath}`);
  }
}
if (seenPhotoIds.size !== manifest.totalPhotos) errors.push('totalPhotos mismatch');
if (errors.length) { console.error('Smoke-test failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log(`Smoke-test passed: ${manifest.series.length} series, ${manifest.totalPhotos} photos.`);
'@

  $workflow = @'
name: Deploy GitHub Pages

on:
  push:
    branches:
      - __WORKFLOW_BRANCH__
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: npm ci

      - name: Run smoke tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
'@
  $workflow = $workflow.Replace('__WORKFLOW_BRANCH__', $WorkflowBranch)

  $gitignore = @'
node_modules/
dist/
/photo/
.DS_Store
.env
.env.*
!.env.example
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
'@

  $readme = @'
# Marcel Lutik — auto-generated photo portfolio

The site is generated locally from the `photo` folder.

Original `photo/` files are ignored by Git. Optimized web copies are generated into `public/photo/` and committed.

## Update photos

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\deploy-marcel-lutik-real-photos.ps1" -ProjectDir "." -RepoName "marcel-lutik-portfolio" -Visibility public
```

## Edit series descriptions

`content/series-descriptions.json`

## Edit individual photo descriptions

`content/photo-descriptions.json`

Key example:

```json
{
  "Derealisation/DSCF3593.jpg": "Individual description"
}
```
'@

  $seriesDescriptionsTemplate = @'
{
  "Derealisation": "Серия «Derealisation». Основное описание серии можно отредактировать здесь.",
  "Stilllife": "Серия «Stilllife». Основное описание серии можно отредактировать здесь.",
  "Walk": "Серия «Walk». Основное описание серии можно отредактировать здесь."
}
'@

  $photoDescriptionsTemplate = @'
{
  "_example": "Ключ должен выглядеть так: Derealisation/file-name.jpg. Значение станет описанием конкретного фото."
}
'@

  Write-Utf8File (Join-Path $ProjectDir "package.json") $packageJson
  Write-Utf8File (Join-Path $ProjectDir "vite.config.js") $viteConfig
  Write-Utf8File (Join-Path $ProjectDir "tailwind.config.js") $tailwindConfig
  Write-Utf8File (Join-Path $ProjectDir "postcss.config.js") $postcssConfig
  Write-Utf8File (Join-Path $ProjectDir "index.html") $indexHtml
  Write-Utf8File (Join-Path $ProjectDir "src/index.css") $indexCss
  Write-Utf8File (Join-Path $ProjectDir "src/main.jsx") $mainJsx
  Write-Utf8File (Join-Path $ProjectDir "src/icons.jsx") $iconsJsx
  Write-Utf8File (Join-Path $ProjectDir "src/App.jsx") $appJsx
  Write-Utf8File (Join-Path $ProjectDir "scripts/generate-photo-manifest.mjs") $generator
  Write-Utf8File (Join-Path $ProjectDir "scripts/smoke-test.mjs") $smokeTest
  Write-Utf8File (Join-Path $ProjectDir ".github/workflows/pages.yml") $workflow
  Write-Utf8File (Join-Path $ProjectDir ".gitignore") $gitignore
  Write-Utf8File (Join-Path $ProjectDir "README.md") $readme
  Write-Utf8File (Join-Path $ProjectDir "public/.nojekyll") ""
  Write-Utf8File (Join-Path $ProjectDir "content/series-descriptions.json") $seriesDescriptionsTemplate -NoOverwrite
  Write-Utf8File (Join-Path $ProjectDir "content/photo-descriptions.json") $photoDescriptionsTemplate -NoOverwrite

  Write-Ok "Site files created/updated"
}

try {
  Assert-SafeNames
  $ProjectDir = [System.IO.Path]::GetFullPath($ProjectDir)
  $PhotoRoot = Join-Path $ProjectDir $PhotoDirName

  Write-Step "Checking photo library"
  Assert-PhotoLibrary -PhotoRoot $PhotoRoot

  Write-Step "Checking tools"
  Ensure-Command -Command "git" -ToolName "Git" -WingetId "Git.Git" -ChocolateyId "git"
  Ensure-Command -Command "node" -ToolName "Node.js LTS" -WingetId "OpenJS.NodeJS.LTS" -ChocolateyId "nodejs-lts"
  Ensure-NodeVersion
  Ensure-Command -Command "npm" -ToolName "npm" -WingetId "OpenJS.NodeJS.LTS" -ChocolateyId "nodejs-lts"
  Ensure-Command -Command "gh" -ToolName "GitHub CLI" -WingetId "GitHub.cli" -ChocolateyId "gh"
  Ensure-GhAuth

  if ([string]::IsNullOrWhiteSpace($GitHubOwner)) {
    $GitHubOwner = Get-ExternalOutput "gh" @("api", "user", "--jq", ".login")
  }
  if ([string]::IsNullOrWhiteSpace($GitHubOwner)) { throw "Could not determine GitHub owner." }

  $FullRepo = "$GitHubOwner/$RepoName"
  $ownerLower = $GitHubOwner.ToLowerInvariant()
  $repoLower = $RepoName.ToLowerInvariant()
  if ($repoLower -eq "$ownerLower.github.io") {
    $BasePath = "/"
    $PagesUrl = "https://$ownerLower.github.io/"
  }
  else {
    $BasePath = "/$RepoName/"
    $PagesUrl = "https://$ownerLower.github.io/$RepoName/"
  }

  Create-ProjectFiles -BasePath $BasePath -FullRepo $FullRepo -PagesUrl $PagesUrl -PhotoFolderName $PhotoDirName -WorkflowBranch $Branch

  Write-Step "Installing npm dependencies"
  Invoke-External "npm" @("install") -WorkingDirectory $ProjectDir

  Write-Step "Generating optimized photos and validating build"
  Invoke-External "npm" @("run", "generate:photos") -WorkingDirectory $ProjectDir
  Invoke-External "npm" @("test") -WorkingDirectory $ProjectDir
  Invoke-External "npm" @("run", "build") -WorkingDirectory $ProjectDir

  if ((Test-Path (Join-Path $ProjectDir ".git")) -and -not $KeepGitHistory) {
    Write-Warn "Removing existing .git history to drop previous 2GB photo blobs. Use -KeepGitHistory to disable this."
    Remove-Item -Path (Join-Path $ProjectDir ".git") -Recurse -Force
  }

  Write-Step "Initializing Git"
  Invoke-External "git" @("init", "-b", $Branch) -WorkingDirectory $ProjectDir
  Ensure-GitIdentity -Owner $GitHubOwner
  Invoke-External "git" @("add", "-A") -WorkingDirectory $ProjectDir

  $trackedPublicPhotos = Get-ExternalOutput "git" @("ls-files", "public/photo") -WorkingDirectory $ProjectDir
  if ([string]::IsNullOrWhiteSpace($trackedPublicPhotos)) {
    throw "Generated public/photo files are not tracked by Git. Check .gitignore. Expected optimized web photos in public/photo/."
  }

  Invoke-External "git" @("commit", "-m", "Deploy optimized Marcel Lutik photo portfolio") -WorkingDirectory $ProjectDir

  Write-Step "Checking GitHub repository $FullRepo"
  $repoExists = Test-ExternalSuccess "gh" @("repo", "view", $FullRepo)
  if (-not $repoExists) {
    Invoke-External "gh" @("repo", "create", $FullRepo, "--$Visibility", "--description", "Auto-generated Marcel Lutik photo portfolio", "--disable-wiki")
  }
  else {
    Write-Ok "Repository exists"
  }

  $remoteUrl = "https://github.com/$FullRepo.git"
  Invoke-External "git" @("remote", "add", "origin", $remoteUrl) -WorkingDirectory $ProjectDir -AllowFailure | Out-Null
  Invoke-External "git" @("remote", "set-url", "origin", $remoteUrl) -WorkingDirectory $ProjectDir

  Write-Step "Pushing optimized site to GitHub"
  Invoke-External "git" @("push", "-u", "origin", $Branch, "--force") -WorkingDirectory $ProjectDir

  Enable-GitHubPagesWorkflow -FullRepo $FullRepo

  Write-Step "Recent GitHub Actions runs"
  Invoke-External "gh" @("run", "list", "--repo", $FullRepo, "--limit", "3") -AllowFailure

  Write-Ok "Done"
  Write-Host "`nRepository: https://github.com/$FullRepo" -ForegroundColor Green
  Write-Host "Actions:    https://github.com/$FullRepo/actions" -ForegroundColor Green
  Write-Host "Pages URL:  $PagesUrl" -ForegroundColor Green
  Write-Host "`nFor future photo updates, add files to $PhotoDirName\<series> and rerun this script." -ForegroundColor Cyan

  if ($OpenWhenDone) {
    Start-Process "https://github.com/$FullRepo/actions"
    Start-Process $PagesUrl
  }
}
catch {
  Write-Fail $_.Exception.Message
  Write-Host "`nDiagnostics:" -ForegroundColor Yellow
  Write-Host "- Check local photos: $ProjectDir\$PhotoDirName\<series>\*.jpg"
  Write-Host "- Check auth: gh auth status"
  Write-Host "- Check generation: npm run generate:photos"
  Write-Host "- Check build: npm run build"
  Write-Host "- Check GitHub Actions: gh run list --repo <owner>/<repo>"
  exit 1
}
