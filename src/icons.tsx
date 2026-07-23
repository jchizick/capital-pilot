type IconProps = { name: string; className?: string }

export function LineIcon({ name, className }: IconProps) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.35, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const classes = ['line-icon', `line-icon-${name}`, className].filter(Boolean).join(' ')
  if (name === 'handshake') return <span className={classes} aria-hidden="true" />

  const paths: Record<string, React.ReactNode> = {
    trend: <><path {...common} d="M5 36 17 22l8 8 17-20"/><path {...common} d="M35.5 10H42v6.5"/></>,
    calendar: <><rect {...common} x="7" y="10" width="34" height="31" rx="2"/><path {...common} d="M14 6v8m20-8v8M7 19h34"/><circle cx="16" cy="27.5" r=".9" fill="currentColor"/><circle cx="24" cy="27.5" r=".9" fill="currentColor"/><circle cx="32" cy="27.5" r=".9" fill="currentColor"/><circle cx="16" cy="34.5" r=".9" fill="currentColor"/><circle cx="24" cy="34.5" r=".9" fill="currentColor"/><circle cx="32" cy="34.5" r=".9" fill="currentColor"/></>,
    people: <><circle {...common} cx="24" cy="16" r="7"/><circle {...common} cx="11" cy="21" r="5"/><circle {...common} cx="37" cy="21" r="5"/><path {...common} d="M12 41v-3c0-7 5-12 12-12s12 5 12 12v3M3 39v-3c0-5 4-9 9-9m24 0c5 0 9 4 9 9v3"/></>,
    target: <><circle {...common} cx="24" cy="24" r="15"/><circle {...common} cx="24" cy="24" r="9"/><path {...common} d="M24 3v42M3 24h42"/></>,
    shield: <><path {...common} d="M24 4c6 4 11 5 16 6v12c0 11-6 18-16 23C14 40 8 33 8 22V10c5-1 10-2 16-6Z"/><path {...common} d="m17 18 14 14m0-14L17 32"/></>,
    hourglass: <><path {...common} d="M9.5 5h29M9.5 43h29M13 5c0 9.5 4.8 14.3 11 19-6.2 4.7-11 9.5-11 19m22-38c0 9.5-4.8 14.3-11 19 6.2 4.7 11 9.5 11 19"/><path {...common} d="m18.5 36 5.5-5 5.5 5"/></>,
    relationship: <><circle {...common} cx="16" cy="15" r="7.5"/><circle {...common} cx="32" cy="15" r="7.5"/><path {...common} d="M3 42v-4c0-7.5 5.8-13 13-13s13 5.5 13 13v4M19 42v-4c0-7.5 5.8-13 13-13s13 5.5 13 13v4"/></>,
    lock: <><rect {...common} x="8" y="20" width="32" height="24" rx="2"/><path {...common} d="M15 20v-6a9 9 0 0 1 18 0v6m-9 9v6"/><circle cx="24" cy="29" r="2" fill="currentColor"/></>,
    focus: <><circle {...common} cx="24" cy="24" r="15"/><path {...common} d="m13.5 34.5 21-21"/></>,
    mail: <><rect {...common} x="5" y="10" width="38" height="28" rx="2"/><path {...common} d="m6 12 18 14 18-14"/></>,
    pulse: <path {...common} d="M4 25h10l4-11 7 22 5-16 4 5h10"/>,
    document: <><path {...common} d="M11 4h19l8 8v32H11z"/><path {...common} d="M30 4v9h8M17 22h15M17 29h15M17 36h10"/></>,
    message: <><path {...common} d="M6 8h36v26H20L10 42v-8H6z"/><path {...common} d="M14 17h20M14 24h14"/></>,
    family: <><circle {...common} cx="18" cy="16" r="6"/><circle {...common} cx="31" cy="18" r="5"/><path {...common} d="M7 40v-4c0-7 4.5-12 11-12s11 5 11 12v4m0-14c6 0 10 4.5 10 11v3"/></>,
    friend: <><circle {...common} cx="16" cy="16" r="6"/><circle {...common} cx="32" cy="16" r="6"/><path {...common} d="M5 41v-4c0-7 4.5-12 11-12s11 5 11 12v4m-6-13c2.5-2 6-3 11-3 6.5 0 11 5 11 12v4"/></>,
    professional: <><rect {...common} x="5" y="15" width="38" height="25" rx="2"/><path {...common} d="M18 15v-5h12v5M5 24c10 5 28 5 38 0M21 27h6"/></>,
    referred: <><circle {...common} cx="24" cy="14" r="6"/><path {...common} d="M12 40v-4c0-7 5-12 12-12s12 5 12 12v4M8 15h5m-2.5-2.5v5M37 14h5m-2.5-2.5v5"/></>,
    more: <><circle cx="12" cy="24" r="1.8" fill="currentColor"/><circle cx="24" cy="24" r="1.8" fill="currentColor"/><circle cx="36" cy="24" r="1.8" fill="currentColor"/></>,
    info: <><circle {...common} cx="24" cy="24" r="19"/><path {...common} d="M24 21v13"/><circle cx="24" cy="14" r="1.3" fill="currentColor"/></>,
  }
  return <svg className={classes} viewBox="0 0 48 48" aria-hidden="true">{paths[name]}</svg>
}

export function Arrow({ down = false }: { down?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={down ? 'M12 4v15m-5-5 5 5 5-5' : 'M4 12h15m-5-5 5 5-5 5'} /></svg>
}

export function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>
}

export function Chevron() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
