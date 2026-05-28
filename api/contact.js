export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { name, business, email, phone, service, message } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Integrity Web Creations <onboarding@resend.dev>',
        to: 'asmalls@integritywebcreations.com',
        reply_to: email,
        subject: `New Website Inquiry from ${name}${business ? ' - ' + business : ''}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <table style="border-collapse:collapse;width:100%;max-width:600px;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:bold;color:#333;width:140px;">Name</td>
              <td style="padding:12px;color:#555;">${escapeHtml(name)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:bold;color:#333;">Business</td>
              <td style="padding:12px;color:#555;">${escapeHtml(business || 'Not provided')}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:bold;color:#333;">Email</td>
              <td style="padding:12px;color:#555;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:bold;color:#333;">Phone</td>
              <td style="padding:12px;color:#555;">${escapeHtml(phone || 'Not provided')}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px;font-weight:bold;color:#333;">Service</td>
              <td style="padding:12px;color:#555;">${escapeHtml(service || 'Not specified')}</td>
            </tr>
            <tr>
              <td style="padding:12px;font-weight:bold;color:#333;vertical-align:top;">Message</td>
              <td style="padding:12px;color:#555;white-space:pre-wrap;">${escapeHtml(message || 'No message provided')}</td>
            </tr>
          </table>
          <hr style="margin-top:24px;border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#999;margin-top:12px;">Sent from the contact form on integritywebcreations.com</p>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
}

// Prevent XSS in email content
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
