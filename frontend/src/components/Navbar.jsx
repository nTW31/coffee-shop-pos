import React, { useState, useEffect } from 'react';
import { Coffee, Monitor, Layers, Clock } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, queueCount = 0 }) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <Coffee size={24} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">Coffee Shop POS</h1>
          <span className="brand-subtitle">System Analysis & Design</span>
        </div>
      </div>

      <div className="navbar-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'cashier' ? 'active' : ''}`}
          onClick={() => setActiveTab('cashier')}
        >
          <Layers size={18} />
          <span>หน้าจอแคชเชียร์ (POS)</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'barista' ? 'active' : ''}`}
          onClick={() => setActiveTab('barista')}
        >
          <Monitor size={18} />
          <span>หน้าจอบาริสต้า (Queue)</span>
          {queueCount > 0 && (
            <span className="queue-badge animate-pulse">{queueCount}</span>
          )}
        </button>
      </div>

      <div className="navbar-info">
        <div className="time-display">
          <Clock size={16} className="time-icon" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
