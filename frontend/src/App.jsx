import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CashierView from './components/cashier/CashierView';
import BaristaView from './components/barista/BaristaView';
import { fetchQueue } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('cashier'); // 'cashier' | 'barista'
  const [queueCount, setQueueCount] = useState(0);

  // Keep queue badge updated in navbar
  const refreshQueueCount = async () => {
    try {
      const data = await fetchQueue();
      const list = Array.isArray(data) ? data : data.value || [];
      setQueueCount(list.length);
    } catch (err) {
      // Silently catch background badge error
    }
  };

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(refreshQueueCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={queueCount}
      />

      {/* Main Views */}
      {activeTab === 'cashier' ? (
        <CashierView
          onOrderPlaced={refreshQueueCount}
          onSwitchToBarista={() => setActiveTab('barista')}
        />
      ) : (
        <BaristaView />
      )}
    </div>
  );
}
