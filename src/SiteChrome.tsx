import { useEffect, useState } from 'react'
import { Arrow } from './icons'
import { navItems, PILOT_BRIEF_HREF } from './content'
import { PrivateLedgerMark } from './PrivateLedgerMark'

export function Brand({ brief = false }: { brief?: boolean }) {
  return <a className="brand" href={brief ? '/' : '#top'} aria-label="Private Ledger home">
    <PrivateLedgerMark />
    <span className="brand-copy"><strong>Private Ledger</strong><small>SMALL-CIRCLE CAPITAL PILOT</small></span>
  </a>
}

export function Header({ brief = false, conversation = false }: { brief?: boolean; conversation?: boolean }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    document.body.classList.toggle('menu-open', open)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey); document.body.classList.remove('menu-open') }
  }, [open])
  return <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
    <div className="header-inner">
      <Brand brief={brief} />
      <nav className={`nav ${open ? 'is-open' : ''}`} aria-label="Primary navigation" id="primary-nav">
        {navItems.map((item) => {
          const active = conversation && item.href === '#participation'
          return <a key={item.href} href={(brief || conversation) ? `/${item.href}` : item.href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}>{item.label}</a>
        })}
        <a className={`button button-small nav-cta ${brief ? 'is-active' : ''}`} href={PILOT_BRIEF_HREF} aria-current={brief ? 'page' : undefined} onClick={() => setOpen(false)}>Read the pilot brief <Arrow /></a>
      </nav>
      <button className="menu-button" type="button" aria-expanded={open} aria-controls="primary-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((value) => !value)}><span /><span /></button>
    </div>
  </header>
}

export function Footer({ brief = false }: { brief?: boolean }) {
  return <footer><div className="container footer-inner"><Brand brief={brief} /><p>For informational purposes only.<br />Not a public offer or solicitation.</p><span className="footer-mark" aria-hidden="true">✦</span></div></footer>
}
