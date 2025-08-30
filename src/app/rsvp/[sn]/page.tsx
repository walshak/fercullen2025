'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface Invitee {
  id: number;
  sn: string;
  name: string;
  title?: string;
  company?: string;
  email: string;
  phone?: string;
  notes?: string;
  rsvp_status: string;
  rsvp_preferences?: string;
  rsvp_notes?: string;
  rsvp_submitted_at?: string;
}

export default function RSVPPage() {
  const params = useParams();
  const router = useRouter();
  const sn = params.sn as string;
  
  const [invitee, setInvitee] = useState<Invitee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [rsvpData, setRsvpData] = useState({
    status: '',
    preferences: '',
    notes: ''
  });

  // Check if user is admin on component mount
  const handleAdminCheckIn = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/invitees/${sn}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvitee(data.data);
        setSuccess(true);
        setError('');
        
        // Show success message for 3 seconds then redirect to admin dashboard
        setTimeout(() => {
          router.push('/admin/dashboard?tab=checkin');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check in guest');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Failed to check in guest');
    } finally {
      setIsSubmitting(false);
    }
  }, [sn, router]);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAdmin(true);
          // If admin, immediately check in the guest
          await handleAdminCheckIn();
        }
      } catch {
        console.log('Not an admin user');
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminAuth();
  }, [handleAdminCheckIn]);

  const loadInvitee = useCallback(async () => {
    try {
      const response = await fetch(`/api/rsvp/${sn}`);
      if (response.ok) {
        const data = await response.json();
        setInvitee(data.data);
        
        // Set existing RSVP data if available
        if (data.data.rsvp_status !== 'pending') {
          setRsvpData({
            status: data.data.rsvp_status,
            preferences: data.data.rsvp_preferences || '',
            notes: data.data.rsvp_notes || ''
          });
        }
      } else {
        setError('Invitation not found');
      }
    } catch {
      setError('Error loading invitation');
    } finally {
      setIsLoading(false);
    }
  }, [sn]);

  useEffect(() => {
    if (sn && !checkingAuth && !isAdmin) {
      loadInvitee();
    }
  }, [sn, loadInvitee, checkingAuth, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpData.status) {
      setError('Please select your response');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/rsvp/${sn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData)
      });

      if (response.ok) {
        setSuccess(true);
        loadInvitee(); // Reload to show updated status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit RSVP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRsvpData(prev => ({ ...prev, [name]: value }));
  };

  // Show loading while checking authentication or processing check-in
  if (checkingAuth || (isAdmin && isSubmitting)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '24px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--accent-primary)',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span>{isAdmin ? 'Checking in guest...' : 'Loading your invitation...'}</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show admin check-in success message
  if (isAdmin && success && invitee) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: '600px',
          padding: '40px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--accent-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px'
          }}>
            ✓
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '16px',
            color: 'var(--accent-primary)'
          }}>
            Guest Checked In Successfully!
          </h1>
          
          <div style={{
            padding: '24px',
            backgroundColor: 'var(--background)',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              {invitee.name}
            </h2>
            {invitee.title && (
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {invitee.title}
              </p>
            )}
            {invitee.company && (
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {invitee.company}
              </p>
            )}
            <p style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--accent-primary)',
              marginTop: '12px'
            }}>
              Serial Number: {invitee.sn}
            </p>
          </div>
          
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            Redirecting to admin dashboard in a few seconds...
          </p>
          
          <button
            onClick={() => router.push('/admin/dashboard?tab=checkin')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  // Show admin error message
  if (isAdmin && error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '40px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dc3545',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px',
            color: 'white'
          }}>
            ✕
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#dc3545'
          }}>
            Check-in Failed
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            marginBottom: '24px'
          }}>
            {error}
          </p>
          
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '24px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--accent-primary)',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span>Loading your invitation...</span>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !invitee) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          border: '1px solid var(--error)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'var(--error)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            fontSize: '24px'
          }}>
            ❌
          </div>
          <h1 style={{ 
            color: 'var(--error)', 
            marginBottom: '20px',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Invitation Not Found
          </h1>
          <p style={{ 
            color: 'var(--text-secondary)', 
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            The invitation link you&apos;re using is invalid or has expired.
          </p>
          <p style={{ 
            color: 'var(--text-muted)',
            fontSize: '14px'
          }}>
            Please check the link in your invitation email or contact the event organizer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-primary)',
          padding: '30px',
          textAlign: 'center'
        }}>
          <Image
            src="/logo.png"
            alt="Fercullen Irish Whiskey"
            width={150}
            height={75}
            style={{ marginBottom: '20px' }}
          />
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
            🥃 Fercullen Irish Whiskey
          </h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '16px', color: 'var(--text-secondary)' }}>
            Nigeria Launch Event
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', backgroundColor: 'var(--surface)' }}>
          {invitee && (
            <>
              <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--accent-secondary)', marginBottom: '10px' }}>
                  Welcome, {invitee.name}!
                </h2>
                {invitee.title && invitee.company && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                    {invitee.title}, {invitee.company}
                  </p>
                )}
              </div>

              {/* Event Details */}
              <div style={{
                backgroundColor: 'var(--surface-secondary)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '30px',
                borderLeft: '4px solid var(--accent-primary)',
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: 'var(--accent-secondary)', fontWeight: '600' }}>Event Details</h3>
                <div style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  <p><strong>Date:</strong> October 18, 2025</p>
                  <p><strong>Time:</strong> 5:00 PM WAT</p>
                  <p><strong>Venue:</strong> Monarch Event Center</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    138 Lekki - Epe Expressway, Lekki Peninsula II, Lekki 106104, Lagos, Nigeria
                  </p>
                </div>
              </div>

              {/* Previous Response */}
              {invitee.rsvp_submitted_at && (
                <div style={{
                  marginBottom: '30px',
                  padding: '16px',
                  backgroundColor: 'var(--surface-secondary)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  border: '1px solid var(--border)'
                }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Previous Response:</strong> {invitee.rsvp_status.toUpperCase()}<br />
                  Submitted on {new Date(invitee.rsvp_submitted_at).toLocaleDateString()}
                  {invitee.rsvp_status === 'accepted' && (
                    <>
                      <br /><em style={{ color: 'var(--text-muted)' }}>You can update your response above if needed.</em>
                    </>
                  )}
                </div>
              )}

              {success ? (
                <div style={{
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  border: '1px solid var(--success)'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontWeight: '600' }}>✓ RSVP Submitted Successfully!</h3>
                  <p style={{ margin: 0 }}>
                    Thank you for your response. We look forward to seeing you at the event!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '20px', fontWeight: '600' }}>RSVP Response</h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}>
                      Will you be attending? *
                    </label>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="status"
                          value="accepted"
                          checked={rsvpData.status === 'accepted'}
                          onChange={handleInputChange}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ color: 'var(--success)', fontWeight: '500' }}>Yes, I&apos;ll be there!</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="status"
                          value="declined"
                          checked={rsvpData.status === 'declined'}
                          onChange={handleInputChange}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ color: 'var(--error)', fontWeight: '500' }}>Sorry, can&apos;t make it</span>
                      </label>
                    </div>
                  </div>

                  {rsvpData.status === 'accepted' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                      }}>
                        Dietary Preferences/Restrictions
                      </label>
                      <input
                        type="text"
                        name="preferences"
                        value={rsvpData.preferences}
                        onChange={handleInputChange}
                        placeholder="e.g., Vegetarian, Gluten-free, None"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--input-bg)',
                          color: 'var(--text-primary)',
                          transition: 'border-color 0.2s ease'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: 'var(--text-primary)'
                    }}>
                      Additional Notes
                    </label>
                    <textarea
                      name="notes"
                      value={rsvpData.notes}
                      onChange={handleInputChange}
                      placeholder="Any special requests or messages..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        transition: 'border-color 0.2s ease'
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      backgroundColor: 'var(--error-bg)',
                      color: 'var(--error)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      fontSize: '14px',
                      border: '1px solid var(--error)'
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !rsvpData.status}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isSubmitting || !rsvpData.status
                        ? 'var(--button-disabled)'
                        : 'var(--accent-primary)',
                      color: isSubmitting || !rsvpData.status
                        ? 'var(--text-disabled)'
                        : 'var(--button-text)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: isSubmitting || !rsvpData.status ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-primary)',
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>
            For any questions, contact us at <span style={{ color: 'var(--accent-primary)' }}>fercullennigeria@gmail.com</span>
          </p>
        </div>
      </div>
      <style jsx global>{`
        :root {
          --background: #0B1426;
          --surface: #1A2332;
          --surface-secondary: #243040;
          --border: #3C4A5E;
          --text-primary: #F8FAFC;
          --text-secondary: #CBD5E1;
          --text-muted: #64748B;
          --text-disabled: #475569;
          --accent-primary: #D4A574;
          --accent-secondary: #F9D8A4;
          --success: #22C55E;
          --success-bg: #052E16;
          --error: #EF4444;
          --error-bg: #450A0A;
          --warning: #F59E0B;
          --info: #3B82F6;
          --input-bg: #243040;
          --button-disabled: #475569;
          --button-text: #0B1426;
        }
      `}</style>
    </div>
  );
}
