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