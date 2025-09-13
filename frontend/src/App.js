import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/home/HomePage';
import Dashboard from './components/dashboard/Dashboard';
import UAVDetails from './components/uav/UAVDetails';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';
import './components/uav/UAVDetails.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={
              <WebSocketProvider>
                <AppProvider>
                  <Dashboard />
                </AppProvider>
              </WebSocketProvider>
            } />
            <Route path="/uav/:uavId" element={
              <WebSocketProvider>
                <AppProvider>
                  <UAVDetails />
                </AppProvider>
              </WebSocketProvider>
            } />
          </Routes>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;