import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useWebSocket } from '../../context/WebSocketContext';
import Header from '../common/Header';
import Navigation from '../common/Navigation';
import MapComponent from './MapComponent';
import SurvivorList from './SurvivorList';
import ISACStatus from './ISACStatus';
import UAVStatus from './UAVStatus';
import MultiUAVStatus from './MultiUAVStatus';
import MissionStats from './MissionStats';
import ConnectionStatus from '../common/ConnectionStatus';
import NotificationContainer from '../common/NotificationContainer';

const Dashboard = () => {
  const { survivors = [], uavStatus = {}, uavs = [], isacStatus = {}, missionStats = {}, loading = {}, actions } = useApp();
  const { isConnected } = useWebSocket();

  // Defensive checks for required data
  const safeSurvivors = Array.isArray(survivors) ? survivors : [];
  const safeUAVStatus = uavStatus || {};
  const safeISACStatus = isacStatus || {};
  const safeMissionStats = missionStats || {};

  useEffect(() => {
    // Load initial data once
    actions.loadSurvivors();
    actions.loadUAVStatus();
  }, []);

  // Simple polling only when WebSocket is disconnected
  useEffect(() => {
    if (isConnected) {
      // WebSocket is handling updates, no need to poll
      return;
    }

    // Only poll when disconnected, with a simple 10-second interval
    // Use showLoading=false to prevent loading states during polling
    const pollInterval = setInterval(() => {
      console.log('📡 Polling for updates (WebSocket disconnected)');
      actions.loadUAVStatus(false); // Don't show loading spinner for polling
    }, 10000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isConnected, actions]);

  return (
    <div className="app">
      <Navigation />
      <Header />
      
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <MapComponent 
            survivors={safeSurvivors}
            uavStatus={safeUAVStatus}
            uavs={uavs}
            onSurvivorClick={(survivor) => {
              console.log('Survivor clicked:', survivor);
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Connection Status */}
          <ConnectionStatus isConnected={isConnected} />

          {/* ISAC Status */}
          <ISACStatus 
            isacStatus={safeISACStatus}
            uavStatus={safeUAVStatus}
          />

          {/* Multi-UAV Status */}
          <MultiUAVStatus 
            uavs={uavs}
            loading={loading.uavStatus || false}
          />

          {/* Single UAV Status (Backward Compatibility) */}
          {(!uavs || uavs.length === 0) && (
            <UAVStatus 
              uavStatus={safeUAVStatus}
              loading={loading.uavStatus || false}
            />
          )}

          {/* Mission Statistics */}
          <MissionStats 
            stats={safeMissionStats}
            survivorsCount={safeSurvivors.length}
          />

          {/* Survivor List */}
          <SurvivorList 
            survivors={safeSurvivors}
            loading={loading.survivors || false}
            onMarkAsRescued={actions?.markSurvivorAsRescued}
          />
        </div>
      </div>

      {/* Notifications */}
      <NotificationContainer />
    </div>
  );
};

export default Dashboard;