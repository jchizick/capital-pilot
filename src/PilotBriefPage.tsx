import { useEffect, useState } from 'react'
import { Arrow, CheckIcon, LineIcon } from './icons'
import {
  briefFaqs, briefMetrics, briefPrinciples, briefSections, CONTACT_HREF,
  pilotObjectives, PILOT_BRIEF_UPDATED, processSteps, reportingPanels, riskTerms,
} from './content'
import { Footer, Header } from './SiteChrome'

const performanceChartUrl = new URL('../images/chart.svg', import.meta.url).href

type BriefSectionHeadingProps = { number: string; id: string; title: string; intro?: string }

function BriefSectionHeading({ number, id, title, intro }: BriefSectionHeadingProps) {
  return <div className="brief-section-heading">
    <span aria-hidden="true">{number}</span>
    <div><h2 id={`${id}-title`}>{title}</h2>{intro ? <p>{intro}</p> : null}</div>
  </div>
}

function PrincipleCard({ title, text, icon }: { title: string; text: string; icon: string }) {
  return <article className="brief-card principle-card"><LineIcon name={icon} /><h3>{title}</h3><p>{text}</p></article>
}

function MetricCard({ value, label, note, icon }: { value: string; label: string; note: string; icon: string }) {
  return <article className="brief-card brief-metric"><LineIcon name={icon} /><strong>{value}</strong><h3>{label}</h3><p>{note}</p></article>
}

function PerformanceChartPanel() {
  return <figure className="performance-chart-panel">
    <figcaption className="performance-chart-header">
      <div><span>Cumulative personal performance</span><p>Cumulative P&amp;L from tracked starting capital</p></div>
      <strong>+393%</strong>
    </figcaption>
    <div className="performance-chart-visual">
      <img src={performanceChartUrl} alt="Cumulative personal performance chart showing tracked percentage growth over time" />
    </div>
    <p className="performance-chart-disclosure">Operator-reported <i aria-hidden="true">·</i> Unaudited <i aria-hidden="true">·</i> Past performance does not guarantee future results</p>
  </figure>
}

function ProcessStep({ index, title, text }: { index: number; title: string; text: string }) {
  return <li className="process-step"><span>{index + 1}</span><h3>{title}</h3><p>{text}</p></li>
}

function ReportingPanel({ title, text, icon }: { title: string; text: string; icon: string }) {
  return <article className="brief-card reporting-panel"><LineIcon name={icon} /><h3>{title}</h3><p>{text}</p></article>
}

function FaqItem({ index, question, answer, open, onToggle }: { index: number; question: string; answer: string; open: boolean; onToggle: () => void }) {
  const panelId = `faq-panel-${index}`
  const buttonId = `faq-button-${index}`
  return <div className={`faq-item ${open ? 'is-open' : ''}`}>
    <h3><button id={buttonId} type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle}><span>{question}</span><i aria-hidden="true" /></button></h3>
    <div id={panelId} className="faq-answer" role="region" aria-labelledby={buttonId} hidden={!open}><p>{answer}</p></div>
  </div>
}

function BriefNav({ activeId }: { activeId: string }) {
  return <>
    <details className="brief-mobile-nav">
      <summary>On this page <span aria-hidden="true">+</span></summary>
      <nav aria-label="Pilot Brief sections">{briefSections.map((section) => <a key={section.id} href={`#${section.id}`} className={activeId === section.id ? 'is-active' : ''}>{section.number} <span>{section.title}</span></a>)}</nav>
    </details>
    <aside className="brief-sidebar">
      <nav aria-label="Pilot Brief sections">
        <h2>On this page</h2>
        {briefSections.map((section) => <a key={section.id} href={`#${section.id}`} className={activeId === section.id ? 'is-active' : ''} aria-current={activeId === section.id ? 'location' : undefined}><span>{section.number}</span>{section.title}</a>)}
      </nav>
      <div className="private-brief-note"><LineIcon name="shield" /><h3>Private brief</h3><p>This page is intended as a private orientation document. It is not an offer, solicitation, or guarantee of performance.</p><small>Last updated<strong>{PILOT_BRIEF_UPDATED}</strong></small></div>
    </aside>
  </>
}

export function PilotBriefPage() {
  const [activeId, setActiveId] = useState(briefSections[0].id)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    document.title = 'Pilot Brief | Private Ledger'
    const sections = briefSections.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]?.target.id) setActiveId(visible[0].target.id)
    }, { rootMargin: '-18% 0px -66% 0px', threshold: 0 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return <div className="brief-page">
    <Header brief />
    <main id="top">
      <section className="brief-hero" aria-labelledby="brief-title">
        <div className="brief-hero-image" aria-hidden="true" />
        <div className="container brief-hero-inner">
          <div className="brief-hero-copy reveal">
            <p className="eyebrow">Private Orientation Document</p>
            <h1 id="brief-title">Pilot Brief</h1>
            <p>This private document provides an overview of the Small-Circle Capital Pilot — its purpose, trading approach, operating structure, and what participation may involve. Reading it is informational only and does not represent an offer, commitment, or guarantee.</p>
            <div className="button-row"><a className="button button-primary" href={CONTACT_HREF}>Start a private conversation <Arrow /></a><a className="button button-secondary" href="/">Return to overview</a></div>
          </div>
          <div className="brief-private-panel"><LineIcon name="lock" /><div><strong>Private and personal</strong><span>For invited participants only.</span></div></div>
        </div>
      </section>

      <div className="container brief-shell">
        <BriefNav activeId={activeId} />
        <article className="brief-document">
          <section className="brief-section reveal" id="purpose" aria-labelledby="purpose-title">
            <BriefSectionHeading number="01" id="purpose" title="Purpose of the pilot" />
            <div className="brief-prose"><p>The Small-Circle Capital Pilot is a deliberately limited experiment built around a focused, one-trade-at-a-time approach.</p><p>Its purpose is not to create a large investment operation. The initial goal is to learn how to manage entrusted capital responsibly — operationally, relationally, and emotionally — within a small group of people where trust already exists.</p></div>
          </section>

          <section className="brief-section reveal" id="trading-approach" aria-labelledby="trading-approach-title">
            <BriefSectionHeading number="02" id="trading-approach" title="Trading approach" intro="The approach favors patience, selectivity, and clearly defined risk over constant market activity." />
            <div className="principle-grid">{briefPrinciples.map((item) => <PrincipleCard key={item.title} {...item} />)}</div>
          </section>

          <section className="brief-section reveal" id="track-record" aria-labelledby="track-record-title">
            <BriefSectionHeading number="03" id="track-record" title="Personal track record" intro="The figures below reflect the operator’s personal trading record. They are operator-reported, unaudited, and should not be interpreted as a guarantee of future performance." />
            <div className="brief-metric-grid">{briefMetrics.map((item) => <MetricCard key={item.label} {...item} />)}</div>
            <PerformanceChartPanel />
          </section>

          <section className="brief-section reveal" id="objective" aria-labelledby="objective-title">
            <BriefSectionHeading number="04" id="objective" title="Pilot objective" />
            <div className="brief-prose"><p>The pilot is intended to demonstrate consistency in process, risk management, and communication through a small number of carefully selected opportunities.</p><p>It is not designed to maximize capital, reproduce the full historical result, or maintain constant market exposure.</p></div>
            <ul className="brief-checklist">{pilotObjectives.map((item) => <li key={item}><CheckIcon />{item}</li>)}</ul>
          </section>

          <section className="brief-section risk-section reveal" id="risk-terms" aria-labelledby="risk-terms-title">
            <BriefSectionHeading number="05" id="risk-terms" title="Risk and participation terms" intro="Participation would only proceed after expectations, risk, and operating terms have been discussed clearly." />
            <ul className="risk-list">{riskTerms.map((item) => <li key={item}><LineIcon name="shield" /><span>{item}</span></li>)}</ul>
          </section>

          <section className="brief-section reveal" id="operation" aria-labelledby="operation-title">
            <BriefSectionHeading number="06" id="operation" title="How the pilot would operate" intro="The process begins with alignment before any discussion of capital deployment." />
            <ol className="process-rail">{processSteps.map((item, index) => <ProcessStep key={item.title} index={index} {...item} />)}</ol>
          </section>

          <section className="brief-section reveal" id="reporting" aria-labelledby="reporting-title">
            <BriefSectionHeading number="07" id="reporting" title="Communication and reporting" intro="Participants should receive clear information without being overwhelmed by constant market noise." />
            <div className="reporting-grid">{reportingPanels.map((item) => <ReportingPanel key={item.title} {...item} />)}</div>
          </section>

          <section className="brief-section reveal" id="questions" aria-labelledby="questions-title">
            <BriefSectionHeading number="08" id="questions" title="Questions before participating" />
            <div className="faq-list">{briefFaqs.map((item, index) => <FaqItem key={item.question} index={index} {...item} open={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? null : index)} />)}</div>
          </section>

          <section className="brief-section closing-section reveal" id="closing" aria-labelledby="closing-title">
            <BriefSectionHeading number="09" id="closing" title="Closing note" />
            <div className="brief-prose"><p>This pilot is built on trust, alignment, and a shared commitment to disciplined decision-making.</p><p>Reading this brief does not create an application, agreement, or obligation. If the approach resonates, the next step is simply a private conversation to determine whether further discussion makes sense.</p></div>
            <div className="button-row"><a className="button button-primary" href={CONTACT_HREF}>Start a private conversation <Arrow /></a><a className="button button-secondary" href="/">Return to overview</a></div>
          </section>
        </article>
      </div>
    </main>
    <Footer brief />
  </div>
}
