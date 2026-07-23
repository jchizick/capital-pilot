export type InquiryPayload = {
  relationshipType: string
  relationshipContext?: string
  discussionTopics: string[]
  otherTopic?: string
  personalContext?: string
  riskAcknowledged: true
  pilotBriefReviewed: boolean
  fullName: string
  email: string
  phone?: string
  preferredContactMethod: 'email' | 'phone' | 'text'
  preferredContactTime?: string
  source: 'private-conversation'
  companyWebsite?: string
}

type InquiryResponse = { success: true } | { success: false; error: string }

export class InquirySubmissionError extends Error {
  constructor() {
    super('The inquiry could not be sent. Your answers are still saved on this device. Please try again.')
    this.name = 'InquirySubmissionError'
  }
}

function isInquiryResponse(value: unknown): value is InquiryResponse {
  if (!value || typeof value !== 'object' || !('success' in value)) return false
  const response = value as { success?: unknown; error?: unknown }
  return response.success === true || (response.success === false && typeof response.error === 'string')
}

export async function submitInquiry(payload: InquiryPayload): Promise<void> {
  try {
    const response = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: payload.source,
        relationshipType: payload.relationshipType,
        relationshipContext: payload.relationshipContext,
        discussionTopics: payload.discussionTopics,
        otherTopic: payload.otherTopic,
        personalContext: payload.personalContext,
        riskAcknowledged: payload.riskAcknowledged,
        pilotBriefReviewed: payload.pilotBriefReviewed,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        preferredContactMethod: payload.preferredContactMethod,
        preferredContactTime: payload.preferredContactTime,
        companyWebsite: payload.companyWebsite,
      }),
    })

    let result: unknown
    try { result = await response.json() } catch { throw new InquirySubmissionError() }
    if (!response.ok || !isInquiryResponse(result) || !result.success) throw new InquirySubmissionError()
  } catch (error) {
    if (error instanceof InquirySubmissionError) throw error
    throw new InquirySubmissionError()
  }
}
