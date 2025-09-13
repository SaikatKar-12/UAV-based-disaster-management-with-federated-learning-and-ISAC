import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaImage, FaArrowLeft, FaArrowRight, FaExpand } from 'react-icons/fa';
import droneImage from './drone.jpg';

const UAVDetails = () => {
  const { uavId } = useParams();
  const navigate = useNavigate();
  const [uavData, setUavData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    const fetchUAVData = async () => {
      try {
        // TODO: Replace with actual API call to fetch UAV data by ID
        // const response = await fetch(`/api/uavs/${uavId}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        const mockData = {
          uavId,
          status: 'active',
          batteryLevel: 85,
          lastUpdated: new Date().toISOString(),
          location: {
            lat: 12.9716 + (Math.random() * 0.01 - 0.005),
            lng: 77.5946 + (Math.random() * 0.01 - 0.005),
            altitude: 100 + Math.floor(Math.random() * 50)
          },
          isacMode: 'good',
          cameraActive: true,
          telemetry: {
            speed: 12.5,
            heading: 45,
            temperature: 32.5,
            humidity: 45
          },
          detections: [
            { 
              id: 'det-1', 
              timestamp: new Date(Date.now() - 3600000), 
              type: 'human', 
              confidence: 0.92, 
              location: { lat: 12.9720, lng: 77.5950 },
              image: `https://source.unsplash.com/random/400x300/?disaster,rescue,${Math.floor(Math.random() * 1000)}`
            },
            { 
              id: 'det-2', 
              timestamp: new Date(Date.now() - 7200000), 
              type: 'vehicle', 
              confidence: 0.87, 
              location: { lat: 12.9730, lng: 77.5960 },
              image: `https://source.unsplash.com/random/400x300/?rescue,vehicle,${Math.floor(Math.random() * 1000)}`
            },
          ],
          // Additional demo images captured by the UAV
          demoImages: [
            { 
              id: 'img-1', 
              timestamp: new Date(Date.now() - 10800000),
              location: { lat: 44.2601, lng: -72.5754 },
              url: droneImage,
              description: 'Aerial view of Montpelier flood damage',
              tags: ['flood', 'aerial', 'vermont', 'damage-assessment']
            },
            { 
              id: 'img-2', 
              timestamp: new Date(Date.now() - 9000000),
              location: { lat: 44.2601, lng: -72.5754 },
              url: droneImage,
              description: 'Flood impact on Montpelier infrastructure',
              tags: ['flood', 'infrastructure', 'vermont', 'disaster']
            },
            { 
              id: 'img-3', 
              timestamp: new Date(Date.now() - 7200000),
              location: { lat: 44.2601, lng: -72.5754 },
              url: droneImage,
              description: 'Montpelier flood response assessment',
              tags: ['flood', 'response', 'vermont', 'emergency']
            },
            { 
              id: 'img-4', 
              timestamp: new Date(Date.now() - 5400000),
              location: { lat: 44.2601, lng: -72.5754 },
              url: droneImage,
              description: 'Flood damage documentation in Montpelier',
              tags: ['flood', 'damage', 'vermont', 'documentation']
            },
            { 
              id: 'img-5', 
              timestamp: new Date(Date.now() - 3600000),
              location: { lat: 44.2601, lng: -72.5754 },
              url: droneImage,
              description: 'Aerial survey of Montpelier flood zone',
              tags: ['flood', 'aerial-survey', 'vermont', 'assessment']
            }
          ]
        };
        
        setUavData(mockData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load UAV data');
        setLoading(false);
        console.error('Error fetching UAV data:', err);
      }
    };

    fetchUAVData();
  }, [uavId]);

  const formatCoordinate = (coord) => {
    return coord?.toFixed(4) || 'N/A';
  };

  if (loading) {
    return (
      <div className="card">
        <h2>Loading UAV Data...</h2>
        <div className="loading">
          <div className="spinner"></div>
          Loading UAV details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="button">Go Back</button>
      </div>
    );
  }

  if (!uavData) {
    return (
      <div className="card">
        <h2>UAV Not Found</h2>
        <p>No data available for UAV {uavId}</p>
        <button onClick={() => navigate(-1)} className="button">Go Back</button>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === uavData.demoImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? uavData.demoImages.length - 1 : prevIndex - 1
    );
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setIsViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsViewerOpen(false);
  };

  return (
    <div className="uav-details">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>UAV Details: {uavData.uavId}</h2>
          <button onClick={() => navigate(-1)} className="button secondary">
            Back to Dashboard
          </button>
        </div>

        {/* Demo Imagery Section - Moved to top */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Captured Imagery</h3>
          
          {/* Main Image Viewer */}
          <div style={{ 
            position: 'relative', 
            marginBottom: '1rem',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {uavData.demoImages && uavData.demoImages.length > 0 ? (
              <>
                <img 
                  src={uavData.demoImages[currentImageIndex].url} 
                  alt={`UAV capture ${currentImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                  onClick={() => openImageViewer(currentImageIndex)}
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  <FaArrowLeft />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                >
                  <FaArrowRight />
                </button>
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: 'white',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '5px 0',
                  fontSize: '0.9rem'
                }}>
                  {uavData.demoImages[currentImageIndex].description} • {format(new Date(uavData.demoImages[currentImageIndex].timestamp), 'PPpp')}
                </div>
              </>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <FaImage size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No imagery available for this UAV</p>
              </div>
            )}
          </div>

          {/* Image Thumbnails */}
          {uavData.demoImages && uavData.demoImages.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}>
              {uavData.demoImages.map((img, index) => (
                <div 
                  key={img.id}
                  onClick={() => setCurrentImageIndex(index)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    aspectRatio: '4/3',
                    border: currentImageIndex === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    opacity: currentImageIndex === index ? 1 : 0.8,
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f3f4f6'
                  }}
                >
                  <img 
                    src={img.url} 
                    alt={`Thumbnail ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
                    color: 'white',
                    padding: '0.25rem',
                    fontSize: '0.6rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {format(new Date(img.timestamp), 'MMM d, h:mma')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid-container">
          {/* Status Section */}
          <div className="card">
            <h3>Status</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">{uavData.status}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Updated</span>
                <span className="info-value">
                  {format(new Date(uavData.lastUpdated), 'PPpp')}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Battery Level</span>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${uavData.batteryLevel > 50 ? 'high' : uavData.batteryLevel > 20 ? 'medium' : 'low'}`}
                    style={{ width: `${uavData.batteryLevel}%` }}
                  >
                    {uavData.batteryLevel}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="card">
            <h3>Location</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Latitude</span>
                <span className="info-value">{formatCoordinate(uavData.location.lat)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Longitude</span>
                <span className="info-value">{formatCoordinate(uavData.location.lng)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Altitude</span>
                <span className="info-value">{uavData.location.altitude} m</span>
              </div>
              <div className="info-item">
                <span className="info-label">ISAC Mode</span>
                <span className="info-value">{uavData.isacMode.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Telemetry Section */}
          <div className="card">
            <h3>Telemetry</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Speed</span>
                <span className="info-value">{uavData.telemetry.speed} m/s</span>
              </div>
              <div className="info-item">
                <span className="info-label">Heading</span>
                <span className="info-value">{uavData.telemetry.heading}°</span>
              </div>
              <div className="info-item">
                <span className="info-label">Temperature</span>
                <span className="info-value">{uavData.telemetry.temperature}°C</span>
              </div>
              <div className="info-item">
                <span className="info-label">Humidity</span>
                <span className="info-value">{uavData.telemetry.humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detections Section */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Recent Detections</h3>
          {uavData.detections.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Confidence</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {uavData.detections.map((detection) => (
                    <tr key={detection.id}>
                      <td>{detection.id}</td>
                      <td>{format(new Date(detection.timestamp), 'PPpp')}</td>
                      <td>{detection.type}</td>
                      <td>{(detection.confidence * 100).toFixed(1)}%</td>
                      <td>
                        {formatCoordinate(detection.location.lat)}, {formatCoordinate(detection.location.lng)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No detections recorded for this UAV.</p>
          )}
        </div>


        {/* Image Viewer Modal */}
        {isViewerOpen && uavData.demoImages && uavData.demoImages.length > 0 && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
              }}>
                <button 
                  onClick={closeImageViewer}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  ×
                </button>
              </div>
              
              <img 
                src={uavData.demoImages[currentImageIndex].url} 
                alt={`UAV capture ${currentImageIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}
              />
              
              <div style={{
                marginTop: '1rem',
                color: 'white',
                textAlign: 'center',
                maxWidth: '80%'
              }}>
                <h3 style={{ margin: '0.5rem 0' }}>{uavData.demoImages[currentImageIndex].description}</h3>
                <p style={{ margin: '0.25rem 0', opacity: 0.8 }}>
                  {format(new Date(uavData.demoImages[currentImageIndex].timestamp), 'PPPPpppp')}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', opacity: 0.7 }}>
                  Location: {uavData.demoImages[currentImageIndex].location.lat.toFixed(4)}, {uavData.demoImages[currentImageIndex].location.lng.toFixed(4)}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {uavData.demoImages[currentImageIndex].tags.map((tag, i) => (
                    <span 
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        backdropFilter: 'blur(5px)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                style={{
                  position: 'absolute',
                  left: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <FaArrowLeft />
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                style={{
                  position: 'absolute',
                  right: '-60px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <FaArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UAVDetails;
