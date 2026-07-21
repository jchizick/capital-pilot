import { useEffect } from 'react'
import { Arrow, CheckIcon, LineIcon } from './icons'
import { CONTACT_HREF, metrics, participationPrinciples, PILOT_BRIEF_HREF, principles } from './content'
import { PilotBriefPage } from './PilotBriefPage'
import { Footer, Header } from './SiteChrome'

function Hero() {
  return <section className="hero" id="about" aria-labelledby="hero-title">
    <div className="hero-image" role="img" aria-label="A lantern-lit stone terrace overlooking a mountain lake at dusk" />
    <div className="container hero-content reveal">
      <p className="eyebrow">Private Capital Experiment</p>
      <h1 id="hero-title">One trade at a time.<br />Managed with discipline.<br />Stewarded with care.</h1>
      <p className="hero-copy">A small private experiment with family and friends, designed to explore whether my concentrated trading discipline can be applied responsibly to entrusted capital.</p>
      <div className="button-row">
        <a className="button button-primary" href={PILOT_BRIEF_HREF}>Read the pilot brief <Arrow /></a>
        <a className="button button-secondary" href="#approach">How the pilot works <Arrow down /></a>
      </div>
    </div>
  </section>
}

function PilotSnapshot() {
  return <section className="snapshot-wrap" aria-label="Pilot snapshot"><div className="container snapshot">
    {metrics.map((metric) => <div className="metric" key={metric.label}>
      <span className="metric-icon"><LineIcon name={metric.icon} /></span>
      <div><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.note}</small></div>
    </div>)}
  </div></section>
}

function ApproachSection() {
  return <section className="section approach" id="approach"><div className="container">
    <div className="approach-grid">
      <div className="section-intro reveal">
        <p className="eyebrow">A Disciplined Approach</p>
        <h2>This is not a fund.<br />It’s a disciplined approach.</h2>
        <p>The pilot is built around how I trade—focused, selective, and risk-aware.</p>
      </div>
      <div className="principles">
        {principles.map((principle) => <article className="principle reveal" key={principle.title}>
          <LineIcon name={principle.icon} />
          <h3><span>{principle.number}.</span> {principle.title}</h3>
          <p>{principle.text}</p>
        </article>)}
      </div>
    </div>
    <div className="clarification"><span className="clarification-mark" aria-hidden="true">✦</span><p>This is not a diversified fund or a public offering. It is a limited pilot built on selective participation, concentrated attention, defined risk, and clear communication.</p></div>
  </div></section>
}

function WhySmallSection() {
  const points = ['Clear expectations', 'Predefined limits', 'Consistent communication', 'Capital protection first']
  return <section className="why-small" id="why-small"><div className="container why-grid">
    <div className="why-copy reveal">
      <p className="eyebrow">Why Start Small</p>
      <h2>The first goal<br />is not maximizing capital.</h2>
      <span className="short-rule" />
      <p>The first goal is learning how to manage entrusted capital responsibly—emotionally, relationally, and operationally.</p>
      <p>The pilot stays small because scale should be earned, not assumed.</p>
    </div>
    <ul className="why-points">{points.map((point) => <li key={point}><CheckIcon /><span>{point}</span></li>)}</ul>
  </div></section>
}

function ParticipationSection() {
  return <section className="section participation" id="participation"><div className="container participation-grid">
    <div className="section-intro reveal">
      <p className="eyebrow">Participation</p>
      <h2>A small circle<br />built on trust.</h2>
      <p>Participation is limited to people with whom there is an existing relationship, shared expectations, and a long-term mindset.</p>
    </div>
    <div className="participation-points">
      {participationPrinciples.map((point) => <article className="participation-point reveal" key={point.title}>
        <LineIcon name={point.icon} /><h3>{point.title}</h3><p>{point.text}</p>
      </article>)}
    </div>
  </div></section>
}

function FinalInvitation() {
  return <section className="invitation-wrap" id="contact"><div className="container"><div className="invitation">
    <div className="invitation-copy reveal">
      <p className="eyebrow">Private and Personal</p>
      <h2>If this resonates,<br />let’s have a conversation.</h2>
      <p>This pilot is not being promoted publicly or built for rapid growth. It’s personal by design.</p>
      <a className="button button-primary" href={CONTACT_HREF}>Start a private conversation <Arrow /></a>
    </div>
    <span className="invitation-visual" aria-hidden="true" />
  </div></div></section>
}

function App() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  if (window.location.pathname.replace(/\/$/, '') === '/pilot-brief') return <PilotBriefPage />
  return <><Header /><main id="top"><Hero /><PilotSnapshot /><ApproachSection /><WhySmallSection /><ParticipationSection /><FinalInvitation /></main><Footer /></>
}

export default App
