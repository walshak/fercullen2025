'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  email_invite_flag: boolean;
  invitation_sent: boolean;
  invitation_sent_at?: string;
  rsvp_status: string;
  rsvp_preferences?: string;
  rsvp_notes?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalInvitees: number;
  totalSent: number;
  totalRSVP: number;
  totalAccepted: number;
  totalDeclined: number;
  totalCheckedIn: number;
}

interface ApiStats {
  total_invitees: number;
  sent_invitations: number;
  accepted_rsvps: number;
  checked_in_guests: number;
  total_logs: number;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Loading states for different POST operations
  const [addingInvitee, setAddingInvitee] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination, search, sort, filter states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('all');
  const [loadingList, setLoadingList] = useState(false);
  
  const [uploadResults, setUploadResults] = useState<{
    message?: string;
    results?: {
      added: number;
      skipped: number;
      errors: string[];
    };
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form state for adding invitees
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    notes: '',
    email_invite_flag: true
  });

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          await loadData();
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      }
    };

    initDashboard();
  }, [router]);

  // Load data when active tab changes to invitees or checkin
  useEffect(() => {
    if (user && (activeTab === 'invitees' || activeTab === 'checkin')) {
      loadInvitees();
    }
  }, [activeTab, user]);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadInvitees = async (
    page = pagination.page,
    search = searchTerm,
    sortByField = sortBy,
    sortOrderValue = sortOrder,
    filterValue = filter,
    resetPage = false
  ) => {
    setLoadingList(true);
    try {
      const actualPage = resetPage ? 1 : page;
      const params = new URLSearchParams({
        page: actualPage.toString(),
        limit: pagination.limit.toString(),
        search,
        sortBy: sortByField,
        sortOrder: sortOrderValue,
        filter: filterValue
      });

      const response = await fetch(`/api/invitees?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvitees(data.data || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
      }
    } catch (error) {
      console.error('Error loading invitees:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const loadStats = async () => {
    try {
      const [inviteesRes, statsRes] = await Promise.all([
        fetch('/api/invitees'),
        fetch('/api/stats')
      ]);
      
      let currentInvitees: Invitee[] = [];
      if (inviteesRes.ok) {
        const inviteesData = await inviteesRes.json();
        currentInvitees = inviteesData.data || [];
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const apiStats: ApiStats = statsData.data;
        
        // Calculate declined from invitees data
        const declinedCount = currentInvitees.filter(inv => inv.rsvp_status === 'declined').length;
        const totalRSVPCount = currentInvitees.filter(inv => inv.rsvp_status && inv.rsvp_status !== 'pending').length;
        
        // Map API response to expected format
        const mappedStats: Stats = {
          totalInvitees: apiStats.total_invitees || 0,
          totalSent: apiStats.sent_invitations || 0,
          totalRSVP: totalRSVPCount,
          totalAccepted: apiStats.accepted_rsvps || 0,
          totalDeclined: declinedCount,
          totalCheckedIn: apiStats.checked_in_guests || 0
        };
        
        setStats(mappedStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadData = async () => {
    try {
      await Promise.all([
        loadInvitees(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddInvitee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingInvitee(true);
    try {
      const response = await fetch('/api/invitees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({
          name: '',
          title: '',
          company: '',
          email: '',
          phone: '',
          notes: '',
          email_invite_flag: true
        });
        setShowAddForm(false);
        await loadData(); // Reload data and stats
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding invitee:', error);
      alert('Network error. Please try again.');
    } finally {
      setAddingInvitee(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/api/invitees/template';
    link.download = 'invitees_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/invitees/bulk-upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setUploadResults(result);
      await loadData(); // Reload data and stats
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadQRCode = async (invitee: Invitee) => {
    try {
      const response = await fetch(`/api/invitees/${invitee.id}/qr`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qr-${invitee.sn}-${invitee.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR code download error:', error);
      alert('Failed to download QR code');
    }
  };

  const sendInvitation = async (invitee: Invitee) => {
    setSendingInvitation(invitee.id);
    try {
      const response = await fetch(`/api/invitees/${invitee.id}/send-invite`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        await loadData(); // Reload to update status and stats
      } else {
        const error = await response.json();
        alert(`Failed to send invitation: ${error.error}`);
      }
    } catch (error) {
      console.error('Send invitation error:', error);
      alert('Failed to send invitation');
    } finally {
      setSendingInvitation(null);
    }
  };

  const checkInInvitee = async (invitee: Invitee) => {
    setCheckingIn(invitee.id);
    try {
      const response = await fetch(`/api/invitees/${invitee.id}/checkin`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert(`${invitee.name} checked in successfully`);
        await loadData(); // Reload to update status and stats
      } else {
        const error = await response.json();
        alert(`Failed to check in: ${error.error}`);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in invitee');
    } finally {
      setCheckingIn(null);
    }
  };

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
          border: '1px solid var(--border)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--accent-primary)',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        color: 'var(--text-primary)',
        padding: '20px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/logo.png"
            alt="Fercullen Irish Whiskey"
            width={80}
            height={40}
            style={{ 
              marginRight: '20px',
              filter: 'brightness(1.1) contrast(1.1)'
            }}
          />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px',
              color: 'var(--text-primary)',
              fontWeight: '700'
            }}>Fercullen RSVP Admin</h1>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'var(--accent-primary)',
              fontWeight: '500'
            }}>
              Nigeria Launch Event Management
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>Welcome, {user?.username}</span>
          <button
            onClick={async () => {
              setRefreshing(true);
              try {
                await loadData();
              } finally {
                setRefreshing(false);
              }
            }}
            disabled={refreshing}
            style={{
              backgroundColor: refreshing ? 'var(--border)' : 'var(--info)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: refreshing ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = 'var(--info-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = 'var(--info)';
              }
            }}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--primary-dark)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{
        backgroundColor: 'var(--surface)',
        padding: '0 30px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', gap: '30px' }}>
          {['overview', 'invitees', 'rsvp', 'checkin'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '15px 0',
                fontSize: '16px',
                fontWeight: activeTab === tab ? '600' : '500',
                color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '3px solid var(--accent-primary)' : '3px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              {tab === 'rsvp' ? 'RSVP' : tab === 'checkin' ? 'Check-in' : tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '30px' }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '30px',
              fontSize: '28px',
              fontWeight: '700'
            }}>Event Overview</h2>
            
            {/* Event Info */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '30px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginTop: 0,
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>Event Details</h3>
              <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <span style={{ 
                      fontWeight: '600', 
                      color: 'var(--accent-primary)',
                      display: 'inline-block',
                      width: '60px'
                    }}>Date:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>October 18, 2025</span>
                  </div>
                  <div>
                    <span style={{ 
                      fontWeight: '600', 
                      color: 'var(--accent-primary)',
                      display: 'inline-block',
                      width: '60px'
                    }}>Time:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>5:00 PM WAT</span>
                  </div>
                  <div>
                    <span style={{ 
                      fontWeight: '600', 
                      color: 'var(--accent-primary)',
                      display: 'inline-block',
                      width: '60px'
                    }}>Venue:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Monarch Event Center</span>
                  </div>
                </div>
                <p style={{ 
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  margin: 0,
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)'
                }}>138 Lekki - Epe Expressway, Lekki Peninsula II, Lekki 106104, Lagos, Nigeria</p>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'Total Invitees', value: stats.totalInvitees, color: 'var(--accent-primary)' },
                  { label: 'Invitations Sent', value: stats.totalSent, color: 'var(--accent-primary)' },
                  { label: 'RSVP Responses', value: stats.totalRSVP, color: 'var(--success)' },
                  { label: 'Accepted', value: stats.totalAccepted, color: 'var(--info)' },
                  { label: 'Declined', value: stats.totalDeclined, color: 'var(--error)' },
                  { label: 'Checked In', value: stats.totalCheckedIn, color: 'var(--accent-light)' }
                ].map((stat, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      padding: '24px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    <div style={{
                      fontSize: '36px',
                      fontWeight: '700',
                      color: stat.color,
                      marginBottom: '8px',
                      letterSpacing: '-0.02em'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitees' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ 
                color: 'var(--text-primary)', 
                margin: 0,
                fontSize: '28px',
                fontWeight: '700'
              }}>Manage Invitees</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={downloadTemplate}
                  style={{
                    backgroundColor: 'var(--accent-secondary)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Download Template
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  style={{
                    backgroundColor: 'var(--info)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--primary-dark)',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Add Invitee
                </button>
              </div>
            </div>

            {/* Search, Filter, and Sort Controls */}
            <div style={{
              backgroundColor: 'var(--surface)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '16px',
                alignItems: 'end'
              }}>
                {/* Search */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      loadInvitees(1, e.target.value, sortBy, sortOrder, filter, true);
                    }}
                    placeholder="Search by name, email, company..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Filter */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Filter
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      loadInvitees(1, searchTerm, sortBy, sortOrder, e.target.value, true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Invitees</option>
                    <option value="sent">Invitations Sent</option>
                    <option value="not_sent">Not Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="pending_rsvp">Pending RSVP</option>
                    <option value="checked_in">Checked In</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      loadInvitees(pagination.page, searchTerm, e.target.value, sortOrder, filter);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="created_at">Date Added</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="company">Company</option>
                    <option value="rsvp_status">RSVP Status</option>
                    <option value="invitation_sent_at">Invitation Date</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'asc' | 'desc');
                      loadInvitees(pagination.page, searchTerm, sortBy, e.target.value as 'asc' | 'desc', filter);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'var(--surface-secondary)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Upload Modal */}
            {showBulkUpload && (
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '32px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <h3 style={{ 
                  color: 'var(--text-primary)', 
                  marginTop: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '24px'
                }}>Bulk Upload Invitees</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Upload a CSV file with invitee information. Make sure your file includes columns: name, email, title, company, phone, notes, email_invite_flag
                  </p>
                  <button
                    onClick={downloadTemplate}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--accent-primary)',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Download Template
                  </button>
                </div>

                <form onSubmit={handleBulkUpload}>
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        backgroundColor: 'var(--info)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.7 : 1
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload CSV'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkUpload(false);
                        setUploadResults(null);
                      }}
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Upload Results */}
                {uploadResults && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'var(--surface-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Upload Results</h4>
                    <p style={{ color: 'var(--success)', margin: '8px 0' }}>✓ Added: {uploadResults.results?.added || 0}</p>
                    <p style={{ color: 'var(--warning)', margin: '8px 0' }}>- Skipped: {uploadResults.results?.skipped || 0}</p>
                    {uploadResults.results?.errors && uploadResults.results.errors.length > 0 && (
                      <div>
                        <p style={{ color: 'var(--error)', margin: '8px 0' }}>✗ Errors:</p>
                        <ul style={{ color: 'var(--error)', margin: '8px 0 0 20px' }}>
                          {uploadResults.results.errors.map((error: string, index: number) => (
                            <li key={index} style={{ fontSize: '14px' }}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Add Invitee Form */}
            {showAddForm && (
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '32px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                <h3 style={{ 
                  color: 'var(--text-primary)', 
                  marginTop: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '24px'
                }}>Add New Invitee</h3>
                <form onSubmit={handleAddInvitee}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={addingInvitee}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: addingInvitee ? 'var(--border)' : 'var(--surface-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          opacity: addingInvitee ? 0.6 : 1,
                          cursor: addingInvitee ? 'not-allowed' : 'text'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '14px'
                      }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      fontSize: '14px'
                    }}>
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: 'var(--text-secondary)'
                    }}>
                      <input
                        type="checkbox"
                        name="email_invite_flag"
                        checked={formData.email_invite_flag}
                        onChange={handleInputChange}
                        style={{ marginRight: '8px' }}
                      />
                      Send email invitation
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      disabled={addingInvitee}
                      style={{
                        backgroundColor: addingInvitee ? 'var(--border)' : 'var(--accent-primary)',
                        color: 'var(--primary-dark)',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: addingInvitee ? 'not-allowed' : 'pointer',
                        opacity: addingInvitee ? 0.7 : 1
                      }}
                    >
                      {addingInvitee ? 'Adding...' : 'Add Invitee'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      style={{
                        backgroundColor: 'var(--surface-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invitees List */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                  Invitees ({invitees.length})
                </h3>
              </div>
              {invitees.length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  fontSize: '16px'
                }}>
                  No invitees found. Add your first invitee to get started.
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--surface-secondary)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>SN</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Name</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Company</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Status</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitees.map((invitee) => (
                        <tr key={invitee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: 'var(--accent-primary)',
                              fontSize: '14px'
                            }}>
                              {invitee.sn}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{invitee.name}</div>
                              {invitee.title && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {invitee.title}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{invitee.email}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{invitee.company || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: 
                                invitee.rsvp_status === 'accepted' ? 'var(--success-light)' :
                                invitee.rsvp_status === 'declined' ? 'var(--error-light)' :
                                'var(--warning-light)',
                              color: 
                                invitee.rsvp_status === 'accepted' ? 'var(--success)' :
                                invitee.rsvp_status === 'declined' ? 'var(--error)' :
                                'var(--warning)'
                            }}>
                              {invitee.rsvp_status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => downloadQRCode(invitee)}
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '500'
                                }}
                                title="Download QR Code"
                              >
                                QR Code
                              </button>
                              <button
                                onClick={() => sendInvitation(invitee)}
                                disabled={sendingInvitation === invitee.id}
                                style={{
                                  backgroundColor: sendingInvitation === invitee.id ? 'var(--border)' : 'var(--info)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: sendingInvitation === invitee.id ? 'not-allowed' : 'pointer',
                                  fontWeight: '500',
                                  marginRight: '8px',
                                  opacity: sendingInvitation === invitee.id ? 0.7 : 1
                                }}
                                title={invitee.invitation_sent ? "Resend Email Invitation" : "Send Email Invitation"}
                              >
                                {sendingInvitation === invitee.id 
                                  ? 'Sending...' 
                                  : (invitee.invitation_sent ? 'Resend Invite' : 'Send Invite')
                                }
                              </button>
                              {!invitee.checked_in && invitee.rsvp_status === 'accepted' && (
                                <button
                                  onClick={() => checkInInvitee(invitee)}
                                  disabled={checkingIn === invitee.id}
                                  style={{
                                    backgroundColor: checkingIn === invitee.id ? 'var(--border)' : 'var(--success)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: checkingIn === invitee.id ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                    opacity: checkingIn === invitee.id ? 0.7 : 1
                                  }}
                                  title="Check In"
                                >
                                  {checkingIn === invitee.id ? 'Checking in...' : 'Check In'}
                                </button>
                              )}
                              {invitee.checked_in && (
                                <span style={{
                                  backgroundColor: 'var(--success-light)',
                                  color: 'var(--success)',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  Checked In
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rsvp' && (
          <div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '30px',
              fontSize: '28px',
              fontWeight: '700'
            }}>RSVP Management</h2>
            
            {/* RSVP Summary */}
            {stats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'Total Responses', value: stats.totalRSVP, color: 'var(--info)' },
                  { label: 'Accepted', value: stats.totalAccepted, color: 'var(--success)' },
                  { label: 'Declined', value: stats.totalDeclined, color: 'var(--error)' },
                  { 
                    label: 'Response Rate', 
                    value: stats.totalInvitees > 0 ? `${Math.round((stats.totalRSVP / stats.totalInvitees) * 100)}%` : '0%', 
                    color: 'var(--accent-primary)' 
                  }
                ].map((stat, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: stat.color,
                      marginBottom: '8px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RSVP Responses Table */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                  RSVP Responses
                </h3>
              </div>
              
              {invitees.filter(inv => inv.rsvp_status !== 'pending').length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  fontSize: '16px'
                }}>
                  No RSVP responses yet.
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--surface-secondary)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>SN</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Name</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Response</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Preferences</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Notes</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Responded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitees
                        .filter(inv => inv.rsvp_status !== 'pending')
                        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                        .map((invitee) => (
                        <tr key={invitee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: 'var(--accent-primary)',
                              fontSize: '14px'
                            }}>
                              {invitee.sn}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{invitee.name}</div>
                              {invitee.company && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {invitee.company}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{invitee.email}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: 
                                invitee.rsvp_status === 'accepted' ? 'var(--success-light)' :
                                'var(--error-light)',
                              color: 
                                invitee.rsvp_status === 'accepted' ? 'var(--success)' :
                                'var(--error)'
                            }}>
                              {invitee.rsvp_status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                            {invitee.rsvp_preferences || '-'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                            {invitee.rsvp_notes || '-'}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                            {invitee.updated_at ? new Date(invitee.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div>
            <h2 style={{ 
              color: 'var(--text-primary)', 
              marginBottom: '30px',
              fontSize: '28px',
              fontWeight: '700'
            }}>Event Check-in</h2>
            
            {/* Check-in Summary */}
            {stats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                {[
                  { label: 'Expected Guests', value: stats.totalAccepted, color: 'var(--info)' },
                  { label: 'Checked In', value: stats.totalCheckedIn, color: 'var(--success)' },
                  { label: 'Still Expected', value: stats.totalAccepted - stats.totalCheckedIn, color: 'var(--warning)' },
                  { 
                    label: 'Check-in Rate', 
                    value: stats.totalAccepted > 0 ? `${Math.round((stats.totalCheckedIn / stats.totalAccepted) * 100)}%` : '0%', 
                    color: 'var(--accent-primary)' 
                  }
                ].map((stat, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: stat.color,
                      marginBottom: '8px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Check-in Table */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-secondary)'
              }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
                  Accepted Guests ({invitees.filter(inv => inv.rsvp_status === 'accepted').length})
                </h3>
              </div>
              
              {invitees.filter(inv => inv.rsvp_status === 'accepted').length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)',
                  fontSize: '16px'
                }}>
                  No accepted RSVPs yet.
                </div>
              ) : (
                <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--surface-secondary)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>SN</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Name</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Company</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Check-in Status</th>
                        <th style={{ 
                          padding: '12px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                          fontWeight: '600'
                        }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitees
                        .filter(inv => inv.rsvp_status === 'accepted')
                        .sort((a, b) => {
                          // Sort by check-in status, then by name
                          if (a.checked_in && !b.checked_in) return 1;
                          if (!a.checked_in && b.checked_in) return -1;
                          return a.name.localeCompare(b.name);
                        })
                        .map((invitee) => (
                        <tr key={invitee.id} style={{ 
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: invitee.checked_in ? 'var(--success-light)' : 'transparent'
                        }}>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: 'var(--accent-primary)',
                              fontSize: '14px'
                            }}>
                              {invitee.sn}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{invitee.name}</div>
                              {invitee.title && (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {invitee.title}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{invitee.email}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{invitee.company || '-'}</td>
                          <td style={{ padding: '12px' }}>
                            {invitee.checked_in ? (
                              <div>
                                <span style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  backgroundColor: 'var(--success)',
                                  color: 'white'
                                }}>
                                  ✓ Checked In
                                </span>
                                {invitee.checked_in_at && (
                                  <div style={{ 
                                    fontSize: '11px', 
                                    color: 'var(--text-muted)',
                                    marginTop: '4px'
                                  }}>
                                    {new Date(invitee.checked_in_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: 'var(--warning-light)',
                                color: 'var(--warning)'
                              }}>
                                Not Checked In
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {!invitee.checked_in ? (
                              <button
                                onClick={() => checkInInvitee(invitee)}
                                disabled={checkingIn === invitee.id}
                                style={{
                                  backgroundColor: checkingIn === invitee.id ? 'var(--border)' : 'var(--success)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  cursor: checkingIn === invitee.id ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: checkingIn === invitee.id ? 0.7 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (checkingIn !== invitee.id) {
                                    e.currentTarget.style.backgroundColor = 'var(--success-dark)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (checkingIn !== invitee.id) {
                                    e.currentTarget.style.backgroundColor = 'var(--success)';
                                  }
                                }}
                              >
                                {checkingIn === invitee.id ? 'Checking in...' : 'Check In'}
                              </button>
                            ) : (
                              <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '500' }}>
                                ✓ Complete
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
