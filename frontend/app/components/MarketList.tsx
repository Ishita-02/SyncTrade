'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Search, Plus } from 'lucide-react';

interface Leader {
  id: number;
  leaderId: number;
  address: string;
  feeBps: number;
  totalFollowers: number;
  totalDeposits: string;
}

export default function MarketList() {
  const [activeTab, setActiveTab] = useState('ETH-USD');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaders();
  }, [activeTab]);

  const fetchLeaders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaders?market=${activeTab}`);
      const data = await response.json();
      setLeaders(data.leaders || []);
    } catch (error) {
      console.error('Error fetching leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Total AUM', 
      value: leaders.reduce((sum, l) => sum + parseFloat(l.totalDeposits || '0'), 0).toFixed(2),
      icon: DollarSign 
    },
    { 
      label: 'Active Leaders', 
      value: leaders.length.toString(),
      icon: TrendingUp 
    },
    { 
      label: 'Total Followers', 
      value: leaders.reduce((sum, l) => sum + l.totalFollowers, 0).toString(),
      icon: Users 
    },
  ];

  const markets = ['ETH-USD', 'BTC-USD', 'SOL-USD'];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{backgroundColor: '#0f1419', minHeight: '100vh', color: '#e6edf3'}}>
      {/* Header */}
      <header style={{backgroundColor: '#161b22', borderBottom: '1px solid #30363d'}}>
        <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '48px'}}>
              <h1 style={{fontSize: '20px', fontWeight: '700', color: '#e6edf3', margin: 0}}>SyncTrade</h1>
              <nav style={{display: 'flex', gap: '32px'}}>
                <a href="#" style={{color: '#58a6ff', textDecoration: 'none', fontWeight: '500'}}>Markets</a>
                <a href="#" style={{color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s'}}>Portfolio</a>
                <a href="#" style={{color: '#8b949e', textDecoration: 'none', transition: 'color 0.2s'}}>Docs</a>
              </nav>
            </div>
            <button style={{
              backgroundColor: '#238636',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Connect Wallet
            </button>
          </div>
        </div>
      </header>

      <div style={{maxWidth: '1400px', margin: '0 auto', padding: '32px 24px'}}>
        {/* Stats Grid */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px'}}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#21262d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon style={{width: '20px', height: '20px', color: '#58a6ff'}} />
                </div>
                <div>
                  <div style={{color: '#8b949e', fontSize: '13px', marginBottom: '4px'}}>{stat.label}</div>
                  <div style={{color: '#e6edf3', fontSize: '24px', fontWeight: '700'}}>
                    {stat.label.includes('AUM') ? `$${stat.value}` : stat.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Page Header */}
        <div style={{marginBottom: '24px'}}>
          <h2 style={{color: '#e6edf3', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Trading Strategies</h2>
          <p style={{color: '#8b949e', fontSize: '15px', margin: 0}}>Copy strategies from top traders on GMX perpetuals</p>
        </div>

        {/* Market Tabs & Actions */}
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'}}>
          {markets.map((market) => (
            <button
              key={market}
              onClick={() => setActiveTab(market)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: activeTab === market ? 'none' : '1px solid #30363d',
                backgroundColor: activeTab === market ? '#1f6feb' : '#161b22',
                color: activeTab === market ? '#ffffff' : '#8b949e',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {market}
            </button>
          ))}
          <div style={{flex: 1}} />
          <button style={{
            backgroundColor: '#238636',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Plus style={{width: '18px', height: '18px'}} />
            Create Strategy
          </button>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid #30363d'}}>
                <th style={{textAlign: 'left', padding: '16px 24px', color: '#8b949e', fontWeight: '600', fontSize: '13px'}}>Leader</th>
                <th style={{textAlign: 'left', padding: '16px 24px', color: '#8b949e', fontWeight: '600', fontSize: '13px'}}>Followers</th>
                <th style={{textAlign: 'left', padding: '16px 24px', color: '#8b949e', fontWeight: '600', fontSize: '13px'}}>Total Deposits</th>
                <th style={{textAlign: 'left', padding: '16px 24px', color: '#8b949e', fontWeight: '600', fontSize: '13px'}}>Fee</th>
                <th style={{textAlign: 'right', padding: '16px 24px', color: '#8b949e', fontWeight: '600', fontSize: '13px'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{padding: '40px 24px', textAlign: 'center', color: '#8b949e'}}>
                    Loading...
                  </td>
                </tr>
              ) : leaders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{padding: '80px 24px', textAlign: 'center'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'}}>
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#21262d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TrendingUp style={{width: '32px', height: '32px', color: '#58a6ff'}} />
                      </div>
                      <div>
                        <div style={{color: '#e6edf3', fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>
                          No strategies yet
                        </div>
                        <div style={{color: '#8b949e', fontSize: '14px'}}>
                          Be the first to create a strategy for {activeTab}
                        </div>
                      </div>
                      <button style={{
                        marginTop: '16px',
                        backgroundColor: '#238636',
                        color: '#ffffff',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Plus style={{width: '18px', height: '18px'}} />
                        Create Strategy
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leaders.map((leader) => (
                  <tr key={leader.id} style={{borderBottom: '1px solid #30363d'}}>
                    <td style={{padding: '16px 24px', color: '#e6edf3', fontFamily: 'monospace'}}>
                      {formatAddress(leader.address)}
                    </td>
                    <td style={{padding: '16px 24px', color: '#e6edf3'}}>
                      {leader.totalFollowers}
                    </td>
                    <td style={{padding: '16px 24px', color: '#e6edf3'}}>
                      ${parseFloat(leader.totalDeposits).toFixed(2)}
                    </td>
                    <td style={{padding: '16px 24px', color: '#e6edf3'}}>
                      {(leader.feeBps / 100).toFixed(2)}%
                    </td>
                    <td style={{padding: '16px 24px', textAlign: 'right'}}>
                      <button style={{
                        backgroundColor: '#1f6feb',
                        color: '#ffffff',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}>
                        Follow
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Section */}
        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px'
        }}>
          <h3 style={{color: '#e6edf3', fontSize: '16px', fontWeight: '600', marginBottom: '12px'}}>
            How Copy Trading Works
          </h3>
          <p style={{color: '#8b949e', fontSize: '14px', lineHeight: '1.6', margin: 0}}>
            Follow experienced traders and automatically copy their positions on GMX perpetuals. 
            Leaders set their own performance fees, and you maintain full control of your funds at all times.
          </p>
        </div>
      </div>
    </div>
  );
}