export const RELATIONSHIP_TYPES = ['family', 'friend', 'professional', 'referred', 'other'] as const
export const DISCUSSION_TOPICS = [
  'Learning more about the pilot',
  'Potential participation',
  'Understanding the trading approach',
  'Reviewing the personal track record',
  'Discussing risk and how the pilot may operate',
  'Something else',
] as const
export const CONTACT_METHODS = ['email', 'phone', 'text'] as const
export const CONTACT_TIMES = ['Morning', 'Afternoon', 'Evening', 'No preference'] as const

export type ValidInquiry = {
  source: 'private-conversation'
  relationshipType: (typeof RELATIONSHIP_TYPES)[number]
  relationshipContext?: string
  discussionTopics: (typeof DISCUSSION_TOPICS)[number][]
  otherTopic?: string
  personalContext?: string
  riskAcknowledged: true
  pilotBriefReviewed: boolean
  fullName: string
  email: string
  phone?: string
  preferredContactMethod: (typeof CONTACT_METHODS)[number]
  preferredContactTime?: (typeof CONTACT_TIMES)[number]
}

export type InquiryEmail = {
  from: string
  to: string
  reply_to: string
  subject: string
  html: string
  text: string
}

export type InquiryEnvironment = {
  apiKey: string
  fromEmail: string
  toEmail: string
}

export type ValidationResult =
  | { kind: 'valid'; value: ValidInquiry }
  | { kind: 'spam' }
  | { kind: 'invalid'; error: string }

const MAX_LENGTHS = {
  fullName: 120,
  email: 254,
  phone: 40,
  relationshipContext: 300,
  otherTopic: 300,
  personalContext: 1000,
} as const

const expectedKeys = new Set([
  'source', 'relationshipType', 'relationshipContext', 'discussionTopics', 'otherTopic',
  'personalContext', 'riskAcknowledged', 'pilotBriefReviewed', 'fullName', 'email', 'phone',
  'preferredContactMethod', 'preferredContactTime', 'companyWebsite',
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanRequiredString(value: unknown, field: string, max: number, min = 1): string {
  if (typeof value !== 'string') throw new Error(`${field} is required`)
  const cleaned = value.trim()
  if (cleaned.length < min || cleaned.length > max) throw new Error(`${field} is invalid`)
  return cleaned
}

function cleanOptionalString(value: unknown, field: string, max: number): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`${field} is invalid`)
  const cleaned = value.trim()
  if (!cleaned) return undefined
  if (cleaned.length > max) throw new Error(`${field} is too long`)
  return cleaned
}

function isOneOf<const T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value)
}

export function validateInquiry(input: unknown): ValidationResult {
  if (!isPlainObject(input)) return { kind: 'invalid', error: 'Invalid request body' }

  const honeypot = input.companyWebsite
  if (typeof honeypot === 'string' && honeypot.trim()) return { kind: 'spam' }
  if (honeypot !== undefined && typeof honeypot !== 'string') return { kind: 'invalid', error: 'Invalid request body' }
  if (Object.keys(input).some((key) => !expectedKeys.has(key))) return { kind: 'invalid', error: 'Invalid request body' }

  try {
    const source = cleanRequiredString(input.source, 'Source', 40)
    if (source !== 'private-conversation') throw new Error('Source is invalid')

    const relationshipType = cleanRequiredString(input.relationshipType, 'Relationship type', 40)
    if (!isOneOf(relationshipType, RELATIONSHIP_TYPES)) throw new Error('Relationship type is invalid')
    const relationshipContext = cleanOptionalString(input.relationshipContext, 'Relationship context', MAX_LENGTHS.relationshipContext)
    if ((relationshipType === 'referred' || relationshipType === 'other') && !relationshipContext) {
      throw new Error('Relationship context is required')
    }

    if (!Array.isArray(input.discussionTopics) || input.discussionTopics.length === 0) {
      throw new Error('At least one discussion topic is required')
    }
    if (input.discussionTopics.some((topic) => typeof topic !== 'string')) throw new Error('Discussion topics are invalid')
    const discussionTopics = input.discussionTopics.map((topic) => topic.trim())
    if (new Set(discussionTopics).size !== discussionTopics.length) throw new Error('Duplicate discussion topics are not allowed')
    if (discussionTopics.some((topic) => !isOneOf(topic, DISCUSSION_TOPICS))) throw new Error('Discussion topics are invalid')
    const typedTopics = discussionTopics as ValidInquiry['discussionTopics']

    const otherTopic = cleanOptionalString(input.otherTopic, 'Other topic', MAX_LENGTHS.otherTopic)
    if (typedTopics.includes('Something else') && !otherTopic) throw new Error('Other topic is required')

    const personalContext = cleanOptionalString(input.personalContext, 'Personal context', MAX_LENGTHS.personalContext)
    if (input.riskAcknowledged !== true) throw new Error('Risk acknowledgment is required')
    if (typeof input.pilotBriefReviewed !== 'boolean') throw new Error('Pilot Brief review status is invalid')

    const fullName = cleanRequiredString(input.fullName, 'Full name', MAX_LENGTHS.fullName, 2)
    const email = cleanRequiredString(input.email, 'Email', MAX_LENGTHS.email).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email is invalid')

    const phone = cleanOptionalString(input.phone, 'Phone', MAX_LENGTHS.phone)
    const preferredContactMethod = cleanRequiredString(input.preferredContactMethod, 'Preferred contact method', 10)
    if (!isOneOf(preferredContactMethod, CONTACT_METHODS)) throw new Error('Preferred contact method is invalid')
    if ((preferredContactMethod === 'phone' || preferredContactMethod === 'text') && (!phone || phone.replace(/\D/g, '').length < 7)) {
      throw new Error('A valid phone number is required')
    }

    const preferredContactTime = cleanOptionalString(input.preferredContactTime, 'Preferred contact time', 20)
    if (preferredContactTime && !isOneOf(preferredContactTime, CONTACT_TIMES)) throw new Error('Preferred contact time is invalid')

    return {
      kind: 'valid',
      value: {
        source,
        relationshipType,
        relationshipContext,
        discussionTopics: typedTopics,
        otherTopic,
        personalContext,
        riskAcknowledged: true,
        pilotBriefReviewed: input.pilotBriefReviewed,
        fullName,
        email,
        phone,
        preferredContactMethod,
        preferredContactTime: preferredContactTime as ValidInquiry['preferredContactTime'],
      },
    }
  } catch (error) {
    return { kind: 'invalid', error: error instanceof Error ? error.message : 'Invalid inquiry' }
  }
}

export function readInquiryEnvironment(env: Record<string, string | undefined>): InquiryEnvironment {
  const apiKey = env.RESEND_API_KEY?.trim()
  const fromEmail = env.INQUIRY_FROM_EMAIL?.trim()
  const toEmail = env.INQUIRY_TO_EMAIL?.trim()
  if (!apiKey || !fromEmail || !toEmail) throw new Error('Inquiry email environment is not configured')
  return { apiKey, fromEmail, toEmail }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

function htmlValue(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />')
}

const relationshipLabels: Record<ValidInquiry['relationshipType'], string> = {
  family: 'Family', friend: 'Friend', professional: 'Professional relationship',
  referred: 'Referred by someone', other: 'Other',
}

export function buildInternalEmail(inquiry: ValidInquiry, env: InquiryEnvironment, submittedAt = new Date()): InquiryEmail {
  const rows: Array<[string, string]> = [
    ['Full name', inquiry.fullName],
    ['Email', inquiry.email],
    ...(inquiry.phone ? [['Phone number', inquiry.phone] as [string, string]] : []),
    ['Preferred contact method', inquiry.preferredContactMethod],
    ...(inquiry.preferredContactTime ? [['Preferred contact time', inquiry.preferredContactTime] as [string, string]] : []),
    ['Relationship type', relationshipLabels[inquiry.relationshipType]],
    ...(inquiry.relationshipContext ? [['Relationship context', inquiry.relationshipContext] as [string, string]] : []),
    ['Selected discussion topics', inquiry.discussionTopics.join('\n• ')],
    ...(inquiry.otherTopic ? [['Other discussion topic', inquiry.otherTopic] as [string, string]] : []),
    ...(inquiry.personalContext ? [['Personal context', inquiry.personalContext] as [string, string]] : []),
    ['Risk acknowledgment', 'Acknowledged'],
    ['Pilot Brief reviewed', inquiry.pilotBriefReviewed ? 'Yes' : 'No'],
    ['Submitted', submittedAt.toISOString()],
    ['Source', inquiry.source],
  ]
  const subject = `[Capital Pilot] New private inquiry — ${inquiry.fullName}`
  const text = ['New private inquiry', '', ...rows.flatMap(([label, value]) => [`${label}:`, value, ''])].join('\n').trim()
  const htmlRows = rows.map(([label, value]) => `<tr><th style="padding:10px 16px 4px;text-align:left;color:#9b7858;font:600 12px Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(label)}</th></tr><tr><td style="padding:0 16px 14px;color:#223039;font:15px/1.6 Arial,sans-serif">${htmlValue(value)}</td></tr>`).join('')
  const html = `<div style="margin:0;padding:32px;background:#f3efe9"><div style="max-width:640px;margin:auto;border:1px solid #d8c9b9;background:#fff"><div style="padding:24px 28px;background:#07141c;color:#f4ede4"><div style="font:12px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#c69767">Capital Pilot</div><h1 style="margin:8px 0 0;font:400 28px Georgia,serif">New private inquiry</h1></div><table role="presentation" style="width:100%;border-collapse:collapse;padding:18px 12px"><tbody>${htmlRows}</tbody></table></div></div>`
  return { from: env.fromEmail, to: env.toEmail, reply_to: inquiry.email, subject, html, text }
}

export function buildConfirmationEmail(inquiry: ValidInquiry, env: InquiryEnvironment): InquiryEmail {
  const firstName = inquiry.fullName.split(/\s+/)[0] || inquiry.fullName
  const text = `Hi ${firstName},\n\nThank you for reaching out. I’ve received your message and will review the context personally. I’ll respond using your preferred contact method.\n\nSubmitting this inquiry does not create an agreement, reserve participation, or commit either of us to moving forward.\n\nJordan\nPrivate Ledger\nSmall-Circle Capital Pilot`
  const html = `<div style="margin:0;padding:32px;background:#f3efe9"><div style="max-width:600px;margin:auto;border:1px solid #d8c9b9;background:#fff;padding:36px;color:#223039;font:15px/1.7 Arial,sans-serif"><div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#9b7858">Capital Pilot</div><h1 style="margin:12px 0 24px;font:400 30px Georgia,serif;color:#07141c">Your inquiry has been received.</h1><p>Hi ${escapeHtml(firstName)},</p><p>Thank you for reaching out. I’ve received your message and will review the context personally. I’ll respond using your preferred contact method.</p><p>Submitting this inquiry does not create an agreement, reserve participation, or commit either of us to moving forward.</p><p style="margin-top:28px">Jordan<br />Private Ledger<br />Small-Circle Capital Pilot</p></div></div>`
  return {
    from: env.fromEmail,
    to: inquiry.email,
    reply_to: env.toEmail,
    subject: 'Your private inquiry has been received',
    html,
    text,
  }
}

export type SendEmail = (email: InquiryEmail, apiKey: string) => Promise<boolean>

export async function deliverInquiry(
  inquiry: ValidInquiry,
  env: InquiryEnvironment,
  sendEmail: SendEmail,
  warn: (message: string) => void = console.warn,
): Promise<void> {
  const internalDelivered = await sendEmail(buildInternalEmail(inquiry, env), env.apiKey)
  if (!internalDelivered) throw new Error('Internal inquiry delivery failed')

  try {
    const confirmationDelivered = await sendEmail(buildConfirmationEmail(inquiry, env), env.apiKey)
    if (!confirmationDelivered) warn('Inquiry received; visitor confirmation delivery failed.')
  } catch {
    warn('Inquiry received; visitor confirmation delivery failed.')
  }
}
