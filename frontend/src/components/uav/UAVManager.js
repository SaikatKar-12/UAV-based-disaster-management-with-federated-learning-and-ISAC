import React, { useState, useCallback } from 'react';
import { Card, Button, List, Progress, Tag, Space, Modal, Input, Select, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  HomeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  RadarChartOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { useWebSocket } from '../../context/WebSocketContext';

const { Option } = Select;

const UAVManager = ({ style }) => {
  const { uavs, selectedUAV, setSelectedUAV, sendCommand, isConnected } = useWebSocket();
  const [isAddUAVModalVisible, setAddUAVModalVisible] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const [newUAV, setNewUAV] = useState({
    id: `uav-${Math.floor(Math.random() * 1000)}`,
    type: 'quadcopter',
    position: [0, 0, 0],
    serverUrl: 'ws://localhost:3000'
  });

  const handleUAVClick = (uavId) => {
    setSelectedUAV(uavId);
  };

  const handleCommand = (command, params = {}) => {
    if (selectedUAV) {
      sendCommand(selectedUAV, command, params);
    }
  };

  const handleAddUAV = () => {
    setAddUAVModalVisible(true);
  };

  const handleConnectUAV = () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    // In a real app, this would connect to the UAV simulation server
    // For now, we'll simulate a connection after a short delay
    setTimeout(() => {
      try {
        // Simulate successful connection
        setUAVs(prev => ({
          ...prev,
          [newUAV.id]: {
            id: newUAV.id,
            type: newUAV.type,
            status: 'connected',
            position: newUAV.position,
            battery: 100,
            connected: true,
            lastUpdate: new Date().toISOString()
          }
        }));
        
        setSelectedUAV(newUAV.id);
        setAddUAVModalVisible(false);
      } catch (error) {
        setConnectionError(error.message);
      } finally {
        setIsConnecting(false);
      }
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'disconnected':
        return 'red';
      case 'moving':
        return 'blue';
      case 'landing':
        return 'orange';
      case 'emergency':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <WifiOutlined style={{ color: '#10b981' }} />;
      case 'disconnected':
        return <DisconnectOutlined style={{ color: '#ef4444' }} />;
      case 'moving':
        return <RadarChartOutlined spin style={{ color: '#3b82f6' }} />;
      default:
        return <RadarChartOutlined style={{ color: '#6b7280' }} />;
    }
  };

  return (
    <div style={style}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>UAV Manager</span>
            <Tooltip title="Add New UAV">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddUAV}
                size="small"
              />
            </Tooltip>
          </div>
        }
        bodyStyle={{ padding: '8px' }}
        headStyle={{ padding: '0 12px' }}
      >
        <List
          itemLayout="horizontal"
          dataSource={Object.entries(uavs)}
          loading={isConnecting}
          locale={{ emptyText: 'No UAVs connected' }}
          renderItem={([id, uav]) => (
            <List.Item
              onClick={() => handleUAVClick(id)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedUAV === id ? '#f0f7ff' : 'inherit',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '4px',
                border: '1px solid #f0f0f0'
              }}
            >
              <List.Item.Meta
                avatar={getStatusIcon(uav.status)}
                title={
                  <Space>
                    <span style={{ fontWeight: 500 }}>UAV {id}</span>
                    <Tag color={getStatusColor(uav.status)} style={{ margin: 0 }}>
                      {uav.status || 'unknown'}
                    </Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ width: '60px', fontSize: '12px', color: '#6b7280' }}>Battery:</span>
                      <Progress 
                        percent={uav.battery || 0} 
                        size="small" 
                        status={
                          uav.battery > 30 ? 'success' : 
                          uav.battery > 15 ? 'active' : 'exception'
                        }
                        showInfo={false}
                        style={{ flex: 1, margin: '0 8px' }}
                      />
                      <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'right' }}>
                        {uav.battery?.toFixed(1) || '0'}%
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      <div>Position: {uav.position?.[0]?.toFixed(2) || '0'}, {uav.position?.[1]?.toFixed(2) || '0'}</div>
                      <div>Altitude: {uav.position?.[2]?.toFixed(1) || '0'}m</div>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        {selectedUAV && uavs[selectedUAV] && (
          <div style={{ marginTop: '12px', padding: '8px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 500 }}>Controls</span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>ID: {selectedUAV}</span>
            </div>
            <Space wrap>
              <Tooltip title="Takeoff">
                <Button 
                  icon={<ArrowUpOutlined />} 
                  onClick={() => handleCommand('takeoff', { altitude: 50 })}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Land">
                <Button 
                  icon={<HomeOutlined />} 
                  onClick={() => handleCommand('land')}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Move Forward">
                <Button 
                  icon={<ArrowUpOutlined />} 
                  onClick={() => handleCommand('move_to', { 
                    x: uavs[selectedUAV].position[0] + 10, 
                    y: uavs[selectedUAV].position[1] 
                  })}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Emergency Stop">
                <Button 
                  danger 
                  icon={<CloseCircleOutlined />} 
                  onClick={() => handleCommand('emergency_stop')}
                  size="small"
                />
              </Tooltip>
            </Space>
          </div>
        )}
      </Card>

      <Modal
        title="Add New UAV"
        open={isAddUAVModalVisible}
        onOk={handleConnectUAV}
        onCancel={() => setAddUAVModalVisible(false)}
        confirmLoading={isConnecting}
        okText={isConnecting ? 'Connecting...' : 'Connect'}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>UAV ID:</div>
          <Input 
            value={newUAV.id} 
            onChange={(e) => setNewUAV({...newUAV, id: e.target.value})}
            placeholder="Enter UAV ID"
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>UAV Type:</div>
          <Select 
            style={{ width: '100%' }} 
            value={newUAV.type}
            onChange={(value) => setNewUAV({...newUAV, type: value})}
          >
            <Option value="quadcopter">Quadcopter</Option>
            <Option value="fixedwing">Fixed Wing</Option>
            <Option value="vtol">VTOL</Option>
          </Select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>Server URL:</div>
          <Input 
            value={newUAV.serverUrl}
            onChange={(e) => setNewUAV({...newUAV, serverUrl: e.target.value})}
            placeholder="ws://server-address:port"
          />
        </div>
        
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>Initial Position:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>Latitude</div>
              <Input 
                value={newUAV.position[0]} 
                onChange={(e) => setNewUAV({...newUAV, position: [
                  parseFloat(e.target.value) || 0, 
                  newUAV.position[1], 
                  newUAV.position[2]
                ]})}
                type="number"
                step="0.0001"
              />
            </div>
            <div>
              <div style={{ fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>Longitude</div>
              <Input 
                value={newUAV.position[1]} 
                onChange={(e) => setNewUAV({...newUAV, position: [
                  newUAV.position[0], 
                  parseFloat(e.target.value) || 0, 
                  newUAV.position[2]
                ]})}
                type="number"
                step="0.0001"
              />
            </div>
            <div>
              <div style={{ fontSize: '12px', marginBottom: '4px', color: '#6b7280' }}>Altitude (m)</div>
              <Input 
                value={newUAV.position[2]} 
                onChange={(e) => setNewUAV({...newUAV, position: [
                  newUAV.position[0], 
                  newUAV.position[1], 
                  parseFloat(e.target.value) || 0
                ]})}
                type="number"
                step="1"
              />
            </div>
          </div>
        </div>
        
        {connectionError && (
          <div style={{ marginTop: '16px', color: '#ef4444' }}>
            Connection error: {connectionError}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UAVManager;
