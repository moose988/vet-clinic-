/* Thin-stroke SVG icon set — premium replacement for emoji icons.
   Services can use a key from this set (e.g. "stethoscope") or any emoji. */
const HudIcons = (() => {
  const w = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return {
    stethoscope: w('<path d="M5 3v5a5 5 0 0 0 10 0V3"/><path d="M10 13v2.5a5.5 5.5 0 0 0 11 0V13"/><circle cx="21" cy="10.5" r="2"/>'),
    syringe:     w('<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/>'),
    scalpel:     w('<path d="M3 21c4.5-1 9.5-3.5 12.5-6.5L21 9a2.8 2.8 0 0 0-4-4l-5.5 5.5C8.5 13.5 4 18.5 3 21Z"/><path d="m13 7 4 4"/>'),
    tooth:       w('<path d="M12 5.5c-1.5-1.8-4-2.5-6-1.5-2.5 1.3-3 4.5-1.8 7 .9 1.9 1.6 4 2 6.1.2 1.2.5 3.4 1.8 3.4 1.8 0 1.2-4 4-4s2.2 4 4 4c1.3 0 1.6-2.2 1.8-3.4.4-2.1 1.1-4.2 2-6.1 1.2-2.5.7-5.7-1.8-7-2-1-4.5-.3-6 1.5Z"/>'),
    scissors:    w('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20"/><path d="M14.5 9.5 20 4"/><path d="m8.1 15.9 3.4-3.4"/>'),
    flask:       w('<path d="M10 2v7L4.5 18.5A2.5 2.5 0 0 0 6.7 22h10.6a2.5 2.5 0 0 0 2.2-3.5L14 9V2"/><path d="M8 2h8"/><path d="M7 16h10"/>'),
    scan:        w('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.5"/>'),
    home:        w('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 21v-6h4v6"/>'),
    heart:       w('<path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.3a5 5 0 1 1 7.5 6.3Z"/>'),
    paw:         w('<circle cx="8" cy="7" r="2.2"/><circle cx="16" cy="7" r="2.2"/><circle cx="4.5" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/><path d="M12 11c-2.8 0-5.5 3-5.5 5.6 0 1.6 1.2 2.4 2.6 2.4 1.1 0 1.9-.6 2.9-.6s1.8.6 2.9.6c1.4 0 2.6-.8 2.6-2.4C17.5 14 14.8 11 12 11Z"/>'),
    tag:         w('<path d="M12.6 2.9 21 11.3a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-2.8 0L2.9 12.6A2 2 0 0 1 2.3 11V4.3a2 2 0 0 1 2-2H11a2 2 0 0 1 1.6.6Z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    phone:       w('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.7a2 2 0 0 1 1.6 1.9Z"/>'),
    pin:         w('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
    clock:       w('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    chat:        w('<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.6 8.6 0 0 1-3.7-.8L3 20l1-5.5a8.2 8.2 0 0 1-.9-3.8A8.4 8.4 0 0 1 11.6 2.5h.5A8.4 8.4 0 0 1 21 10.9v.6Z"/>'),
    wallet:      w('<path d="M20 7H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1"/><path d="M16 13.5h2.5"/>'),
    render(key, fallbackSize) {
      if (this[key] && typeof this[key] === 'string') return this[key];
      // not a known key -> treat as emoji/text
      return `<span style="font-size:${fallbackSize || 22}px; line-height:1;">${key || '•'}</span>`;
    }
  };
})();
