// Emails you when someone fills in the contact form, using Resend (https://resend.com).
// It only runs when RESEND_API_KEY and NOTIFY_EMAIL are set, so the site works fine without it.
// A failed email never stops the visitor's message from being saved.

const oneLine = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim()

export async function notifyNewInquiry(lead) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.NOTIFY_EMAIL
  if (!key || !to) return

  const from = process.env.MAIL_FROM || 'Al Habeeb Website <onboarding@resend.dev>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email, // pressing Reply answers the visitor directly
      subject: `New enquiry from ${oneLine(lead.name)}`,
      text: [
        `Name: ${oneLine(lead.name)}`,
        `Email: ${oneLine(lead.email)}`,
        `Phone: ${oneLine(lead.phone) || '-'}`,
        `Service: ${oneLine(lead.service) || '-'}`,
        '',
        lead.message,
        '',
        'Manage all leads on your website at /admin',
      ].join('\n'),
    }),
  })
  if (!res.ok) throw new Error(`Resend responded ${res.status}`)
}
