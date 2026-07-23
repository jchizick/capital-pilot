import { FormEvent, ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import { Arrow, LineIcon } from './icons'
import { conversationSteps, discussionOptions, PILOT_BRIEF_HREF, relationshipOptions } from './content'
import { Footer, Header } from './SiteChrome'
import { InquiryPayload, submitInquiry } from './inquirySubmission'

const DRAFT_KEY = 'private-ledger:conversation-draft:v1'
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000

type ContactMethod = '' | 'email' | 'phone' | 'text'
type FormState = {
  relationship: string
  relationshipContext: string
  topics: string[]
  otherTopic: string
  personalContext: string
  riskAcknowledged: boolean
  pilotBriefReviewed: boolean
  fullName: string
  email: string
  phone: string
  contactMethod: ContactMethod
  contactTime: string
}
type Action = { type: 'set'; field: keyof FormState; value: FormState[keyof FormState] } | { type: 'restore'; value: FormState }

const initialState: FormState = {
  relationship: '', relationshipContext: '', topics: [], otherTopic: '', personalContext: '',
  riskAcknowledged: false, pilotBriefReviewed: false, fullName: '', email: '', phone: '', contactMethod: '', contactTime: '',
}

type SavedDraft = { savedAt: number; state: FormState; step: number; completed: number }

function readDraft(): SavedDraft | null {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') as SavedDraft | null
    if (!saved) return null
    if (Date.now() - saved.savedAt >= DRAFT_TTL) { localStorage.removeItem(DRAFT_KEY); return null }
    const mustReconfirmRisk = saved.completed > 3 || saved.step > 3
    return {
      ...saved,
      step: mustReconfirmRisk ? 3 : saved.step,
      completed: mustReconfirmRisk ? 3 : saved.completed,
      state: { ...initialState, ...saved.state, riskAcknowledged: false },
    }
  } catch { return null }
}

function reducer(state: FormState, action: Action): FormState {
  if (action.type === 'restore') return action.value
  return { ...state, [action.field]: action.value }
}

function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  return children ? <p className="field-error" id={id} role="alert">{children}</p> : null
}

function SelectableCard({ type, name, value, checked, onChange, icon, children, describedBy }: {
  type: 'radio' | 'checkbox'; name: string; value: string; checked: boolean; onChange: () => void; icon?: string; children: ReactNode; describedBy?: string
}) {
  return <label className={`select-card ${checked ? 'is-selected' : ''}`}>
    <input type={type} name={name} value={value} checked={checked} onChange={onChange} aria-invalid={Boolean(describedBy) || undefined} aria-describedby={describedBy} />
    <span className="select-control" aria-hidden="true" />
    {icon ? <LineIcon name={icon} /> : null}
    <span>{children}</span>
  </label>
}

function StepHeading({ id, title, copy }: { id: string; title: string; copy?: string }) {
  return <div className="conversation-step-heading"><h2 id={id} tabIndex={-1}>{title}</h2>{copy ? <p>{copy}</p> : null}</div>
}

function RelationshipStep({ state, set, error }: StepProps) {
  const conditional = state.relationship === 'referred' || state.relationship === 'other'
  return <fieldset aria-describedby={error ? 'relationship-error' : undefined}>
    <legend className="sr-only">How do we know each other?</legend>
    <StepHeading id="step-title-0" title="How do we know each other?" />
    <div className="select-grid relationship-grid">
      {relationshipOptions.map((option) => <SelectableCard key={option.value} type="radio" name="relationship" value={option.value} icon={option.icon} checked={state.relationship === option.value} onChange={() => set('relationship', option.value)} describedBy={error ? 'relationship-error' : undefined}>{option.label}</SelectableCard>)}
    </div>
    <FieldError id="relationship-error">{error}</FieldError>
    {conditional ? <div className="conditional-field step-reveal">
      <label htmlFor="relationship-context">{state.relationship === 'referred' ? 'Who introduced us?' : 'Briefly describe the connection'}</label>
      {state.relationship === 'other'
        ? <textarea id="relationship-context" rows={3} maxLength={300} value={state.relationshipContext} onChange={(e) => set('relationshipContext', e.target.value)} aria-invalid={error?.includes('brief') || undefined} aria-describedby={error ? 'relationship-error' : undefined} />
        : <input id="relationship-context" type="text" maxLength={300} value={state.relationshipContext} onChange={(e) => set('relationshipContext', e.target.value)} aria-invalid={error?.includes('introduced') || undefined} aria-describedby={error ? 'relationship-error' : undefined} />}
    </div> : null}
    <p className="step-helper"><LineIcon name="info" />If you select “Referred by someone” or “Other,” a follow-up field will appear.</p>
  </fieldset>
}

function TopicsStep({ state, set, error }: StepProps) {
  const toggle = (topic: string) => set('topics', state.topics.includes(topic) ? state.topics.filter((item) => item !== topic) : [...state.topics, topic])
  return <fieldset aria-describedby={error ? 'topics-error' : undefined}>
    <legend className="sr-only">What would you like to discuss?</legend>
    <StepHeading id="step-title-1" title="What would you like to discuss?" copy="Select all that apply so I can prepare." />
    <div className="select-grid topic-grid">{discussionOptions.map((topic) => <SelectableCard key={topic} type="checkbox" name="topics" value={topic} checked={state.topics.includes(topic)} onChange={() => toggle(topic)} describedBy={error ? 'topics-error' : undefined}>{topic}</SelectableCard>)}</div>
    <FieldError id="topics-error">{error}</FieldError>
    {state.topics.includes('Something else') ? <div className="conditional-field step-reveal"><label htmlFor="other-topic">What would you like to discuss?</label><textarea id="other-topic" rows={3} maxLength={300} value={state.otherTopic} onChange={(e) => set('otherTopic', e.target.value)} aria-invalid={error?.includes('describe') || undefined} aria-describedby={error ? 'topics-error' : undefined} /></div> : null}
  </fieldset>
}

function ContextStep({ state, set }: StepProps) {
  return <fieldset><legend className="sr-only">Personal context</legend><StepHeading id="step-title-2" title="What would be helpful for me to understand before we speak?" copy="Optional context can help frame the conversation." />
    <div className="field-group"><label htmlFor="personal-context">Context <span>Optional</span></label><textarea id="personal-context" rows={7} maxLength={1000} placeholder="Share any questions, concerns, expectations, or relevant context." value={state.personalContext} onChange={(e) => set('personalContext', e.target.value)} /><small className="character-count">{state.personalContext.length} / 1000</small></div>
    <p className="step-helper"><LineIcon name="info" />Please do not include banking details, account information, passwords, or other sensitive financial information.</p>
  </fieldset>
}

function RiskStep({ state, set, error }: StepProps) {
  return <fieldset aria-describedby={error ? 'risk-error' : undefined}><legend className="sr-only">Risk acknowledgment</legend><StepHeading id="step-title-3" title="Risk acknowledgment" copy="Please review these points before continuing." />
    <div className="acknowledgment-list">
      <label className="check-row"><input type="checkbox" checked={state.riskAcknowledged} onChange={(e) => set('riskAcknowledged', e.target.checked)} aria-invalid={Boolean(error) || undefined} aria-describedby={error ? 'risk-error' : undefined} /><span className="check-box" aria-hidden="true" /><span>I understand that trading involves the risk of loss, that past results do not guarantee future performance, and that this conversation does not create an agreement or commitment.</span></label>
      <label className="check-row"><input type="checkbox" checked={state.pilotBriefReviewed} onChange={(e) => set('pilotBriefReviewed', e.target.checked)} /><span className="check-box" aria-hidden="true" /><span>I have reviewed the Pilot Brief. <a href={PILOT_BRIEF_HREF}>Read the Pilot Brief</a></span></label>
    </div><FieldError id="risk-error">{error}</FieldError>
    <p className="step-helper"><LineIcon name="info" />This acknowledgment is not an agreement or electronic signature.</p>
  </fieldset>
}

function ContactStep({ state, set, errors }: StepProps) {
  return <fieldset><legend className="sr-only">Contact details</legend><StepHeading id="step-title-4" title="How can I reach you?" />
    <div className="contact-grid">
      <div className="field-group"><label htmlFor="full-name">Full name <b>Required</b></label><input id="full-name" autoComplete="name" maxLength={120} value={state.fullName} onChange={(e) => set('fullName', e.target.value)} aria-invalid={Boolean(errors?.fullName) || undefined} aria-describedby={errors?.fullName ? 'name-error' : undefined} /><FieldError id="name-error">{errors?.fullName}</FieldError></div>
      <div className="field-group"><label htmlFor="email">Email address <b>Required</b></label><input id="email" type="email" autoComplete="email" maxLength={254} value={state.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors?.email) || undefined} aria-describedby={errors?.email ? 'email-error' : undefined} /><FieldError id="email-error">{errors?.email}</FieldError></div>
      <div className="field-group"><label htmlFor="phone">Phone number <span>{state.contactMethod === 'phone' || state.contactMethod === 'text' ? 'Required' : 'Optional'}</span></label><input id="phone" type="tel" autoComplete="tel" maxLength={40} value={state.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={Boolean(errors?.phone) || undefined} aria-describedby={errors?.phone ? 'phone-error' : undefined} /><FieldError id="phone-error">{errors?.phone}</FieldError></div>
    </div>
    <fieldset className="nested-fieldset"><legend>Preferred contact method <b>Required</b></legend><div className="inline-options">{['email', 'phone', 'text'].map((method) => <label key={method}><input type="radio" name="contact-method" checked={state.contactMethod === method} onChange={() => set('contactMethod', method)} aria-describedby={errors?.contactMethod ? 'method-error' : undefined} /><span className="radio-dot" aria-hidden="true" />{method === 'text' ? 'Text message' : method[0].toUpperCase() + method.slice(1)}</label>)}</div><FieldError id="method-error">{errors?.contactMethod}</FieldError></fieldset>
    <fieldset className="nested-fieldset"><legend>Best general time to reach you <span>Optional</span></legend><div className="inline-options">{['Morning', 'Afternoon', 'Evening', 'No preference'].map((time) => <label key={time}><input type="radio" name="contact-time" checked={state.contactTime === time} onChange={() => set('contactTime', time)} /><span className="radio-dot" aria-hidden="true" />{time}</label>)}</div></fieldset>
  </fieldset>
}

function ReviewStep({ state, edit }: { state: FormState; edit: (step: number) => void }) {
  const relationship = relationshipOptions.find((item) => item.value === state.relationship)?.label
  const groups = [
    { step: 0, title: 'Relationship', rows: [[relationship, state.relationshipContext]] },
    { step: 1, title: 'Reason for reaching out', rows: [[state.topics.join(', '), state.otherTopic]] },
    { step: 2, title: 'Personal context', rows: [[state.personalContext]] },
    { step: 3, title: 'Risk acknowledgment', rows: [['Risk acknowledged'], [state.pilotBriefReviewed ? 'Pilot Brief reviewed' : 'Pilot Brief not yet reviewed']] },
    { step: 4, title: 'Contact details', rows: [[state.fullName], [state.email], [state.phone], [`Preferred contact: ${state.contactMethod}`], [state.contactTime && `Best time: ${state.contactTime}`]] },
  ]
  return <section aria-labelledby="step-title-5"><StepHeading id="step-title-5" title="Review your information" />
    <div className="review-groups">{groups.map((group) => <section className="review-group" key={group.title}><div><h3>{group.title}</h3><button type="button" onClick={() => edit(group.step)}>Edit</button></div>{group.rows.flat().filter(Boolean).map((row) => <p key={row}>{row}</p>)}</section>)}</div>
    <p className="review-note">Please review the information above before sending. Submitting this inquiry does not create an agreement, reserve participation, or commit either party to moving forward.</p>
  </section>
}

type StepErrors = { fullName?: string; email?: string; phone?: string; contactMethod?: string }
type StepProps = { state: FormState; set: (field: keyof FormState, value: FormState[keyof FormState]) => void; error?: string; errors?: StepErrors }

function ConversationStepper({ step, completed, errorStep, goTo }: { step: number; completed: number; errorStep: number | null; goTo: (step: number) => void }) {
  return <div className="conversation-progress">
    <div className="mobile-progress"><span>Step {step + 1} of 6</span><strong>{conversationSteps[step]}</strong><i style={{ width: `${((step + 1) / 6) * 100}%` }} /></div>
    <ol>{conversationSteps.map((label, index) => {
      const canVisit = index <= completed || index === step
      const stateClass = index === step ? 'is-active' : index < completed ? 'is-complete' : errorStep === index ? 'is-error' : ''
      return <li key={label} className={stateClass}><button type="button" disabled={!canVisit} onClick={() => goTo(index)} aria-current={index === step ? 'step' : undefined}><span>{index < completed ? '✓' : index + 1}</span><strong>{label}</strong></button></li>
    })}</ol>
  </div>
}

function PrivacyNotice() {
  return <aside className="privacy-notice"><LineIcon name="lock" /><div><h2>Private inquiries are reviewed personally.</h2><p>Submitting this form does not create an agreement, reserve participation, or commit either party to moving forward.</p><p>Information submitted through this form is intended only to respond to the inquiry and is not used for unrelated marketing.</p></div></aside>
}

export function PrivateConversationPage() {
  const [restored] = useState(readDraft)
  const [state, dispatch] = useReducer(reducer, restored?.state ?? initialState)
  const [step, setStep] = useState(() => Math.min(restored?.step ?? 0, 5))
  const [completed, setCompleted] = useState(() => Math.min(restored?.completed ?? 0, 5))
  const [error, setError] = useState('')
  const [contactErrors, setContactErrors] = useState<StepErrors>({})
  const [errorStep, setErrorStep] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const submissionInFlight = useRef(false)
  const successHeading = useRef<HTMLHeadingElement>(null)
  const submissionStatus = useRef<HTMLDivElement>(null)

  const set = (field: keyof FormState, value: FormState[keyof FormState]) => {
    dispatch({ type: 'set', field, value })
    setError(''); setErrorStep(null)
    if (field === 'fullName' || field === 'email' || field === 'phone' || field === 'contactMethod') {
      setContactErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  useEffect(() => {
    document.title = 'Start a Private Conversation | Private Ledger'
  }, [])

  useEffect(() => {
    if (submitted) return
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), state, step, completed })) } catch { /* Ignore storage failures. */ }
  }, [state, step, completed, submitted])

  useEffect(() => { document.getElementById(`step-title-${step}`)?.focus() }, [step])

  useEffect(() => {
    if (submitted) successHeading.current?.focus()
  }, [submitted])

  useEffect(() => {
    if (submissionMessage) submissionStatus.current?.focus()
  }, [submissionMessage])

  const validate = (target: number) => {
    setError(''); setContactErrors({}); setErrorStep(null)
    if (target === 0) {
      if (!state.relationship) { setError('Please select how we know each other.'); setErrorStep(0); return false }
      if (state.relationship === 'referred' && !state.relationshipContext.trim()) { setError('Please tell me who introduced us.'); setErrorStep(0); return false }
      if (state.relationship === 'other' && !state.relationshipContext.trim()) { setError('Please briefly describe the connection.'); setErrorStep(0); return false }
    }
    if (target === 1) {
      if (!state.topics.length) { setError('Please select at least one topic.'); setErrorStep(1); return false }
      if (state.topics.includes('Something else') && !state.otherTopic.trim()) { setError('Please briefly describe what you would like to discuss.'); setErrorStep(1); return false }
    }
    if (target === 3 && !state.riskAcknowledged) { setError('Please acknowledge the risk statement before continuing.'); setErrorStep(3); return false }
    if (target === 4) {
      const errors: StepErrors = {}
      if (!state.fullName.trim()) errors.fullName = 'Please enter your full name.'
      if (!/^\S+@\S+\.\S+$/.test(state.email)) errors.email = 'Please enter a valid email address.'
      if (!state.contactMethod) errors.contactMethod = 'Please select a preferred contact method.'
      if ((state.contactMethod === 'phone' || state.contactMethod === 'text') && !state.phone.trim()) errors.phone = 'A phone number is required for this contact method.'
      if (Object.keys(errors).length) { setContactErrors(errors); setErrorStep(4); return false }
    }
    return true
  }

  const focusFirstError = () => requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .field-error')?.focus?.())
  const continueFlow = () => {
    if (!validate(step)) { focusFirstError(); return }
    setCompleted((value) => Math.max(value, step + 1)); setStep((value) => Math.min(5, value + 1))
    const shell = document.querySelector('.inquiry-shell')
    if (shell) window.scrollTo({ top: shell.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' })
  }
  const goTo = (target: number) => { if (target <= completed) { setError(''); setContactErrors({}); setStep(target) } }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionInFlight.current) return
    setSubmissionMessage('')
    for (let index = 0; index <= 4; index++) if (!validate(index)) { setStep(index); focusFirstError(); return }
    const honeypot = (event.currentTarget.elements.namedItem('companyWebsite') as HTMLInputElement | null)?.value ?? ''
    const payload: InquiryPayload = {
      relationshipType: state.relationship, relationshipContext: state.relationshipContext.trim() || undefined,
      discussionTopics: state.topics, otherTopic: state.otherTopic.trim() || undefined, personalContext: state.personalContext.trim() || undefined,
      riskAcknowledged: true, pilotBriefReviewed: state.pilotBriefReviewed, fullName: state.fullName.trim(), email: state.email.trim(),
      phone: state.phone.trim() || undefined, preferredContactMethod: state.contactMethod as InquiryPayload['preferredContactMethod'],
      preferredContactTime: state.contactTime || undefined, source: 'private-conversation', companyWebsite: honeypot,
    }
    try {
      submissionInFlight.current = true; setSubmitting(true); await submitInquiry(payload); setSubmitted(true); localStorage.removeItem(DRAFT_KEY)
    } catch (submissionError) {
      setSubmissionMessage(submissionError instanceof Error ? submissionError.message : 'The inquiry could not be sent. Please try again.')
    } finally { submissionInFlight.current = false; setSubmitting(false) }
  }

  const steps = [<RelationshipStep state={state} set={set} error={error} />, <TopicsStep state={state} set={set} error={error} />, <ContextStep state={state} set={set} />, <RiskStep state={state} set={set} error={error} />, <ContactStep state={state} set={set} errors={contactErrors} />, <ReviewStep state={state} edit={goTo} />]

  return <div className="conversation-page"><Header conversation /><main id="top">
    <section className="conversation-hero" aria-labelledby="conversation-title"><div className="conversation-hero-image" aria-hidden="true" /><div className="container conversation-hero-inner"><div className="conversation-hero-copy reveal is-visible"><p className="eyebrow">Private and personal</p><h1 id="conversation-title">Start a private<br />conversation.</h1><p>This is an exploratory conversation, not an application or commitment. A few details will help establish context before we speak.</p><p className="hero-reassurance"><LineIcon name="lock" />No capital information is requested through this form.</p><a className="text-link" href={PILOT_BRIEF_HREF}>Read the Pilot Brief <Arrow /></a></div></div></section>
    <div className="container conversation-wrap"><section className="inquiry-shell" aria-label="Private inquiry form">
      {submitted ? <div className="inquiry-confirmation" aria-live="polite"><p className="eyebrow">Inquiry received</p><h2 ref={successHeading} tabIndex={-1}>Your message has been received.</h2><p>I’ll review the context personally and reach out using your preferred contact method. Submitting this message does not create an agreement, reserve participation, or commit either of us to moving forward.</p><div className="button-row"><a className="button button-primary" href="/">Return to overview</a><a className="button button-secondary" href={PILOT_BRIEF_HREF}>Read the Pilot Brief</a></div></div> : <>
        <ConversationStepper step={step} completed={completed} errorStep={errorStep} goTo={goTo} />
        <form onSubmit={handleSubmit} noValidate><div className="spam-trap" aria-hidden="true"><label htmlFor="company-website">Leave this field empty</label><input id="company-website" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" /></div><div className="conversation-step step-reveal" key={step}>{steps[step]}</div>
          <div className="form-actions">{step > 0 ? <button className="button button-secondary" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : <span />}{step < 5 ? <button className="button button-primary" type="button" onClick={continueFlow}>Continue <Arrow /></button> : <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send private inquiry'} <Arrow /></button>}</div>
          <div ref={submissionStatus} className="submission-status" aria-live="polite" tabIndex={-1}>{submissionMessage ? <p>{submissionMessage}</p> : null}</div>
          {step === 5 ? <a className="return-link" href={PILOT_BRIEF_HREF}>Return to the Pilot Brief</a> : null}
        </form><PrivacyNotice />
      </>}
    </section></div>
  </main><Footer brief /></div>
}
