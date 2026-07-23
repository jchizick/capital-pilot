import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildConfirmationEmail,
  buildInternalEmail,
  deliverInquiry,
  escapeHtml,
  readInquiryEnvironment,
  validateInquiry,
  type InquiryEmail,
  type ValidInquiry,
} from './inquiryCore.ts'
import { createInquiryHandler } from './inquiry.ts'

const validPayload = {
  source: 'private-conversation',
  relationshipType: 'friend',
  discussionTopics: ['Learning more about the pilot'],
  riskAcknowledged: true,
  pilotBriefReviewed: false,
  fullName: 'Ada Lovelace',
  email: 'ADA@example.com',
  preferredContactMethod: 'email',
}

const env = {
  RESEND_API_KEY: 'test-key',
  INQUIRY_FROM_EMAIL: 'Capital Pilot <capitalpilot@chizick.com>',
  INQUIRY_TO_EMAIL: 'jordan@chizick.com',
}

function validInquiry(): ValidInquiry {
  const result = validateInquiry(validPayload)
  assert.equal(result.kind, 'valid')
  return result.value
}

function responseRecorder() {
  const record: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} }
  const response = {
    status(code: number) { record.status = code; return response },
    setHeader(name: string, value: string) { record.headers[name] = value },
    json(body: unknown) { record.body = body },
  }
  return { record, response }
}

test('accepts and trims a valid inquiry', () => {
  const result = validateInquiry(validPayload)
  assert.equal(result.kind, 'valid')
  assert.equal(result.value.email, 'ada@example.com')
})

test('rejects missing required fields and invalid email', () => {
  assert.equal(validateInquiry({}).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, email: 'not-an-email' }).kind, 'invalid')
})

test('rejects unknown relationship values and missing conditional relationship context', () => {
  assert.equal(validateInquiry({ ...validPayload, relationshipType: 'stranger' }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, relationshipType: 'referred' }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, relationshipType: 'other' }).kind, 'invalid')
})

test('rejects unknown, duplicate, and context-free other topics', () => {
  assert.equal(validateInquiry({ ...validPayload, discussionTopics: ['Unknown'] }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, discussionTopics: ['Potential participation', 'Potential participation'] }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, discussionTopics: ['Something else'] }).kind, 'invalid')
})

test('requires the risk acknowledgment', () => {
  assert.equal(validateInquiry({ ...validPayload, riskAcknowledged: false }).kind, 'invalid')
})

test('requires a phone for phone or text contact but not email contact', () => {
  assert.equal(validateInquiry({ ...validPayload, preferredContactMethod: 'phone' }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, preferredContactMethod: 'text', phone: '+1 416 555 0100' }).kind, 'valid')
  assert.equal(validateInquiry(validPayload).kind, 'valid')
})

test('rejects oversized fields and malformed types', () => {
  assert.equal(validateInquiry({ ...validPayload, fullName: 'x'.repeat(121) }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, personalContext: 'x'.repeat(1001) }).kind, 'invalid')
  assert.equal(validateInquiry({ ...validPayload, personalContext: { nested: true } }).kind, 'invalid')
})

test('treats a populated honeypot as spam without retaining it', () => {
  assert.deepEqual(validateInquiry({ ...validPayload, companyWebsite: 'https://spam.example' }), { kind: 'spam' })
})

test('escapes submitted HTML in both email builders', () => {
  assert.equal(escapeHtml(`<script>alert('x') & "y"</script>`), '&lt;script&gt;alert(&#39;x&#39;) &amp; &quot;y&quot;&lt;/script&gt;')
  const inquiry = { ...validInquiry(), fullName: '<img src=x>', personalContext: '<script>bad()</script>' }
  const internal = buildInternalEmail(inquiry, readInquiryEnvironment(env))
  const confirmation = buildConfirmationEmail(inquiry, readInquiryEnvironment(env))
  assert.doesNotMatch(internal.html, /<script>bad/)
  assert.match(internal.html, /&lt;script&gt;bad/)
  assert.doesNotMatch(confirmation.html, /<img src=x>/)
})

test('builds subjects and Reply-To addresses correctly', () => {
  const inquiry = validInquiry()
  const config = readInquiryEnvironment(env)
  const internal = buildInternalEmail(inquiry, config)
  const confirmation = buildConfirmationEmail(inquiry, config)
  assert.match(internal.subject, /^\[Capital Pilot\]/)
  assert.equal(internal.reply_to, inquiry.email)
  assert.equal(confirmation.reply_to, config.toEmail)
})

test('does not attempt confirmation when internal delivery fails', async () => {
  let calls = 0
  await assert.rejects(deliverInquiry(validInquiry(), readInquiryEnvironment(env), async () => { calls += 1; return false }))
  assert.equal(calls, 1)
})

test('returns success semantics after internal delivery when confirmation fails', async () => {
  let calls = 0
  const warnings: string[] = []
  await deliverInquiry(validInquiry(), readInquiryEnvironment(env), async () => { calls += 1; return calls === 1 }, (message) => warnings.push(message))
  assert.equal(calls, 2)
  assert.deepEqual(warnings, ['Inquiry received; visitor confirmation delivery failed.'])
})

test('rejects unsupported methods', async () => {
  const { record, response } = responseRecorder()
  await createInquiryHandler({ env, sendEmail: async () => true })({ method: 'GET' }, response)
  assert.equal(record.status, 405)
  assert.equal(record.headers.Allow, 'POST')
})

test('rejects malformed JSON without sending email', async () => {
  let sends = 0
  const { record, response } = responseRecorder()
  await createInquiryHandler({ env, sendEmail: async () => { sends += 1; return true } })({
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json',
  }, response)
  assert.equal(record.status, 400)
  assert.equal(sends, 0)
})

test('fails truthfully when environment configuration is missing', async () => {
  const errors: string[] = []
  const { record, response } = responseRecorder()
  await createInquiryHandler({ env: {}, sendEmail: async () => true, error: (message) => errors.push(message) })({
    method: 'POST', headers: { 'content-type': 'application/json' }, body: validPayload,
  }, response)
  assert.equal(record.status, 500)
  assert.deepEqual(record.body, { success: false, error: 'Inquiry delivery is not configured' })
  assert.equal(errors.length, 1)
})

test('reports internal delivery failure and never duplicates the internal email', async () => {
  const sent: InquiryEmail[] = []
  const { record, response } = responseRecorder()
  await createInquiryHandler({ env, sendEmail: async (email) => { sent.push(email); return false }, error: () => undefined })({
    method: 'POST', headers: { 'content-type': 'application/json' }, body: validPayload,
  }, response)
  assert.equal(record.status, 502)
  assert.equal(sent.length, 1)
  assert.match(sent[0].subject, /^\[Capital Pilot\]/)
})

test('returns success when only confirmation delivery fails', async () => {
  let sends = 0
  const { record, response } = responseRecorder()
  await createInquiryHandler({ env, sendEmail: async () => { sends += 1; return sends === 1 }, warn: () => undefined })({
    method: 'POST', headers: { 'content-type': 'application/json' }, body: validPayload,
  }, response)
  assert.equal(record.status, 200)
  assert.deepEqual(record.body, { success: true })
  assert.equal(sends, 2)
})
