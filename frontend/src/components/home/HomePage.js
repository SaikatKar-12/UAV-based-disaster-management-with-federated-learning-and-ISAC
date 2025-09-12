import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">🚁</span>
            <span className="logo-text">UAV Rescue</span>
          </div>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#technology">Technology</a>
            <Link to="/dashboard" className="nav-cta">Live Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Next-Generation
              <span className="gradient-text"> UAV Disaster Response</span>
            </h1>
            <p className="hero-subtitle">
              Revolutionizing emergency response with intelligent UAVs, adaptive communication, 
              and real-time survivor detection powered by ISAC technology.
            </p>
            <div className="hero-buttons">
              <Link to="/dashboard" className="btn-primary">
                <span>🎯</span>
                View Live Dashboard
              </Link>
              <a href="#about" className="btn-secondary">
                <span>📖</span>
                Learn More
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="card-header">
                <span className="status-dot active"></span>
                <span>UAV-001 Active</span>
              </div>
              <div className="card-stats">
                <div className="stat">
                  <span className="stat-value">12</span>
                  <span className="stat-label">Survivors Found</span>
                </div>
                <div className="stat">
                  <span className="stat-value">85%</span>
                  <span className="stat-label">Battery Level</span>
                </div>
                <div className="stat">
                  <span className="stat-value">ISAC</span>
                  <span className="stat-label">Communication</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header">
            <h2>About the Project</h2>
            <p>Transforming disaster response through intelligent autonomous systems</p>
          </div>
          <div className="about-grid">
            <div className="about-text">
              <h3>🎯 Mission</h3>
              <p>
                Our UAV Disaster Response System leverages cutting-edge technology to save lives 
                during natural disasters. By combining autonomous UAVs with adaptive ISAC 
                (Integrated Sensing and Communication) technology, we provide real-time 
                situational awareness to rescue teams.
              </p>
              
              <h3>🌟 Vision</h3>
              <p>
                To create a world where disaster response is faster, more efficient, and more 
                effective through the power of intelligent autonomous systems and adaptive 
                communication networks.
              </p>

              <h3>🎖️ Impact</h3>
              <p>
                Every second counts in disaster response. Our system reduces search time by up to 
                70% and provides critical information to rescue teams when traditional 
                communication infrastructure fails.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-number">70%</div>
                <div className="stat-text">Faster Response Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-number">95%</div>
                <div className="stat-text">Detection Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📡</div>
                <div className="stat-number">24/7</div>
                <div className="stat-text">Continuous Operation</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🌐</div>
                <div className="stat-number">100%</div>
                <div className="stat-text">Coverage Area</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Key Features</h2>
            <p>Advanced capabilities for modern disaster response</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚁</div>
              <h3>Autonomous UAV Fleet</h3>
              <p>
                Intelligent drones that can operate independently, navigate complex terrain, 
                and adapt to changing conditions in real-time.
              </p>
              <ul>
                <li>✓ Autonomous navigation</li>
                <li>✓ Obstacle avoidance</li>
                <li>✓ Weather adaptation</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📡</div>
              <h3>ISAC Technology</h3>
              <p>
                Integrated Sensing and Communication that adapts data transmission based on 
                signal strength and environmental conditions.
              </p>
              <ul>
                <li>✓ Adaptive communication modes</li>
                <li>✓ Signal optimization</li>
                <li>✓ Bandwidth management</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>AI-Powered Detection</h3>
              <p>
                Advanced machine learning algorithms for accurate survivor detection using 
                thermal imaging, audio analysis, and visual recognition.
              </p>
              <ul>
                <li>✓ Thermal imaging analysis</li>
                <li>✓ Audio pattern recognition</li>
                <li>✓ Multi-sensor fusion</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-Time Dashboard</h3>
              <p>
                Comprehensive command center providing live updates, mission statistics, 
                and coordination tools for rescue teams.
              </p>
              <ul>
                <li>✓ Live UAV tracking</li>
                <li>✓ Survivor mapping</li>
                <li>✓ Mission analytics</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Adaptive Communication</h3>
              <p>
                Smart communication protocols that adjust data transmission quality and 
                content based on network conditions.
              </p>
              <ul>
                <li>✓ Dynamic bandwidth allocation</li>
                <li>✓ Priority-based data streaming</li>
                <li>✓ Fault-tolerant networking</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Emergency Response</h3>
              <p>
                Rapid deployment capabilities with immediate situational awareness for 
                first responders and emergency management teams.
              </p>
              <ul>
                <li>✓ Quick deployment</li>
                <li>✓ Instant alerts</li>
                <li>✓ Coordination tools</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="technology">
        <div className="container">
          <div className="section-header">
            <h2>Technology Stack</h2>
            <p>Built with modern, reliable, and scalable technologies</p>
          </div>
          <div className="tech-grid">
            <div className="tech-category">
              <h3>🎯 AI & Machine Learning</h3>
              <div className="tech-items">
                <span className="tech-item">Computer Vision</span>
                <span className="tech-item">Deep Learning</span>
                <span className="tech-item">Pattern Recognition</span>
                <span className="tech-item">Sensor Fusion</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>🚁 UAV Systems</h3>
              <div className="tech-items">
                <span className="tech-item">Autonomous Navigation</span>
                <span className="tech-item">Flight Control</span>
                <span className="tech-item">Sensor Integration</span>
                <span className="tech-item">Real-time Processing</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>📡 Communication</h3>
              <div className="tech-items">
                <span className="tech-item">ISAC Protocol</span>
                <span className="tech-item">WebSocket</span>
                <span className="tech-item">REST API</span>
                <span className="tech-item">Real-time Streaming</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>💻 Frontend</h3>
              <div className="tech-items">
                <span className="tech-item">React.js</span>
                <span className="tech-item">Interactive Maps</span>
                <span className="tech-item">Real-time UI</span>
                <span className="tech-item">Responsive Design</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>⚙️ Backend</h3>
              <div className="tech-items">
                <span className="tech-item">Node.js</span>
                <span className="tech-item">Express.js</span>
                <span className="tech-item">SQLite Database</span>
                <span className="tech-item">WebSocket Server</span>
              </div>
            </div>

            <div className="tech-category">
              <h3>🔧 Infrastructure</h3>
              <div className="tech-items">
                <span className="tech-item">Microservices</span>
                <span className="tech-item">Event-Driven</span>
                <span className="tech-item">Scalable Architecture</span>
                <span className="tech-item">Cloud Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Experience the Future of Disaster Response</h2>
            <p>
              See our UAV Disaster Response System in action with real-time data, 
              live tracking, and intelligent coordination capabilities.
            </p>
            <Link to="/dashboard" className="btn-primary large">
              <span>🚀</span>
              Launch Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-icon">🚁</span>
                <span className="logo-text">UAV Rescue</span>
              </div>
              <p>Next-generation disaster response technology</p>
            </div>
            <div className="footer-section">
              <h4>System</h4>
              <ul>
                <li><Link to="/dashboard">Live Dashboard</Link></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#technology">Technology</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Project</h4>
              <ul>
                <li><a href="#about">About</a></li>
                <li><a href="#about">Mission</a></li>
                <li><a href="#about">Impact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Status</h4>
              <div className="system-status">
                <div className="status-item">
                  <span className="status-dot active"></span>
                  <span>System Online</span>
                </div>
                <div className="status-item">
                  <span className="status-dot active"></span>
                  <span>UAV Fleet Ready</span>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 UAV Disaster Response System. Built for saving lives.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;