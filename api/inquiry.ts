import { deliverInquiry, readInquiryEnvironment, validateInquiry } from './inquiryCore.js'
import type { InquiryEmail, SendEmail } from './inquiryCore.js'

declare const process: { env: Record<string, string | undefined> }

export type InquiryResponse = { success: true } | { success: false; error: string }

type InquiryRequest = {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

type InquiryServerResponse = {
  status: (code: number) => InquiryServerResponse
  setHeader?: (name: string, value: string) => void
  json: (body: InquiryResponse) => void
}

type HandlerDependencies = {
  env: Record<string, string | undefined>
  sendEmail: SendEmail
  warn: (message: string) => void
  error: (message: string) => void
}

const MAX_BODY_BYTES = 32 * 1024

function parseBody(body: unknown): unknown {
  if (typeof body === 'string') {
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) throw new Error('too-large')
    return JSON.parse(body)
  }
  return body
}

export const sendResendEmail: SendEmail = async (email: InquiryEmail, apiKey: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  })
  return response.ok
}

export function createInquiryHandler(overrides: Partial<HandlerDependencies> = {}) {
  const dependencies: HandlerDependencies = {
    env: process.env,
    sendEmail: sendResendEmail,
    warn: (message) => console.warn(message),
    error: (message) => console.error(message),
    ...overrides,
  }

  return async function handler(req: InquiryRequest, res: InquiryServerResponse) {
    if (req.method !== 'POST') {
      res.setHeader?.('Allow', 'POST')
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const contentType = req.headers?.['content-type']
    const normalizedContentType = Array.isArray(contentType) ? contentType[0] : contentType
    if (!normalizedContentType?.toLowerCase().startsWith('application/json')) {
      return res.status(415).json({ success: false, error: 'Content type must be application/json' })
    }

    const contentLength = req.headers?.['content-length']
    const normalizedLength = Array.isArray(contentLength) ? contentLength[0] : contentLength
    if (normalizedLength && Number(normalizedLength) > MAX_BODY_BYTES) {
      return res.status(413).json({ success: false, error: 'Request body is too large' })
    }

    let body: unknown
    try {
      body = parseBody(req.body)
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === 'too-large'
      return res.status(tooLarge ? 413 : 400).json({ success: false, error: tooLarge ? 'Request body is too large' : 'Invalid JSON body' })
    }

    const validation = validateInquiry(body)
    if (validation.kind === 'spam') return res.status(200).json({ success: true })
    if (validation.kind === 'invalid') return res.status(400).json({ success: false, error: validation.error })

    let env
    try {
      env = readInquiryEnvironment(dependencies.env)
    } catch {
      dependencies.error('Inquiry email environment is not configured.')
      return res.status(500).json({ success: false, error: 'Inquiry delivery is not configured' })
    }

    try {
      await deliverInquiry(validation.value, env, dependencies.sendEmail, dependencies.warn)
      return res.status(200).json({ success: true })
    } catch {
      dependencies.error('Internal inquiry delivery failed.')
      return res.status(502).json({ success: false, error: 'The inquiry could not be delivered' })
    }
  }
}

export default createInquiryHandler()
