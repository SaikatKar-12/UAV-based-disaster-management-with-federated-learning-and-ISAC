import React, { useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useWebSocket } from '../../context/WebSocketContext';
import Header from '../common/Header';
import Navigation from '../common/Navigation';
import MapComponent from './MapComponent';
import SurvivorList from './SurvivorList';
import ISACStatus from './ISACStatus';
import MultiUAVStatus from './MultiUAVStatus';
import MissionStats from './MissionStats';
import ConnectionStatus from '../common/ConnectionStatus';
import NotificationContainer from '../common/NotificationContainer';

const Dashboard = () => {
  const { survivors = [], actions } = useApp();
  const { 
    isConnected, 
    uavs = [], 
    selectedUAV,
    subscribe
  } = useWebSocket();

  // Defensive checks for required data
  const safeSurvivors = Array.isArray(survivors) ? survivors : [];

  // Format UAVs for the map component
  const uavsForMap = useMemo(() => {
    return Object.values(uavs).map(uav => ({
      ...uav,
      location: uav.position ? {
        lat: uav.position[0] || 0,
        lng: uav.position[1] || 0,
        alt: uav.position[2] || 0
      } : { lat: 0, lng: 0, alt: 0 }
    }));
  }, [uavs]);

  // Get the selected UAV status
  const selectedUAVStatus = useMemo(() => {
    return selectedUAV ? uavs[selectedUAV] : null;
  }, [selectedUAV, uavs]);

  // Calculate mission stats from UAV data
  const missionStats = useMemo(() => {
    const connectedUAVs = Object.values(uavs).filter(uav => uav.connected);
    return {
      activeUAVs: connectedUAVs.length,
      totalUAVs: Object.keys(uavs).length,
      avgBattery: connectedUAVs.reduce((sum, uav) => sum + (uav.battery || 0), 0) / (connectedUAVs.length || 1),
      lastUpdate: new Date().toISOString()
    };
  }, [uavs]);

  // Load initial survivors data
  useEffect(() => {
    actions.loadSurvivors();
  }, [actions]);

  // Subscribe to UAV status updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe('uav_status', (data) => {
      console.log('UAV status update:', data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isConnected, subscribe]);

  return (
    <div className="app">
      <Navigation />
      <Header />
      
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <MapComponent 
            survivors={safeSurvivors}
            uavStatus={selectedUAVStatus}
            uavs={uavsForMap}
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
            isacStatus={selectedUAVStatus?.isacMode || 'disconnected'}
            uavStatus={selectedUAVStatus}
          />

          {/* Multi-UAV Status */}
          <MultiUAVStatus 
            uavs={uavsForMap}
            loading={!isConnected}
          />

          {/* Mission Statistics */}
          <MissionStats 
            stats={missionStats}
            survivorsCount={safeSurvivors.length}
          />

          {/* Survivor List */}
          <SurvivorList 
            survivors={safeSurvivors}
            loading={false}
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