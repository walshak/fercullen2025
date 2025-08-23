import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { db_operations } from './database';

// Create transporter with increased timeout and better error handling
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: process.env.MAIL_ENCRYPTION === 'ssl',
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10, // messages per second
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
          background-color: #1a1f2e;
          color: #e0e4e7;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 25px;
          color: #ffffff;
        }
        .invitation-text {
          font-size: 16px;
          margin-bottom: 30px;
          text-align: left;
          color: #d0d4d7;
        }
        .event-details {
          background: linear-gradient(135deg, #01315c, #2a3f5c);
          border: 1px solid #bc9254;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .event-details h3 {
          margin: 0 0 15px 0;
          color: #f9d8a4;
          font-size: 20px;
          font-weight: bold;
        }
        .event-details p {
          margin: 8px 0;
          color: #ffffff;
          font-size: 14px;
        }
        .qr-section {
          background-color: #0f1419;
          border: 2px solid #bc9254;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 30px 0;
        }
        .qr-section h3 {
          margin: 0 0 15px 0;
          color: #f9d8a4;
          font-size: 18px;
        }
        .qr-code {
          background-color: #ffffff;
          padding: 15px;
          border-radius: 8px;
          display: inline-block;
          margin: 15px 0;
        }
        .rsvp-button {
          background: linear-gradient(135deg, #bc9254, #f9d8a4);
          color: #01315c;
          padding: 18px 36px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 16px;
          display: inline-block;
          margin: 25px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(188, 146, 84, 0.3);
          transition: all 0.3s ease;
        }
        .rsvp-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(188, 146, 84, 0.4);
        }
        .footer {
          background-color: #0f1419;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #2a2f3e;
        }
        .footer p {
          margin: 8px 0;
          font-size: 12px;
          color: #8a8e91;
        }
        .whiskey-accent {
          color: #f9d8a4;
          font-weight: bold;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #bc9254, transparent);
          margin: 30px 0;
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 0;
            border-radius: 0;
          }
          .header {
            padding: 30px 15px;
          }
          .content {
            padding: 25px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .rsvp-button {
            padding: 15px 25px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <h1>Fercullen Irish Whiskey</h1>
            <p>Exclusive Launch Event</p>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear <span class="whiskey-accent">${invitee.name}</span>,
          </div>
          
          <div class="invitation-text">
            You are cordially invited to the exclusive launch of <strong class="whiskey-accent">Fercullen Irish Whiskey</strong> 
            in Nigeria. Join us for an evening of premium whiskey tasting, networking, and celebration 
            as we introduce this exceptional Irish whiskey to the Nigerian market.
            
            <div class="divider"></div>
            
            This exclusive event brings together whiskey connoisseurs, business leaders, and distinguished 
            guests for an unforgettable evening celebrating the finest Irish craftsmanship.
          </div>
          
          <div class="event-details">
            <h3>🥃 Event Details</h3>
            <p><strong>Date:</strong> ${new Date(process.env.EVENT_DATE || '2025-10-18').toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${process.env.EVENT_TIME || '5:00 PM'}</p>
            <p><strong>Venue:</strong> ${process.env.EVENT_VENUE || 'Monarch Event Center, Lekki, Lagos'}</p>
            <p><strong>Dress Code:</strong> Business Formal</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${rsvpLink}" class="rsvp-button">RSVP Now</a>
          </div>
          
          <div class="qr-section">
            <h3>🎟️ Your Personal QR Code</h3>
            <p style="color: #d0d4d7; margin-bottom: 15px;">
              Present this QR code at the venue for quick check-in
            </p>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="Event QR Code" style="width: 200px; height: 200px;" />
            </div>
            <p style="font-size: 12px; color: #8a8e91; margin-top: 15px;">
              Serial Number: <strong style="color: #f9d8a4;">${invitee.sn}</strong>
            </p>
          </div>
          
          <div class="invitation-text">
            <strong>What to Expect:</strong>
            <ul style="color: #d0d4d7; padding-left: 20px;">
              <li>Premium Fercullen whiskey tasting experience</li>
              <li>Networking with industry leaders and connoisseurs</li>
              <li>Insights into Irish whiskey craftsmanship</li>
              <li>Gourmet canapés and refreshments</li>
              <li>Exclusive first access to Fercullen in Nigeria</li>
            </ul>
          </div>
          
          <div style="background-color: #2a1810; border-left: 4px solid #bc9254; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-style: italic; color: #f9d8a4;">
              "Please RSVP by clicking the button above to confirm your attendance. 
              Space is limited and this exclusive event is by invitation only."
            </p>
          </div>
        </div>
        
        <div class="footer">
          <div class="divider"></div>
          <p>This invitation is non-transferable and valid for one person only.</p>
          <p>For inquiries, please contact the event organizers.</p>
          <p style="color: #f9d8a4; font-weight: bold;">Fercullen Irish Whiskey Launch - Nigeria 2025</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Verify transporter connection with retry logic
async function verifyTransporter(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
      return true;
    } catch (error) {
      console.error(`Transporter verification attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
}

// Send invitation email
export async function sendInvitationEmail(
  invitee: { sn: string; name: string; email: string }, 
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify transporter first
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      throw new Error('Email transporter verification failed');
    }

    // Generate QR code
    const qrCodeDataURL = await generateQRCode(`${baseUrl}/rsvp/${invitee.sn}`);
    
    // Generate HTML content
    const htmlContent = generateInvitationHTML(invitee, qrCodeDataURL, baseUrl);
    
    // Email options
    const mailOptions = {
      from: `"Fercullen Irish Whiskey Launch" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: invitee.email,
      subject: '🥃 Exclusive Invitation: Fercullen Irish Whiskey Launch - Nigeria',
      html: htmlContent,
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrCodeDataURL.split(',')[1],
          encoding: 'base64',
          cid: 'qrcode'
        }
      ]
    };

    // Send email with timeout
    await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 45000)
      )
    ]);

    console.log('Invitation email sent successfully to:', invitee.email);
    
    // Log successful invitation
    await db_operations.logInvitation({
      invitee_sn: invitee.sn,
      email: invitee.email,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    return { success: true };
    
  } catch (error) {
    console.error('Error sending invitation email:', error);
    
    // Log failed invitation
    await db_operations.logInvitation({
      invitee_sn: invitee.sn,
      email: invitee.email,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      sent_at: new Date().toISOString()
    });

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send bulk invitations with rate limiting
export async function sendBulkInvitations(
  invitees: { sn: string; name: string; email: string }[], 
  baseUrl: string,
  onProgress?: (sent: number, total: number, current: string) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  console.log(`Starting bulk email sending for ${invitees.length} invitees...`);

  for (let i = 0; i < invitees.length; i++) {
    const invitee = invitees[i];
    
    if (onProgress) {
      onProgress(i, invitees.length, invitee.email);
    }

    try {
      const result = await sendInvitationEmail(invitee, baseUrl);
      
      if (result.success) {
        results.success++;
        console.log(`✓ Sent to ${invitee.email} (${i + 1}/${invitees.length})`);
      } else {
        results.failed++;
        results.errors.push(`${invitee.email}: ${result.error}`);
        console.log(`✗ Failed to send to ${invitee.email}: ${result.error}`);
      }
    } catch (error) {
      results.failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${invitee.email}: ${errorMsg}`);
      console.log(`✗ Failed to send to ${invitee.email}: ${errorMsg}`);
    }

    // Rate limiting: wait between emails
    if (i < invitees.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }

  console.log(`Bulk email sending completed. Success: ${results.success}, Failed: ${results.failed}`);
  return results;
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; error?: string }> {
  try {
    const verified = await verifyTransporter();
    if (verified) {
      return { success: true };
    } else {
      return { success: false, error: 'Transporter verification failed' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
