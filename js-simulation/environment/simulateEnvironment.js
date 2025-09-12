/**
 * Environment Simulation
 * Simulates environmental conditions affecting UAV operations and ISAC performance
 */

/**
 * Update environmental conditions based on time and random factors
 * @param {Object} environment - Current environment state
 * @param {number} currentTime - Current simulation time in seconds
 * @returns {Object} Updated environment object
 */
function updateEnvironment(environment, currentTime) {
    // Initialize environment if not provided
    if (!environment) {
        environment = initializeEnvironment();
    }
    
    // Update weather conditions
    environment.weather = updateWeatherConditions(environment.weather, currentTime);
    
    // Update terrain obstacles
    environment = updateTerrainObstacles(environment, currentTime);
    
    // Update atmospheric conditions
    environment.atmospheric = updateAtmosphericConditions(currentTime);
    
    // Update electromagnetic interference
    environment.interference = updateElectromagneticInterference(currentTime);
    
    // Update disaster-specific conditions
    environment.disasterEffects = updateDisasterEffects(environment, currentTime);
    
    return environment;
}

/**
 * Initialize environment with default conditions
 * @returns {Object} Initial environment object
 */
function initializeEnvironment() {
    const environment = {
        terrainType: 'urban',
        weather: initializeWeather(),
        terrainObstacles: generateTerrainObstacles(),
        atmospheric: {},
        interference: {},
        disasterEffects: {}
    };
    
    console.log(`Environment initialized: ${environment.terrainType} terrain`);
    return environment;
}

/**
 * Initialize weather conditions
 * @returns {Object} Initial weather object
 */
function initializeWeather() {
    return {
        temperature: 28, // Celsius
        humidity: 65, // Percentage
        windSpeed: 3, // m/s
        windDirection: 180, // degrees
        rain: false,
        fog: false,
        visibility: 15, // km
        cloudCover: 0.3, // 0-1 (0 = clear, 1 = overcast)
        precipitationIntensity: 0 // mm/hr
    };
}

/**
 * Update weather conditions with realistic variations
 * @param {Object} weather - Current weather state
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Updated weather object
 */
function updateWeatherConditions(weather, currentTime) {
    if (!weather) {
        weather = initializeWeather();
    }
    
    // Temperature variation (daily cycle)
    const baseTemp = 28; // Base temperature in Celsius
    const dailyVariation = 8 * Math.sin(2 * Math.PI * currentTime / (24 * 3600)); // Daily cycle
    weather.temperature = baseTemp + dailyVariation + (Math.random() - 0.5) * 2;
    
    // Humidity changes
    weather.humidity = 60 + 20 * Math.sin(2 * Math.PI * currentTime / (12 * 3600)) + (Math.random() - 0.5) * 10;
    weather.humidity = Math.max(30, Math.min(90, weather.humidity));
    
    // Wind conditions
    weather.windSpeed = updateWindSpeed(weather.windSpeed, currentTime);
    weather.windDirection = updateWindDirection(weather.windDirection);
    
    // Precipitation
    weather = updatePrecipitation(weather, currentTime);
    
    // Visibility conditions
    weather.visibility = calculateVisibility(weather);
    
    // Cloud cover
    weather.cloudCover = updateCloudCover(weather.cloudCover, currentTime);
    
    return weather;
}

/**
 * Update wind speed with realistic variations
 * @param {number} currentWindSpeed - Current wind speed
 * @param {number} currentTime - Current simulation time
 * @returns {number} Updated wind speed
 */
function updateWindSpeed(currentWindSpeed, currentTime) {
    // Base wind speed with daily variation
    const baseWind = 4 + 2 * Math.sin(2 * Math.PI * currentTime / (8 * 3600)); // 8-hour cycle
    
    // Add turbulence and gusts
    const turbulence = (Math.random() - 0.5) * 2; // ±1 m/s random variation
    
    let windSpeed;
    
    // Gust probability (5% chance of strong gust)
    if (Math.random() < 0.05) {
        const gustStrength = 5 + Math.random() * 10; // 5-15 m/s gust
        windSpeed = baseWind + gustStrength;
    } else {
        windSpeed = baseWind + turbulence;
    }
    
    // Smooth transition from previous wind speed
    if (currentWindSpeed !== undefined) {
        windSpeed = 0.9 * currentWindSpeed + 0.1 * windSpeed;
    }
    
    return Math.max(0, windSpeed); // Non-negative wind speed
}

/**
 * Update wind direction with gradual changes
 * @param {number} currentDirection - Current wind direction
 * @returns {number} Updated wind direction
 */
function updateWindDirection(currentDirection) {
    if (currentDirection === undefined) {
        return Math.random() * 360;
    }
    
    // Gradual direction change (±10 degrees per update)
    const directionChange = (Math.random() - 0.5) * 20;
    let windDirection = currentDirection + directionChange;
    
    // Wrap around 0-360 degrees
    windDirection = ((windDirection % 360) + 360) % 360;
    
    return windDirection;
}

/**
 * Update precipitation conditions
 * @param {Object} weather - Weather object
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Updated weather object
 */
function updatePrecipitation(weather, currentTime) {
    // Rain probability based on humidity and cloud cover
    let rainProbability = (weather.humidity - 60) / 40 * weather.cloudCover;
    rainProbability = Math.max(0, Math.min(0.3, rainProbability)); // Max 30% chance
    
    // Check if it starts or stops raining
    if (!weather.rain && Math.random() < rainProbability * 0.01) { // Low probability per time step
        weather.rain = true;
        weather.precipitationIntensity = 2 + Math.random() * 8; // 2-10 mm/hr
        console.log(`Weather update: Rain started (${weather.precipitationIntensity.toFixed(1)} mm/hr)`);
    } else if (weather.rain && Math.random() < 0.05) { // 5% chance to stop raining
        weather.rain = false;
        weather.precipitationIntensity = 0;
        console.log('Weather update: Rain stopped');
    }
    
    // Update rain intensity if already raining
    if (weather.rain) {
        const intensityChange = (Math.random() - 0.5) * 2; // ±1 mm/hr change
        weather.precipitationIntensity = Math.max(1, weather.precipitationIntensity + intensityChange);
    }
    
    // Fog conditions (more likely after rain or high humidity)
    let fogProbability = 0.02; // Base 2% chance
    if (weather.humidity > 80) {
        fogProbability *= 2;
    }
    if (weather.rain) {
        fogProbability *= 1.5;
    }
    
    if (!weather.fog && Math.random() < fogProbability) {
        weather.fog = true;
        console.log('Weather update: Fog conditions started');
    } else if (weather.fog && Math.random() < 0.1) { // 10% chance to clear fog
        weather.fog = false;
        console.log('Weather update: Fog cleared');
    }
    
    return weather;
}

/**
 * Calculate visibility based on weather conditions
 * @param {Object} weather - Weather object
 * @returns {number} Visibility in km
 */
function calculateVisibility(weather) {
    let baseVisibility = 20; // km in clear conditions
    let visibility = baseVisibility;
    
    // Reduce visibility due to rain
    if (weather.rain) {
        visibility *= (1 - weather.precipitationIntensity / 20);
    }
    
    // Reduce visibility due to fog
    if (weather.fog) {
        visibility = Math.min(visibility, 0.5 + Math.random() * 1.5); // 0.5-2 km in fog
    }
    
    // Cloud cover effects
    visibility *= (1 - weather.cloudCover * 0.2);
    
    // Humidity effects
    if (weather.humidity > 85) {
        visibility *= 0.8;
    }
    
    return Math.max(0.1, visibility); // Minimum 100m visibility
}

/**
 * Update cloud cover with realistic patterns
 * @param {number} currentCover - Current cloud cover
 * @param {number} currentTime - Current simulation time
 * @returns {number} Updated cloud cover
 */
function updateCloudCover(currentCover, currentTime) {
    if (currentCover === undefined) {
        return 0.3; // 30% initial cloud cover
    }
    
    // Daily cloud pattern (more clouds in afternoon)
    const dailyPattern = 0.2 * Math.sin(2 * Math.PI * (currentTime - 6*3600) / (24 * 3600));
    
    // Random variation
    const randomChange = (Math.random() - 0.5) * 0.1;
    
    let cloudCover = currentCover + dailyPattern * 0.01 + randomChange * 0.01;
    cloudCover = Math.max(0, Math.min(1, cloudCover)); // Clamp between 0 and 1
    
    return cloudCover;
}

/**
 * Update terrain obstacles and their effects
 * @param {Object} environment - Environment object
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Updated environment object
 */
function updateTerrainObstacles(environment, currentTime) {
    // Initialize terrain if not present
    if (!environment.terrainObstacles) {
        environment.terrainObstacles = generateTerrainObstacles();
    }
    
    // Buildings and structures (static but can be damaged in disasters)
    environment.terrainObstacles.buildings = updateBuildingObstacles(environment.terrainObstacles.buildings);
    
    // Vegetation (can change with seasons/weather)
    environment.terrainObstacles.vegetation = updateVegetationObstacles(environment.terrainObstacles.vegetation, currentTime);
    
    // Temporary obstacles (debris, vehicles, etc.)
    environment.terrainObstacles.temporary = updateTemporaryObstacles(environment.terrainObstacles.temporary);
    
    return environment;
}

/**
 * Generate initial terrain obstacles
 * @returns {Object} Terrain obstacles object
 */
function generateTerrainObstacles() {
    return {
        buildings: generateBuildingObstacles(),
        vegetation: generateVegetationObstacles(),
        temporary: []
    };
}

/**
 * Generate building obstacles
 * @returns {Array} Array of building objects
 */
function generateBuildingObstacles() {
    const numBuildings = Math.floor(Math.random() * 11) + 5; // 5-15 buildings
    const buildings = [];
    
    for (let i = 0; i < numBuildings; i++) {
        const building = {
            position: [Math.random() * 2000 - 1000, Math.random() * 2000 - 1000], // Random position
            height: 10 + Math.random() * 40, // 10-50m height
            width: 20 + Math.random() * 30, // 20-50m width
            length: 20 + Math.random() * 30, // 20-50m length
            material: 'concrete', // concrete, steel, wood
            rfAttenuation: 15 + Math.random() * 10, // 15-25 dB attenuation
            damaged: false // Can be set true in disaster scenarios
        };
        
        buildings.push(building);
    }
    
    return buildings;
}

/**
 * Generate vegetation obstacles
 * @returns {Array} Array of vegetation objects
 */
function generateVegetationObstacles() {
    const numVegetationAreas = Math.floor(Math.random() * 6) + 3; // 3-8 vegetation areas
    const vegetation = [];
    
    for (let i = 0; i < numVegetationAreas; i++) {
        const vegArea = {
            position: [Math.random() * 2000 - 1000, Math.random() * 2000 - 1000],
            radius: 50 + Math.random() * 100, // 50-150m radius
            density: 0.3 + Math.random() * 0.5, // 30-80% density
            height: 5 + Math.random() * 15, // 5-20m height
            type: 'trees', // trees, bushes, grass
            seasonalFactor: 1.0 // Changes with seasons
        };
        
        vegArea.rfAttenuation = vegArea.density * 8; // Density-based attenuation
        vegetation.push(vegArea);
    }
    
    return vegetation;
}

/**
 * Update building obstacles (mainly for disaster damage)
 * @param {Array} buildings - Array of building objects
 * @returns {Array} Updated buildings array
 */
function updateBuildingObstacles(buildings) {
    if (!buildings) return [];
    
    for (let i = 0; i < buildings.length; i++) {
        // Small chance of building damage in disaster scenarios
        if (Math.random() < 0.01 && !buildings[i].damaged) { // 1% chance per update
            buildings[i].damaged = true;
            buildings[i].height *= (0.3 + Math.random() * 0.4); // 30-70% of original height
            buildings[i].rfAttenuation *= 0.7; // Reduced attenuation
            console.log(`Building obstacle damaged at position [${buildings[i].position[0].toFixed(1)}, ${buildings[i].position[1].toFixed(1)}]`);
        }
    }
    
    return buildings;
}

/**
 * Update vegetation obstacles (seasonal changes, weather effects)
 * @param {Array} vegetation - Array of vegetation objects
 * @param {number} currentTime - Current simulation time
 * @returns {Array} Updated vegetation array
 */
function updateVegetationObstacles(vegetation, currentTime) {
    if (!vegetation) return [];
    
    // Seasonal factor (simplified - based on time)
    const seasonCycle = Math.sin(2 * Math.PI * currentTime / (365 * 24 * 3600)); // Yearly cycle
    const seasonalFactor = 0.8 + 0.2 * seasonCycle; // 0.6-1.0 factor
    
    for (let i = 0; i < vegetation.length; i++) {
        vegetation[i].seasonalFactor = seasonalFactor;
        
        // Adjust RF attenuation based on seasonal factor
        const baseAttenuation = vegetation[i].density * 8;
        vegetation[i].rfAttenuation = baseAttenuation * seasonalFactor;
    }
    
    return vegetation;
}

/**
 * Update temporary obstacles (debris, vehicles, etc.)
 * @param {Array} temporary - Array of temporary obstacle objects
 * @returns {Array} Updated temporary obstacles array
 */
function updateTemporaryObstacles(temporary) {
    if (!temporary) temporary = [];
    
    // Remove old temporary obstacles (10% chance per update)
    if (temporary.length > 0) {
        temporary = temporary.filter(() => Math.random() >= 0.1);
    }
    
    // Add new temporary obstacles (5% chance per update)
    if (Math.random() < 0.05) {
        const newObstacle = {
            position: [Math.random() * 2000 - 1000, Math.random() * 2000 - 1000],
            type: 'debris', // debris, vehicle, equipment
            size: 5 + Math.random() * 15, // 5-20m size
            rfAttenuation: 3 + Math.random() * 7, // 3-10 dB
            lifetime: 60 + Math.random() * 300 // 1-6 minutes lifetime
        };
        
        temporary.push(newObstacle);
    }
    
    return temporary;
}

/**
 * Update atmospheric conditions affecting RF propagation
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Atmospheric conditions object
 */
function updateAtmosphericConditions(currentTime) {
    const atmospheric = {};
    
    // Atmospheric pressure (affects RF propagation)
    const basePressure = 1013.25; // hPa at sea level
    const dailyVariation = 5 * Math.sin(2 * Math.PI * currentTime / (24 * 3600));
    atmospheric.pressure = basePressure + dailyVariation + (Math.random() - 0.5) * 3;
    
    // Atmospheric ducting conditions (affects long-range propagation)
    atmospheric.ductingProbability = 0.1 + 0.05 * Math.sin(2 * Math.PI * currentTime / (12 * 3600));
    atmospheric.ductingActive = Math.random() < atmospheric.ductingProbability;
    
    // Ionospheric conditions (mainly affects HF, minimal impact on 2.4 GHz)
    atmospheric.ionosphericActivity = Math.random(); // 0-1 scale
    
    // Atmospheric attenuation due to water vapor
    atmospheric.waterVaporDensity = 10 + Math.random() * 15; // g/m³
    atmospheric.attenuationCoefficient = atmospheric.waterVaporDensity * 0.01; // dB/km
    
    return atmospheric;
}

/**
 * Update electromagnetic interference sources
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Interference object
 */
function updateElectromagneticInterference(currentTime) {
    const interference = {};
    
    // Urban electromagnetic noise
    interference.urbanNoiseLevel = -95 + Math.random() * 10; // -95 to -85 dBm
    
    // Industrial interference
    interference.industrialSources = Math.floor(Math.random() * 4); // 0-3 industrial sources
    interference.industrialPower = -80 + Math.random() * 20; // -80 to -60 dBm
    
    // Other UAVs or communication systems
    interference.otherSystems = Math.floor(Math.random() * 3); // 0-2 other systems
    interference.systemInterference = -90 + Math.random() * 15; // -90 to -75 dBm
    
    // Natural interference (lightning, solar activity)
    interference.naturalNoise = -100 + Math.random() * 5; // -100 to -95 dBm
    
    // Time-varying interference (traffic, human activity)
    const dailyActivity = 0.5 + 0.3 * Math.sin(2 * Math.PI * (currentTime - 6*3600) / (24 * 3600));
    interference.activityFactor = dailyActivity;
    
    // Total interference level
    interference.totalLevel = calculateTotalInterference(interference);
    
    return interference;
}

/**
 * Calculate total interference level in dBm
 * @param {Object} interference - Interference object
 * @returns {number} Total interference level in dBm
 */
function calculateTotalInterference(interference) {
    // Convert dBm to linear scale, sum, then convert back
    const urbanLinear = Math.pow(10, interference.urbanNoiseLevel / 10);
    const industrialLinear = Math.pow(10, interference.industrialPower / 10) * interference.industrialSources;
    const systemLinear = Math.pow(10, interference.systemInterference / 10) * interference.otherSystems;
    const naturalLinear = Math.pow(10, interference.naturalNoise / 10);
    
    const totalLinear = (urbanLinear + industrialLinear + systemLinear + naturalLinear) * interference.activityFactor;
    return 10 * Math.log10(totalLinear);
}

/**
 * Update disaster-specific environmental effects
 * @param {Object} environment - Environment object
 * @param {number} currentTime - Current simulation time
 * @returns {Object} Disaster effects object
 */
function updateDisasterEffects(environment, currentTime) {
    const disasterEffects = {};
    
    // Smoke and particulates (from fires)
    disasterEffects.smokeDensity = Math.random() * 0.3; // 0-30% smoke density
    disasterEffects.particulateLevel = 50 + Math.random() * 200; // μg/m³
    
    // Structural damage effects on RF propagation
    disasterEffects.structuralDamageFactor = 0.8 + Math.random() * 0.2; // 80-100% (100% = no damage)
    
    // Emergency communication traffic
    disasterEffects.emergencyTrafficLevel = 0.5 + Math.random() * 0.5; // 50-100% of normal traffic
    
    // Power grid status (affects interference sources)
    disasterEffects.powerGridStatus = 0.3 + Math.random() * 0.7; // 30-100% operational
    
    // Search and rescue activity (other UAVs, helicopters)
    disasterEffects.sarActivityLevel = Math.random(); // 0-100% activity level
    disasterEffects.otherAircraft = Math.floor(Math.random() * 6); // 0-5 other aircraft in area
    
    // Ground team communications
    disasterEffects.groundTeamRadios = Math.floor(Math.random() * 16) + 5; // 5-20 ground radios active
    disasterEffects.radioInterference = -85 + Math.random() * 10; // -85 to -75 dBm
    
    return disasterEffects;
}

module.exports = {
    updateEnvironment,
    initializeEnvironment,
    initializeWeather,
    updateWeatherConditions,
    updateWindSpeed,
    updateWindDirection,
    updatePrecipitation,
    calculateVisibility,
    updateCloudCover,
    updateTerrainObstacles,
    generateTerrainObstacles,
    generateBuildingObstacles,
    generateVegetationObstacles,
    updateBuildingObstacles,
    updateVegetationObstacles,
    updateTemporaryObstacles,
    updateAtmosphericConditions,
    updateElectromagneticInterference,
    calculateTotalInterference,
    updateDisasterEffects
};