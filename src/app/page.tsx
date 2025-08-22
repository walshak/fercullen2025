'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const calculateTimeLeft = (): TimeLeft => {
      // Event date: October 18, 2025 at 5:00 PM WAT (UTC+1)
      const eventDate = new Date('2025-10-18T17:00:00+01:00');
      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        maxWidth: '560px',
        width: '100%'
      }}>
        <div style={{
          marginBottom: '32px',
          padding: '16px',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: '12px'
        }}>
          <Image
            src="/logo.png"
            alt="Fercullen Irish Whiskey"
            width={240}
            height={120}
            style={{ 
              marginBottom: '16px',
              filter: 'brightness(1.1) contrast(1.1)'
            }}
          />
        </div>
        
        <h1 style={{
          fontSize: '36px',
          margin: '24px 0 16px 0',
          color: 'var(--accent-primary)',
          fontWeight: '700',
          letterSpacing: '-0.02em'
        }}>
          Fercullen Irish Whiskey
        </h1>
        
        <h2 style={{
          fontSize: '24px',
          margin: '0 0 32px 0',
          color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>
          Nigeria Launch Event
        </h2>

        {/* Countdown Timer */}
        {mounted && (
          <div style={{
            backgroundColor: 'var(--surface-accent)',
            borderRadius: '16px',
            padding: '32px 24px',
            margin: '32px 0',
            border: '2px solid var(--accent-primary)'
          }}>
            <h3 style={{
              fontSize: '20px',
              margin: '0 0 24px 0',
              color: 'var(--accent-primary)',
              fontWeight: '600'
            }}>
              Event Countdown
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '16px 8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  marginBottom: '4px'
                }}>
                  {timeLeft.days}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Days
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '16px 8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  marginBottom: '4px'
                }}>
                  {timeLeft.hours}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Hours
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '16px 8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  marginBottom: '4px'
                }}>
                  {timeLeft.minutes}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Minutes
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '12px',
                padding: '16px 8px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  marginBottom: '4px'
                }}>
                  {timeLeft.seconds}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Seconds
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div style={{
          fontSize: '18px',
          margin: '24px 0',
          lineHeight: '1.8',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--surface-secondary)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>Date:</span>
            <span>October 18, 2025</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>Time:</span>
            <span>5:00 PM WAT</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>Venue:</span>
            <span>Monarch Event Center</span>
          </div>
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)'
          }}>
            138 Lekki - Epe Expressway, Lekki Peninsula II, Lagos
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '32px',
          padding: '16px',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: 'var(--accent-primary)' }}>
              Join us for an exclusive evening
            </p>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Celebrating the launch of Ireland&apos;s finest whiskey in Nigeria
            </p>
          </div>
        </div>

        {/* Admin Access */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)'
        }}>
          <a 
            href="/admin/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-secondary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Admin Access
          </a>
        </div>
      </div>
    </div>
  );
}
