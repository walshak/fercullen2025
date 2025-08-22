'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RSVPTestPage() {
  const [testSN, setTestSN] = useState('');

  const generateTestSN = () => {
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const sn = `FQ-${randomNum.toString().padStart(3, '0')}`;
    setTestSN(sn);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#01315c',
      padding: '40px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#1a2332',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '40px',
        border: '1px solid #bc9254'
      }}>
        <h1 style={{ color: '#f9d8a4', textAlign: 'center', marginBottom: '30px' }}>
          🥃 Fercullen Irish Whiskey - RSVP System
        </h1>

        <div style={{
          backgroundColor: '#2a3441',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #bc9254'
        }}>
          <h2 style={{ color: '#f9d8a4', marginBottom: '15px' }}>System Status</h2>
          <p style={{ color: '#90ee90' }}>✅ Public RSVP system is now live!</p>
          <p style={{ color: '#90ee90' }}>✅ Admin dashboard available at <Link href="/admin/login" style={{ color: '#bc9254' }}>/admin/login</Link></p>
          <p style={{ color: '#90ee90' }}>✅ RSVP responses via unique links at /rsvp/[serial-number]</p>
        </div>

        <div style={{
          backgroundColor: '#2a3441',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #bc9254'
        }}>
          <h3 style={{ color: '#f9d8a4', marginBottom: '15px' }}>How it works:</h3>
          <ol style={{ lineHeight: '1.6', color: '#bc9254' }}>
            <li>Admin creates invitees in the dashboard with unique serial numbers</li>
            <li>System generates QR codes and email invitations for each invitee</li>
            <li>Invitees receive emails with QR codes linking to /rsvp/[their-serial-number]</li>
            <li>Invitees fill out RSVP form with attendance status and preferences</li>
            <li>Admin can track all responses and check-in guests at the event</li>
          </ol>
        </div>

        <div style={{
          border: '2px solid #bc9254',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          backgroundColor: '#2a3441'
        }}>
          <h3 style={{ color: '#f9d8a4', marginBottom: '15px' }}>Test RSVP System</h3>
          <p style={{ marginBottom: '15px', color: '#bc9254' }}>
            First, go to the admin dashboard to create some test invitees, then use their serial numbers here:
          </p>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
            <input
              type="text"
              value={testSN}
              onChange={(e) => setTestSN(e.target.value)}
              placeholder="Enter serial number (e.g., FIW123ABC)"
              style={{
                flex: 1,
                padding: '10px',
                border: '2px solid #bc9254',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#1a2332',
                color: '#f9d8a4'
              }}
            />
            <button
              onClick={generateTestSN}
              style={{
                padding: '10px 15px',
                backgroundColor: '#bc9254',
                color: '#01315c',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Generate Test SN
            </button>
          </div>

          {testSN && (
            <div style={{ marginBottom: '15px' }}>
              <Link
                href={`/rsvp/${testSN}`}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#bc9254',
                  color: '#01315c',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold'
                }}
              >
                Test RSVP Page: /rsvp/{testSN}
              </Link>
            </div>
          )}

          <p style={{ fontSize: '14px', color: '#bc9254' }}>
            Note: You&apos;ll need to create an invitee with this serial number in the admin dashboard first.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <Link
            href="/admin/login"
            style={{
              display: 'block',
              padding: '20px',
              backgroundColor: '#bc9254',
              color: '#01315c',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            👨‍💼 Admin Dashboard
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
              Manage invitees & track RSVPs
            </div>
          </Link>

          <div style={{
            padding: '20px',
            backgroundColor: '#2a3441',
            color: '#f9d8a4',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            border: '1px solid #bc9254'
          }}>
            📧 Email Integration
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
              Automatic QR code invitations
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#2a3441',
            color: '#f9d8a4',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            border: '1px solid #bc9254'
          }}>
            📊 Real-time Tracking
            <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
              Live RSVP statistics
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#2a3441',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #bc9254'
        }}>
          <h3 style={{ color: '#f9d8a4', marginBottom: '10px' }}>Next Steps</h3>
          <p style={{ color: '#bc9254', lineHeight: '1.6' }}>
            1. Login to admin dashboard (username: admin, password: fercullen2025)<br />
            2. Add your invitee list with names, emails, and contact info<br />
            3. Send invitation emails with QR codes<br />
            4. Track RSVPs and manage event check-ins
          </p>
        </div>
      </div>
    </div>
  );
}
