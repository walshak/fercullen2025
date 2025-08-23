import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { db_operations } from './database';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Generate QR Code as base64 data URL
export async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#01315c',
        light: '#ffffff'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Generate invitation email HTML with dark theme
function generateInvitationHTML(invitee: { sn: string; name: string; email: string }, qrCodeDataURL: string, baseUrl: string): string {
  const rsvpLink = `${baseUrl}/rsvp/${invitee.sn}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fercullen Irish Whiskey Launch - Invitation</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #0a0f1a;
          color: #ffffff;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #1a1f2e;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid #2a2f3e;
        }
        .header {
          background: linear-gradient(135deg, #01315c 0%, #bc9254 50%, #f9d8a4 100%);
          padding: 40px 20px;
          text-align: center;
          color: #ffffff;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          z-index: 1;
        }
        .header-content {
          position: relative;
          z-index: 2;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 20px;
          filter: brightness(1.1);
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
          letter-spacing: 1px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.7;
          color: #e0e0e0;
          background-color: #1a1f2e;
        }
        .greeting {
          font-size: 20px;
          margin-bottom: 25px;
          color: #bc9254;
          font-weight: 600;
        }
        .event-details {
          background: linear-gradient(135deg, #2a2f3e 0%, #1e2332 100%);
          padding: 25px;
          border-radius: 12px;
          margin: 25px 0;
          border: 1px solid #3a3f4e;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .event-details h3 {
          margin-top: 0;
          color: #bc9254;
          font-size: 22px;
          margin-bottom: 20px;
        }
        .detail-item {
          margin: 15px 0;
          display: flex;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #3a3f4e;
        }
        .detail-item:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: bold;
          color: #f9d8a4;
          width: 90px;
          display: inline-block;
          flex-shrink: 0;
        }
        .qr-section {
          text-align: center;
          margin: 35px 0;
          padding: 30px;
          background: linear-gradient(135deg, #2a2f3e 0%, #1e2332 100%);
          border-radius: 12px;
          border: 1px solid #3a3f4e;
        }
        .qr-section h3 {
          color: #bc9254;
          margin-top: 0;
          font-size: 20px;
        }
        .qr-code {
          margin: 25px 0;
          padding: 15px;
          background-color: #ffffff;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .qr-code img {
          border: none;
          border-radius: 8px;
          display: block;
        }
        .rsvp-button {
          display: inline-block;
          background: linear-gradient(135deg, #01315c 0%, #bc9254 100%);
          color: #ffffff;
          padding: 18px 36px;
          text-decoration: none;
          border-radius: 30px;
          font-weight: bold;
          font-size: 16px;
          margin: 25px 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(188, 146, 84, 0.3);
          letter-spacing: 1px;
        }
        .rsvp-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(188, 146, 84, 0.4);
        }
        .footer {
          background: linear-gradient(135deg, #0a0f1a 0%, #01315c 100%);
          color: #e0e0e0;
          padding: 25px;
          text-align: center;
          font-size: 14px;
          border-top: 1px solid #3a3f4e;
        }
        .footer a {
          color: #bc9254;
          text-decoration: none;
        }
        .divider {
          height: 3px;
          background: linear-gradient(to right, #01315c, #bc9254, #f9d8a4);
          margin: 25px 0;
          border-radius: 2px;
        }
        .highlight {
          color: #bc9254;
          font-weight: 600;
        }
        .subtle-text {
          font-size: 13px;
          color: #a0a0a0;
          margin-top: 15px;
        }
        .venue-address {
          color: #c0c0c0;
          font-size: 14px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <h1>🥃 FERCULLEN IRISH WHISKEY</h1>
            <p>Nigeria Launch Event</p>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${invitee.name},
          </div>
          
          <p style="color: #bc9254">You are cordially invited to the exclusive launch of <span class="highlight">Fercullen Irish Whiskey</span> in Nigeria. Join us for an unforgettable evening celebrating premium Irish craftsmanship and the art of fine whiskey making.</p>
          
          <div class="event-details">
            <h3>🗓️ Event Details</h3>
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span>October 18, 2025</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Time:</span>
              <span>5:00 PM WAT</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Venue:</span>
              <div class="venue-address">
                Monarch Event Center<br>
                138 Lekki - Epe Expressway<br>
                Lekki Peninsula II, Lekki 106104<br>
                Lagos, Nigeria
              </div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="qr-section">
            <h3>📱 RSVP Quick Access</h3>
            <p>Scan the QR code below or click the button to confirm your attendance:</p>
            
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="RSVP QR Code" />
            </div>
            
            <a href="${rsvpLink}" class="rsvp-button">RSVP NOW</a>
            
            <div class="subtle-text">
              Direct link: <a href="${rsvpLink}" style="color: #bc9254; text-decoration: none;">${rsvpLink}</a>
            </div>
          </div>
          
          <p>We look forward to celebrating this momentous occasion with you. Please RSVP by <span class="highlight">October 15, 2025</span>.</p>
          
          <p style="margin-bottom: 0; color: #bc9254">Experience the heritage, taste the excellence.</p>
        </div>
        
        <div class="footer">
          <p style="margin: 0;">
            <strong>Fercullen Irish Whiskey</strong><br>
            Premium Irish Spirits | Est. in Ireland
          </p>
          <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            This is an exclusive invitation. Please do not forward this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send invitation email
export async function sendInvitationEmail(invitee: { sn: string; name: string; email: string; email_invite_flag?: boolean }, baseUrl?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Use provided baseUrl or fallback to environment variable
    const appBaseUrl = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Generate QR code for RSVP link
    const rsvpLink = `${appBaseUrl}/rsvp/${invitee.sn}`;
    const qrCodeDataURL = await generateQRCode(rsvpLink);
    
    // Generate email HTML
    const htmlContent = generateInvitationHTML(invitee, qrCodeDataURL, appBaseUrl);
    
    // Email options
    const mailOptions = {
      from: {
        name: 'Fercullen Irish Whiskey',
        address: process.env.MAIL_FROM_ADDRESS || ''
      },
      to: invitee.email,
      subject: '🥃 Exclusive Invitation: Fercullen Irish Whiskey Nigeria Launch',
      html: htmlContent,
      attachments: [
        {
          filename: `fercullen-rsvp-${invitee.sn}.png`,
          content: qrCodeDataURL.split(',')[1],
          encoding: 'base64',
          cid: 'qrcode'
        }
      ]
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Update invitation status in database
    await db_operations.updateInvitee(invitee.sn, {
      invitation_sent: true,
      invitation_sent_at: new Date().toISOString()
    });
    
    // Log successful send
    await db_operations.logInvitation(invitee.sn, invitee.email, 'sent');
    
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    
    // Log failed send
    await db_operations.logInvitation(
      invitee.sn, 
      invitee.email, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send bulk invitations
export async function sendBulkInvitations(invitees: Array<{ sn: string; name: string; email: string; email_invite_flag?: boolean; invitation_sent?: boolean }>, baseUrl?: string): Promise<{
  success: number;
  failed: number;
  results: Array<{ sn: string; success: boolean; error?: string }>
}> {
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  
  for (const invitee of invitees) {
    if (invitee.email_invite_flag && !invitee.invitation_sent) {
      const result = await sendInvitationEmail(invitee, baseUrl);
      
      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }
      
      results.push({
        sn: invitee.sn,
        success: result.success,
        error: result.error
      });
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    success: successCount,
    failed: failedCount,
    results
  };
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    await transporter.verify();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
