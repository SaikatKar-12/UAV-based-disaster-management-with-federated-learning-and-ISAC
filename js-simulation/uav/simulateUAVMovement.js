/**
 * UAV Movement Simulation
 * Simulates UAV movement patterns and position updates
 */

/**
 * Update UAV position based on current velocity and time step
 * @param {Object} uav - UAV object with position, velocity, etc.
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function updateUAVPosition(uav, dt) {
    // Apply velocity to position
    uav.position[0] += uav.velocity[0] * dt;
    uav.position[1] += uav.velocity[1] * dt;
    uav.position[2] += uav.velocity[2] * dt;
    
    // Update battery level (simple linear discharge model)
    const powerConsumption = calculatePowerConsumption(uav);
    const batteryDrainPerSecond = powerConsumption / 3600; // Convert to per-second drain
    uav.batteryLevel = Math.max(0, uav.batteryLevel - batteryDrainPerSecond * dt);
    
    // Apply movement pattern
    uav = applyMovementPattern(uav, dt);
    
    // Apply environmental effects on movement
    uav = applyEnvironmentalEffects(uav, dt);
    
    // Ensure UAV stays within operational bounds
    uav = enforceOperationalLimits(uav);
    
    return uav;
}

/**
 * Apply specific movement patterns for search operations
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyMovementPattern(uav, dt) {
    // Initialize pattern state if not exists
    if (!uav.patternState) {
        uav.patternState = {
            spiralAngle: 0,
            spiralRadius: 50,
            patternCenter: [uav.position[0], uav.position[1]],
            linearDirection: 1, // 1 for forward, -1 for backward
            timeElapsed: 0,
            altitudeDirection: 1 // For altitude changes
        };
    }
    
    uav.patternState.timeElapsed += dt;
    
    // Different search patterns for different UAVs
    let searchPattern = 'spiral'; // Default
    if (uav.id === 'UAV-001') {
        searchPattern = 'spiral';
    } else if (uav.id === 'UAV-002') {
        searchPattern = 'linear';
    } else if (uav.id === 'UAV-003') {
        searchPattern = 'random';
    }
    
    switch (searchPattern) {
        case 'spiral':
            uav = applySpiralPattern(uav, dt);
            break;
        case 'linear':
            uav = applyLinearPattern(uav, dt);
            break;
        case 'random':
            uav = applyRandomPattern(uav, dt);
            break;
        case 'grid':
            uav = applyGridPattern(uav, dt);
            break;
    }
    
    // Add dynamic altitude changes
    uav = applyAltitudeVariation(uav, dt);
    
    return uav;
}

/**
 * Apply dynamic altitude variations
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyAltitudeVariation(uav, dt) {
    // Different altitude patterns for different UAVs
    if (uav.id === 'UAV-001') {
        // Gentle sine wave altitude changes
        const altitudeBase = 50;
        const altitudeAmplitude = 15;
        const altitudeFrequency = 0.05; // Hz
        uav.position[2] = altitudeBase + altitudeAmplitude * Math.sin(uav.patternState.timeElapsed * altitudeFrequency * 2 * Math.PI);
    } else if (uav.id === 'UAV-002') {
        // Step-wise altitude changes
        if (Math.floor(uav.patternState.timeElapsed / 30) % 2 === 0) {
            uav.position[2] = 45;
        } else {
            uav.position[2] = 65;
        }
    } else if (uav.id === 'UAV-003') {
        // Random altitude variations
        const altitudeChange = (Math.random() - 0.5) * 2 * dt; // ±1 m/s altitude change
        uav.position[2] += altitudeChange;
        uav.position[2] = Math.max(30, Math.min(80, uav.position[2])); // Keep within bounds
    }
    
    return uav;
}

/**
 * Implement spiral search pattern
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applySpiralPattern(uav, dt) {
    const spiralSpeed = 5; // m/s
    const angularVelocity = 0.1; // rad/s
    const radiusGrowthRate = 0.5; // m/s
    
    // Update spiral angle and radius
    uav.patternState.spiralAngle += angularVelocity * dt;
    uav.patternState.spiralRadius += radiusGrowthRate * dt;
    
    // Calculate new position
    const centerX = uav.patternState.patternCenter[0];
    const centerY = uav.patternState.patternCenter[1];
    
    const targetX = centerX + uav.patternState.spiralRadius * Math.cos(uav.patternState.spiralAngle);
    const targetY = centerY + uav.patternState.spiralRadius * Math.sin(uav.patternState.spiralAngle);
    
    // Update velocity to move toward target position
    const directionX = targetX - uav.position[0];
    const directionY = targetY - uav.position[1];
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    
    if (distance > 0) {
        uav.velocity[0] = (directionX / distance) * spiralSpeed;
        uav.velocity[1] = (directionY / distance) * spiralSpeed;
    }
    
    // Reset spiral if it gets too large
    if (uav.patternState.spiralRadius > 500) {
        uav.patternState.spiralRadius = 50;
        uav.patternState.patternCenter = [uav.position[0], uav.position[1]];
    }
    
    return uav;
}

/**
 * Implement linear back-and-forth search pattern
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyLinearPattern(uav, dt) {
    const searchSpeed = 8; // m/s
    const searchWidth = 200; // meters
    
    // Move in current direction
    uav.velocity[0] = uav.patternState.linearDirection * searchSpeed;
    uav.velocity[1] = 0; // Move only in x-direction
    
    // Check if we need to turn around
    if (Math.abs(uav.position[0] - uav.patternState.patternCenter[0]) > searchWidth) {
        uav.patternState.linearDirection *= -1;
        // Move forward in y-direction for next sweep
        uav.position[1] += 50;
    }
    
    return uav;
}

/**
 * Implement random search pattern with some constraints
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyRandomPattern(uav, dt) {
    const maxSpeed = 10; // m/s
    const velocityChangeRate = 2; // m/s^2
    
    // Random velocity changes
    const velocityChangeX = (Math.random() - 0.5) * velocityChangeRate * dt;
    const velocityChangeY = (Math.random() - 0.5) * velocityChangeRate * dt;
    
    uav.velocity[0] += velocityChangeX;
    uav.velocity[1] += velocityChangeY;
    
    // Limit maximum speed
    const currentSpeed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    if (currentSpeed > maxSpeed) {
        uav.velocity[0] = uav.velocity[0] * (maxSpeed / currentSpeed);
        uav.velocity[1] = uav.velocity[1] * (maxSpeed / currentSpeed);
    }
    
    return uav;
}

/**
 * Implement systematic grid search pattern
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyGridPattern(uav, dt) {
    const gridSpacing = 100; // meters between grid lines
    const searchSpeed = 6; // m/s
    
    // Calculate current grid position
    const gridX = Math.round(uav.position[0] / gridSpacing) * gridSpacing;
    const gridY = Math.round(uav.position[1] / gridSpacing) * gridSpacing;
    
    let targetGridX = gridX;
    let targetGridY = gridY;
    
    // Move to next grid point
    if (Math.abs(uav.position[0] - gridX) < 5 && Math.abs(uav.position[1] - gridY) < 5) {
        // Reached current grid point, move to next
        if (Math.round(gridY / gridSpacing) % 2 === 0) {
            // Even row: move right
            targetGridX = gridX + gridSpacing;
        } else {
            // Odd row: move left
            targetGridX = gridX - gridSpacing;
        }
        
        // If reached end of row, move to next row
        if (Math.abs(targetGridX) > 500) { // Boundary check
            targetGridY = gridY + gridSpacing;
            targetGridX = 0;
        }
    }
    
    // Set velocity toward target grid point
    const directionX = targetGridX - uav.position[0];
    const directionY = targetGridY - uav.position[1];
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    
    if (distance > 0) {
        uav.velocity[0] = (directionX / distance) * searchSpeed;
        uav.velocity[1] = (directionY / distance) * searchSpeed;
    }
    
    return uav;
}

/**
 * Apply environmental effects on UAV movement
 * @param {Object} uav - UAV object
 * @param {number} dt - Time step in seconds
 * @returns {Object} Updated UAV object
 */
function applyEnvironmentalEffects(uav, dt) {
    // Wind effects
    const windSpeed = 2 + Math.random() * 3; // 2-5 m/s wind
    const windDirection = Math.random() * 2 * Math.PI; // Random wind direction
    
    const windVelocityX = windSpeed * Math.cos(windDirection);
    const windVelocityY = windSpeed * Math.sin(windDirection);
    
    // Apply wind as a disturbance
    uav.velocity[0] += windVelocityX * 0.1; // 10% wind effect
    uav.velocity[1] += windVelocityY * 0.1;
    
    // Turbulence effects (small random variations)
    const turbulenceStrength = 0.5; // m/s
    uav.velocity[0] += (Math.random() - 0.5) * turbulenceStrength;
    uav.velocity[1] += (Math.random() - 0.5) * turbulenceStrength;
    
    return uav;
}

/**
 * Enforce operational limits on UAV position and velocity
 * @param {Object} uav - UAV object
 * @returns {Object} Updated UAV object
 */
function enforceOperationalLimits(uav) {
    // Maximum speed limit
    const maxSpeed = 15; // m/s
    const currentSpeed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    if (currentSpeed > maxSpeed) {
        uav.velocity[0] = uav.velocity[0] * (maxSpeed / currentSpeed);
        uav.velocity[1] = uav.velocity[1] * (maxSpeed / currentSpeed);
    }
    
    // Altitude limits
    const minAltitude = 20; // meters
    const maxAltitude = 150; // meters
    uav.position[2] = Math.max(minAltitude, Math.min(maxAltitude, uav.position[2]));
    
    // Operational area limits (square boundary)
    const maxDistance = 1000; // meters from origin
    uav.position[0] = Math.max(-maxDistance, Math.min(maxDistance, uav.position[0]));
    uav.position[1] = Math.max(-maxDistance, Math.min(maxDistance, uav.position[1]));
    
    // Battery level check
    if (uav.batteryLevel < 20) {
        // Return to base behavior when battery is low
        const homeDirectionX = -uav.position[0];
        const homeDirectionY = -uav.position[1];
        const homeDistance = Math.sqrt(homeDirectionX * homeDirectionX + homeDirectionY * homeDirectionY);
        
        if (homeDistance > 0) {
            const returnSpeed = 8; // m/s
            uav.velocity[0] = (homeDirectionX / homeDistance) * returnSpeed;
            uav.velocity[1] = (homeDirectionY / homeDistance) * returnSpeed;
        }
        
        console.log(`Warning: UAV battery low (${uav.batteryLevel.toFixed(1)}%), returning to base`);
    }
    
    return uav;
}

/**
 * Calculate UAV power consumption in watts
 * @param {Object} uav - UAV object
 * @returns {number} Power consumption in watts
 */
function calculatePowerConsumption(uav) {
    // Base power consumption
    let basePower = 100; // watts (motors, electronics)
    
    // Speed-dependent power consumption
    const currentSpeed = Math.sqrt(uav.velocity[0] * uav.velocity[0] + uav.velocity[1] * uav.velocity[1]);
    const speedPower = currentSpeed * 5; // 5 watts per m/s
    
    // Altitude maintenance power
    const altitudePower = uav.position[2] * 0.5; // 0.5 watts per meter altitude
    
    // Camera and AI processing power
    const cameraPower = 20; // watts
    const aiProcessingPower = 30; // watts
    
    // Total power consumption
    let powerConsumption = basePower + speedPower + altitudePower + cameraPower + aiProcessingPower;
    
    // Add some random variation
    powerConsumption *= (0.9 + Math.random() * 0.2); // ±10% variation
    
    return powerConsumption;
}

module.exports = {
    updateUAVPosition,
    applyMovementPattern,
    applySpiralPattern,
    applyLinearPattern,
    applyRandomPattern,
    applyGridPattern,
    applyEnvironmentalEffects,
    enforceOperationalLimits,
    calculatePowerConsumption
};