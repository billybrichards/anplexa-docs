import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Legend, ReferenceArea } from 'recharts';

// Astronomical constants
const AXIAL_TILT = 23.44; // Earth's axial tilt in degrees
const MAGNETIC_TILT = 11.5; // Magnetic axis tilt from rotation axis
const MAGNETIC_OFFSET_LON = -72; // Longitude offset of magnetic axis

// Zodiac constellations with TRUE ecliptic longitudes (J2000 epoch)
// Ecliptic longitude 0° = Vernal Equinox point (where Sun crosses celestial equator going north)
const zodiacSigns = [
  { name: "Aries", symbol: "♈", eclipticLon: 0, color: 0xff6b6b, element: "Fire", 
    stars: [[10, 8], [15, 6], [18, 3], [12, 1]] },
  { name: "Taurus", symbol: "♉", eclipticLon: 30, color: 0x51cf66, element: "Earth",
    stars: [[35, 10], [40, 8], [45, 5], [38, 3], [42, 0]] }, // Includes Aldebaran region
  { name: "Gemini", symbol: "♊", eclipticLon: 60, color: 0xffd43b, element: "Air",
    stars: [[65, 15], [70, 18], [68, 10], [75, 12], [72, 5]] }, // Castor & Pollux region
  { name: "Cancer", symbol: "♋", eclipticLon: 90, color: 0x74c0fc, element: "Water",
    stars: [[92, 12], [95, 8], [88, 6], [98, 10]] },
  { name: "Leo", symbol: "♌", eclipticLon: 120, color: 0xff922b, element: "Fire",
    stars: [[125, 15], [130, 12], [135, 8], [128, 5], [140, 3]] }, // Regulus region
  { name: "Virgo", symbol: "♍", eclipticLon: 150, color: 0x8ce99a, element: "Earth",
    stars: [[155, 5], [160, 0], [165, -3], [158, 8], [170, 2]] }, // Spica region
  { name: "Libra", symbol: "♎", eclipticLon: 180, color: 0xe599f7, element: "Air",
    stars: [[185, 0], [190, -5], [182, 5], [195, -2]] },
  { name: "Scorpio", symbol: "♏", eclipticLon: 210, color: 0xc92a2a, element: "Water",
    stars: [[215, -10], [220, -15], [225, -20], [230, -18], [235, -12], [218, -5]] }, // Antares region
  { name: "Sagittarius", symbol: "♐", eclipticLon: 240, color: 0x9775fa, element: "Fire",
    stars: [[245, -25], [250, -22], [255, -18], [248, -15], [260, -20]] },
  { name: "Capricorn", symbol: "♑", eclipticLon: 270, color: 0x69db7c, element: "Earth",
    stars: [[275, -15], [280, -18], [285, -12], [278, -8]] },
  { name: "Aquarius", symbol: "♒", eclipticLon: 300, color: 0x4dabf7, element: "Air",
    stars: [[305, -8], [310, -5], [315, -10], [308, 0], [320, -3]] },
  { name: "Pisces", symbol: "♓", eclipticLon: 330, color: 0x66d9e8, element: "Water",
    stars: [[335, 5], [340, 8], [345, 3], [350, 10], [355, 5]] }
];

// Geomagnetic data from IGRF-13
const geomagData = {
  locations: [
    // Continents
    { id: "africa", name: "Africa", lat: 1.5, lon: 17.3, F: 38380, dFdt: 3.63, I: -28.05, D: -0.84, type: "continent" },
    { id: "antarctica", name: "Antarctica", lat: -82, lon: 0, F: 51154, dFdt: -34.98, I: -72.39, D: 21.56, type: "continent" },
    { id: "asia", name: "Asia", lat: 34, lon: 100, F: 54942, dFdt: 42.54, I: 52.27, D: 0.88, type: "continent" },
    { id: "oceania", name: "Oceania", lat: -25, lon: 135, F: 56376, dFdt: 39.52, I: -62.53, D: -4.18, type: "continent" },
    { id: "europe", name: "Europe", lat: 50, lon: 10, F: 50933, dFdt: 22.81, I: 68.0, D: -1.86, type: "continent" },
    { id: "north_america", name: "N. America", lat: 45, lon: -100, F: 57738, dFdt: -108.21, I: 68.99, D: -2.75, type: "continent" },
    { id: "south_america", name: "S. America", lat: -15, lon: -60, F: 31045, dFdt: 54.09, I: -42.46, D: 11.09, type: "continent", saa: true },
    // SAA Region
    { id: "brazil", name: "Brazil", lat: -10, lon: -53, F: 31972, dFdt: 62.52, I: -37.8, D: 13.23, type: "country", saa: true },
    { id: "argentina", name: "Argentina", lat: -34, lon: -64, F: 30745, dFdt: 28.58, I: -60.76, D: 3.88, type: "country", saa: true },
    { id: "saa_core", name: "SAA Core", lat: -28, lon: -53, F: 22000, dFdt: 50, I: -45, D: 10, type: "special", saa: true },
    // Key locations
    { id: "canada", name: "Canada", lat: 56, lon: -96, F: 58464, dFdt: -133.22, I: 75.72, D: -3.91, type: "country" },
    { id: "usa", name: "USA", lat: 39, lon: -98, F: 54538, dFdt: -106.6, I: 63.26, D: -2.05, type: "country" },
    { id: "uk", name: "UK", lat: 54, lon: -2, F: 51047, dFdt: 22.62, I: 69.1, D: -3.74, type: "country" },
    { id: "norway", name: "Norway", lat: 64, lon: 10, F: 53067, dFdt: 9.66, I: 75.21, D: -3.59, type: "country", auroral: true },
    { id: "russia", name: "Russia", lat: 62, lon: 96, F: 59627, dFdt: 19.81, I: 77.02, D: 1.08, type: "country" },
    { id: "china", name: "China", lat: 35, lon: 105, F: 54165, dFdt: 42.49, I: 53.42, D: -0.44, type: "country" },
    { id: "japan", name: "Japan", lat: 36, lon: 138, F: 50427, dFdt: -3.15, I: 51.15, D: -8.04, type: "country" },
    { id: "australia", name: "Australia", lat: -25, lon: 134, F: 56278, dFdt: 40.01, I: -62.38, D: -4.01, type: "country" },
    { id: "south_africa", name: "S. Africa", lat: -29, lon: 25, F: 35557, dFdt: 14.52, I: -72.28, D: 17.83, type: "country" },
    // Capitals
    { id: "sao_paulo", name: "São Paulo", lat: -23.55, lon: -46.63, F: 32708, dFdt: 62.67, I: -50.3, D: 14.95, type: "capital", saa: true },
    { id: "buenos_aires", name: "Buenos Aires", lat: -34.6, lon: -58.38, F: 30744, dFdt: 36.65, I: -57.24, D: 5.15, type: "capital", saa: true },
    { id: "austin", name: "Austin, TX", lat: 30.27, lon: -97.74, F: 48700, dFdt: -97.17, I: 56.88, D: -2.1, type: "capital" },
    { id: "london", name: "London", lat: 51.51, lon: -0.13, F: 51047, dFdt: 22.62, I: 68.25, D: -3.06, type: "capital" },
    { id: "tokyo", name: "Tokyo", lat: 35.68, lon: 139.69, F: 47990, dFdt: -0.77, I: 49.65, D: -8.26, type: "capital" },
    // Magnetic poles
    { id: "north_mag_pole", name: "N. Magnetic Pole", lat: 86.5, lon: -156, F: 58000, dFdt: -20, I: 90, D: 0, type: "pole" },
    { id: "south_mag_pole", name: "S. Magnetic Pole", lat: -64, lon: 136, F: 65000, dFdt: 10, I: -90, D: 0, type: "pole" }
  ]
};

// Convert geographic lat/lon to 3D position on sphere
const geoToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Convert ecliptic coordinates to celestial sphere position
// Ecliptic is tilted 23.44° from Earth's equatorial plane
const eclipticToVector3 = (eclipticLon, eclipticLat, radius) => {
  const lonRad = eclipticLon * Math.PI / 180;
  const latRad = eclipticLat * Math.PI / 180;
  const tiltRad = AXIAL_TILT * Math.PI / 180;
  
  // Start in ecliptic coordinates
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.cos(latRad) * Math.sin(lonRad);
  const z = radius * Math.sin(latRad);
  
  // Rotate around X-axis by axial tilt to align with equatorial coordinates
  // This tilts the ecliptic relative to the equator
  const yRotated = y * Math.cos(tiltRad) - z * Math.sin(tiltRad);
  const zRotated = y * Math.sin(tiltRad) + z * Math.cos(tiltRad);
  
  return new THREE.Vector3(x, zRotated, -yRotated);
};

// Get Sun's ecliptic longitude based on day of year
// Vernal equinox (~March 20) = 0°, Summer solstice (~June 21) = 90°, etc.
const getSunEclipticLongitude = (month, day = 15) => {
  // Approximate: March 20 = day 79 = 0° ecliptic longitude
  const dayOfYear = Math.floor((month * 30.44) + day);
  const daysSinceVernalEquinox = (dayOfYear - 79 + 365) % 365;
  return (daysSinceVernalEquinox / 365) * 360;
};

// Get zodiac sign from ecliptic longitude
const getZodiacFromLongitude = (lon) => {
  const normalizedLon = ((lon % 360) + 360) % 360;
  const index = Math.floor(normalizedLon / 30);
  return zodiacSigns[index];
};

const getFieldColor = (F) => {
  const normalized = (F - 22000) / (65000 - 22000);
  if (normalized < 0.25) return new THREE.Color(0xef4444);
  if (normalized < 0.5) return new THREE.Color(0xf97316);
  if (normalized < 0.75) return new THREE.Color(0x22c55e);
  return new THREE.Color(0x3b82f6);
};

export default function GeomagneticGlobeWithZodiac() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const earthGroupRef = useRef(null); // Group containing Earth and magnetic markers
  const celestialGroupRef = useRef(null); // Fixed celestial sphere with zodiac
  const earthMarkersRef = useRef([]);
  const celestialMarkersRef = useRef([]);
  const animationRef = useRef(null);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedZodiac, setSelectedZodiac] = useState(null);
  const [viewLevel, setViewLevel] = useState('all');
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(15);
  const [hourAngle, setHourAngle] = useState(12); // 0-24 hours, controls Earth's rotation
  const [autoRotate, setAutoRotate] = useState(false);
  const [showZodiac, setShowZodiac] = useState(true);
  const [showEcliptic, setShowEcliptic] = useState(true);
  const [showMagneticAxis, setShowMagneticAxis] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(false);
  const [showEquator, setShowEquator] = useState(true);
  
  // Pregnancy simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // Days per frame
  const [simulationDay, setSimulationDay] = useState(0); // Days into pregnancy (0-270)
  const [pregnancyStartMonth, setPregnancyStartMonth] = useState(0); // January
  const [pregnancyStartDay, setPregnancyStartDay] = useState(1);
  const [showPregnancyTrail, setShowPregnancyTrail] = useState(true);
  const simulationRef = useRef(null);
  const sunTrailRef = useRef([]);

  // Dynamic magnetic field chart state
  const [showDynamicChart, setShowDynamicChart] = useState(false);
  const [chartPlaying, setChartPlaying] = useState(false);
  const [chartTimeIndex, setChartTimeIndex] = useState(0);
  const [chartTimeScale, setChartTimeScale] = useState('pregnancy'); // 'pregnancy', 'year', 'day', 'storm'
  const [showStormActivity, setShowStormActivity] = useState(true);
  const [stormIntensity, setStormIntensity] = useState('moderate'); // 'quiet', 'moderate', 'strong', 'extreme'
  const chartAnimationRef = useRef(null);

  // Generate realistic magnetic field variation data
  const generateMagneticFieldData = useCallback((location, timeScale, includeStorms, stormLevel) => {
    if (!location) return [];
    
    const baseField = location.F / 1000; // Convert to μT
    const secularRate = (location.dFdt || 0) / 1000; // μT per year
    const data = [];
    
    // Storm parameters based on intensity
    const stormParams = {
      quiet: { maxDrop: 0.02, frequency: 0.02, recovery: 0.1 },
      moderate: { maxDrop: 0.08, frequency: 0.08, recovery: 0.15 },
      strong: { maxDrop: 0.2, frequency: 0.15, recovery: 0.2 },
      extreme: { maxDrop: 0.5, frequency: 0.25, recovery: 0.3 }
    };
    const storm = stormParams[stormLevel] || stormParams.moderate;
    
    // SAA locations are more sensitive to storms
    const saaSensitivity = location.saa ? 1.5 : 1.0;
    
    let points, timeUnit, timeLabel;
    
    switch (timeScale) {
      case 'pregnancy':
        points = 270; // 270 days
        timeUnit = 'day';
        timeLabel = 'Day';
        break;
      case 'year':
        points = 365;
        timeUnit = 'day';
        timeLabel = 'Day';
        break;
      case 'day':
        points = 1440; // Minutes in a day
        timeUnit = 'minute';
        timeLabel = 'Hour';
        break;
      case 'storm':
        points = 720; // 72 hours in 6-minute intervals
        timeUnit = '6min';
        timeLabel = 'Hour';
        break;
      default:
        points = 270;
        timeUnit = 'day';
        timeLabel = 'Day';
    }
    
    let currentStorm = 0;
    let stormRecovery = 0;
    let stormPeak = 0;
    let stormDuration = 0;
    
    for (let i = 0; i < points; i++) {
      let time, timeValue;
      let yearFraction;
      
      switch (timeScale) {
        case 'pregnancy':
        case 'year':
          time = i;
          timeValue = i;
          yearFraction = i / 365;
          break;
        case 'day':
          time = i;
          timeValue = i / 60; // Convert to hours
          yearFraction = 0;
          break;
        case 'storm':
          time = i;
          timeValue = i / 10; // Convert to hours
          yearFraction = 0;
          break;
      }
      
      // Secular variation (slow drift)
      const secularChange = secularRate * yearFraction;
      
      // Daily variation (Sq variation) - ~20-50 nT amplitude
      const hourOfDay = timeScale === 'day' ? i / 60 : (i % 24);
      const sqVariation = 0.03 * Math.sin((hourOfDay - 6) * Math.PI / 12) * (location.saa ? 0.7 : 1.0);
      
      // Storm activity
      let stormEffect = 0;
      if (includeStorms) {
        // Random storm generation
        if (currentStorm === 0 && Math.random() < storm.frequency / points) {
          // Start a new storm
          stormPeak = storm.maxDrop * (0.5 + Math.random() * 0.5) * saaSensitivity;
          stormDuration = Math.floor(20 + Math.random() * 40); // 20-60 time units
          currentStorm = 1;
          stormRecovery = 0;
        }
        
        if (currentStorm > 0) {
          // Storm phases: sudden commencement -> main phase -> recovery
          const stormProgress = currentStorm / stormDuration;
          
          if (stormProgress < 0.1) {
            // Sudden commencement (slight positive spike)
            stormEffect = stormPeak * 0.1 * (stormProgress / 0.1);
          } else if (stormProgress < 0.4) {
            // Main phase (negative drop)
            const mainProgress = (stormProgress - 0.1) / 0.3;
            stormEffect = stormPeak * 0.1 - stormPeak * mainProgress;
          } else {
            // Recovery phase
            const recoveryProgress = (stormProgress - 0.4) / 0.6;
            stormEffect = -stormPeak * (1 - recoveryProgress * storm.recovery * 3);
          }
          
          currentStorm++;
          if (currentStorm > stormDuration) {
            currentStorm = 0;
            stormRecovery = -stormPeak * (1 - storm.recovery * 3);
          }
        } else if (stormRecovery !== 0) {
          // Gradual recovery after storm
          stormEffect = stormRecovery;
          stormRecovery *= 0.98;
          if (Math.abs(stormRecovery) < 0.001) stormRecovery = 0;
        }
      }
      
      // Random noise (instrumental + natural variation)
      const noise = (Math.random() - 0.5) * 0.005;
      
      // Total field
      const totalField = baseField + secularChange + sqVariation + stormEffect + noise;
      
      // Components (simplified)
      const inclination = location.I * Math.PI / 180;
      const H = totalField * Math.cos(inclination);
      const Z = totalField * Math.sin(inclination);
      
      data.push({
        time: timeValue,
        timeIndex: i,
        label: timeScale === 'day' ? `${Math.floor(timeValue)}:${String(Math.floor((timeValue % 1) * 60)).padStart(2, '0')}` :
               timeScale === 'storm' ? `${timeValue.toFixed(1)}h` :
               `Day ${time}`,
        F: totalField,
        baseline: baseField + secularChange,
        secular: secularChange,
        sqVariation: sqVariation * 1000, // Convert to nT for display
        stormEffect: stormEffect * 1000, // Convert to nT
        H: H,
        Z: Math.abs(Z),
        noise: noise * 1000
      });
    }
    
    return data;
  }, []);

  // Generate chart data when location or settings change
  const chartData = useMemo(() => {
    if (!selectedLocation) return [];
    return generateMagneticFieldData(selectedLocation, chartTimeScale, showStormActivity, stormIntensity);
  }, [selectedLocation, chartTimeScale, showStormActivity, stormIntensity, generateMagneticFieldData]);

  // Chart animation effect
  useEffect(() => {
    if (!chartPlaying || chartData.length === 0) {
      if (chartAnimationRef.current) {
        clearInterval(chartAnimationRef.current);
        chartAnimationRef.current = null;
      }
      return;
    }

    const speed = chartTimeScale === 'day' ? 5 : chartTimeScale === 'storm' ? 3 : 1;
    
    chartAnimationRef.current = setInterval(() => {
      setChartTimeIndex(prev => {
        const next = prev + speed;
        if (next >= chartData.length) {
          setChartPlaying(false);
          return chartData.length - 1;
        }
        return next;
      });
    }, 30);

    return () => {
      if (chartAnimationRef.current) {
        clearInterval(chartAnimationRef.current);
      }
    };
  }, [chartPlaying, chartData.length, chartTimeScale]);

  // Reset chart when location changes
  useEffect(() => {
    if (selectedLocation) {
      setShowDynamicChart(true);
      setChartTimeIndex(0);
      setChartPlaying(false);
    }
  }, [selectedLocation]);

  // Chart control functions
  const playChart = () => {
    if (chartTimeIndex >= chartData.length - 1) {
      setChartTimeIndex(0);
    }
    setChartPlaying(true);
  };

  const pauseChart = () => {
    setChartPlaying(false);
  };

  const resetChart = () => {
    setChartPlaying(false);
    setChartTimeIndex(0);
  };

  // Get current chart values
  const currentChartPoint = chartData[chartTimeIndex] || chartData[0] || {};

  const filteredLocations = useMemo(() => {
    if (viewLevel === 'all') return geomagData.locations;
    return geomagData.locations.filter(l => 
      l.type === viewLevel || l.type === 'special' || l.type === 'pole'
    );
  }, [viewLevel]);

  const sunEclipticLon = useMemo(() => getSunEclipticLongitude(month, day), [month, day]);
  const currentZodiac = useMemo(() => getZodiacFromLongitude(sunEclipticLon), [sunEclipticLon]);

  const getFieldAtYear = (loc, y) => loc.F + (loc.dFdt || 0) * (y - 2025);

  // Calculate pregnancy progress info
  const pregnancyInfo = useMemo(() => {
    const totalDays = 270; // ~9 months
    const trimester = Math.floor(simulationDay / 90) + 1;
    const weekNumber = Math.floor(simulationDay / 7) + 1;
    const progress = (simulationDay / totalDays) * 100;
    
    // Calculate current date in simulation
    const startDayOfYear = pregnancyStartMonth * 30.44 + pregnancyStartDay;
    const currentDayOfYear = (startDayOfYear + simulationDay) % 365;
    const currentMonth = Math.floor(currentDayOfYear / 30.44);
    const currentDay = Math.floor(currentDayOfYear % 30.44) + 1;
    
    // Sun's ecliptic longitude at this point
    const simSunLon = getSunEclipticLongitude(currentMonth, currentDay);
    const simZodiac = getZodiacFromLongitude(simSunLon);
    
    return {
      trimester,
      weekNumber,
      progress,
      currentMonth,
      currentDay,
      sunLon: simSunLon,
      zodiac: simZodiac,
      daysRemaining: totalDays - simulationDay
    };
  }, [simulationDay, pregnancyStartMonth, pregnancyStartDay]);

  // Pregnancy simulation effect
  useEffect(() => {
    if (!isSimulating) {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
        simulationRef.current = null;
      }
      return;
    }

    simulationRef.current = setInterval(() => {
      setSimulationDay(prev => {
        const next = prev + simulationSpeed;
        if (next >= 270) {
          setIsSimulating(false);
          return 270;
        }
        return next;
      });
    }, 50); // 20 fps

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [isSimulating, simulationSpeed]);

  // Update date/time based on simulation day
  useEffect(() => {
    if (simulationDay === 0 && !isSimulating) return;
    
    const startDayOfYear = pregnancyStartMonth * 30.44 + pregnancyStartDay;
    const currentDayOfYear = (startDayOfYear + simulationDay) % 365;
    const newMonth = Math.floor(currentDayOfYear / 30.44);
    const newDay = Math.floor(currentDayOfYear % 30.44) + 1;
    
    setMonth(Math.min(11, Math.max(0, newMonth)));
    setDay(Math.min(28, Math.max(1, newDay)));
    
    // Rotate Earth based on simulation (fast forward through days)
    // Each day = 1 full rotation, but we show a portion of the day
    const hourInDay = (simulationDay % 1) * 24;
    setHourAngle(hourInDay);
  }, [simulationDay, pregnancyStartMonth, pregnancyStartDay, isSimulating]);

  // Start pregnancy simulation
  const startSimulation = () => {
    setSimulationDay(0);
    sunTrailRef.current = [];
    setMonth(pregnancyStartMonth);
    setDay(pregnancyStartDay);
    setIsSimulating(true);
  };

  // Pause/Resume simulation
  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  // Reset simulation
  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationDay(0);
    sunTrailRef.current = [];
    setMonth(pregnancyStartMonth);
    setDay(pregnancyStartDay);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020208);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(5, 2, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    fillLight.position.set(-5, -2, -5);
    scene.add(fillLight);

    // === CELESTIAL SPHERE (FIXED - does not rotate with Earth) ===
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);
    celestialGroupRef.current = celestialGroup;

    // Background stars (very far, fixed)
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];
    for (let i = 0; i < 4000; i++) {
      const r = 20 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      const brightness = 0.2 + Math.random() * 0.8;
      const temp = Math.random();
      starColors.push(
        brightness * (0.9 + temp * 0.1),
        brightness * (0.9 + temp * 0.05),
        brightness * (0.85 + temp * 0.15)
      );
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starsMaterial = new THREE.PointsMaterial({ size: 0.06, vertexColors: true });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    celestialGroup.add(stars);

    // === EARTH GROUP (rotates independently) ===
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Apply Earth's axial tilt to the earth group
    earthGroup.rotation.z = AXIAL_TILT * Math.PI / 180;

    // Create Earth sphere
    const earthRadius = 1.5;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Create Earth texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Ocean
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGradient.addColorStop(0, '#1e3a5f');
    oceanGradient.addColorStop(0.5, '#0c2340');
    oceanGradient.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Simplified continents
    ctx.fillStyle = '#1a4a1a';
    ctx.globalAlpha = 0.8;
    
    // Draw continents (centered on Prime Meridian = 512)
    // Africa (lon ~20°E = 532)
    ctx.beginPath();
    ctx.ellipse(532, 256, 50, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe (lon ~10°E = 520, lat ~50°N = ~115)
    ctx.beginPath();
    ctx.ellipse(520, 130, 45, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia (lon ~90°E = 760)
    ctx.beginPath();
    ctx.ellipse(740, 150, 100, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // North America (lon ~100°W = 230)
    ctx.beginPath();
    ctx.ellipse(230, 140, 90, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America (lon ~60°W = 340) - SAA region
    ctx.fillStyle = '#1a3a1a';
    ctx.beginPath();
    ctx.ellipse(340, 320, 45, 85, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight SAA region in red
    ctx.fillStyle = '#3a1515';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(360, 350, 70, 50, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia (lon ~135°E = 890)
    ctx.fillStyle = '#1a4a1a';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(890, 340, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Antarctica
    ctx.fillStyle = '#b8c8d8';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 470, 1024, 42);
    
    // Arctic
    ctx.fillRect(0, 0, 1024, 25);
    
    const earthTexture = new THREE.CanvasTexture(canvas);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 10
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);

    // Geographic grid on Earth
    const gridGeometry = new THREE.SphereGeometry(earthRadius + 0.02, 36, 18);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x4466aa,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    earthGroup.add(grid);

    // Mouse interaction - controls camera orbit, not Earth rotation
    let cameraTheta = 0;
    let cameraPhi = Math.PI / 6;
    let cameraRadius = 6;

    const updateCameraPosition = () => {
      camera.position.x = cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      camera.position.y = cameraRadius * Math.cos(cameraPhi);
      camera.position.z = cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.lookAt(0, 0, 0);
    };

    const onMouseDown = (e) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        
        cameraTheta += deltaX * 0.005;
        cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi + deltaY * 0.005));
        
        updateCameraPosition();
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraRadius = Math.max(3, Math.min(15, cameraRadius + e.deltaY * 0.005));
      updateCameraPosition();
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Earth's rotation based on hour angle
  useEffect(() => {
    if (!earthGroupRef.current) return;
    
    // Earth rotates 360° in 24 hours = 15°/hour
    // Hour angle 0 = midnight at prime meridian facing away from sun
    // Hour angle 12 = noon at prime meridian facing sun
    const rotationY = (hourAngle / 24) * Math.PI * 2;
    
    // Keep axial tilt, only rotate around Y (polar axis)
    earthGroupRef.current.rotation.z = AXIAL_TILT * Math.PI / 180;
    earthGroupRef.current.rotation.y = rotationY;
  }, [hourAngle]);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setHourAngle(h => (h + 0.1) % 24);
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Update Earth markers (magnetic field locations)
  useEffect(() => {
    if (!earthGroupRef.current) return;

    earthMarkersRef.current.forEach(marker => earthGroupRef.current.remove(marker));
    earthMarkersRef.current = [];

    const earthRadius = 1.5;

    // Add location markers
    filteredLocations.forEach(loc => {
      const currentF = getFieldAtYear(loc, year);
      const position = geoToVector3(loc.lat, loc.lon, earthRadius + 0.05);
      
      const size = loc.type === 'continent' ? 0.06 :
                   loc.type === 'special' ? 0.08 :
                   loc.type === 'pole' ? 0.07 :
                   loc.type === 'country' ? 0.045 : 0.035;
      
      const markerGeometry = new THREE.SphereGeometry(size, 12, 12);
      const color = loc.type === 'pole' 
        ? (loc.id.includes('north') ? new THREE.Color(0xff4444) : new THREE.Color(0x4444ff))
        : getFieldColor(currentF);
      
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      marker.userData = loc;
      
      earthGroupRef.current.add(marker);
      earthMarkersRef.current.push(marker);
    });

    // Equator
    if (showEquator) {
      const equatorGeometry = new THREE.TorusGeometry(earthRadius + 0.02, 0.008, 8, 100);
      const equatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
      equator.rotation.x = Math.PI / 2;
      earthGroupRef.current.add(equator);
      earthMarkersRef.current.push(equator);
    }

    // Magnetic axis
    if (showMagneticAxis) {
      const northPolePos = geoToVector3(86.5, -156, earthRadius + 0.3);
      const southPolePos = geoToVector3(-64, 136, earthRadius + 0.3);
      
      const axisPoints = [
        southPolePos.clone().multiplyScalar(1.1),
        new THREE.Vector3(0, 0, 0),
        northPolePos.clone().multiplyScalar(1.1)
      ];
      const axisGeometry = new THREE.BufferGeometry().setFromPoints(axisPoints);
      const axisMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.7 });
      const axisLine = new THREE.Line(axisGeometry, axisMaterial);
      earthGroupRef.current.add(axisLine);
      earthMarkersRef.current.push(axisLine);
    }

    // Field lines
    if (showFieldLines) {
      const fieldLineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x6688ff, 
        transparent: true, 
        opacity: 0.25 
      });
      
      for (let lon = 0; lon < 360; lon += 45) {
        const points = [];
        for (let t = 0; t <= 1; t += 0.025) {
          const lat = -85 + t * 170;
          const r = earthRadius + 0.1 + 0.4 * Math.sin(t * Math.PI);
          points.push(geoToVector3(lat, lon, r));
        }
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeom, fieldLineMaterial);
        earthGroupRef.current.add(line);
        earthMarkersRef.current.push(line);
      }
    }
  }, [filteredLocations, year, showMagneticAxis, showFieldLines, showEquator]);

  // Update celestial sphere (zodiac - fixed, not rotating with Earth)
  useEffect(() => {
    if (!celestialGroupRef.current) return;

    celestialMarkersRef.current.forEach(marker => celestialGroupRef.current.remove(marker));
    celestialMarkersRef.current = [];

    const celestialRadius = 3.2;

    // Ecliptic circle
    if (showEcliptic) {
      const eclipticPoints = [];
      for (let lon = 0; lon <= 360; lon += 2) {
        eclipticPoints.push(eclipticToVector3(lon, 0, celestialRadius));
      }
      const eclipticGeometry = new THREE.BufferGeometry().setFromPoints(eclipticPoints);
      const eclipticMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffaa00, 
        transparent: true, 
        opacity: 0.6 
      });
      const eclipticLine = new THREE.LineLoop(eclipticGeometry, eclipticMaterial);
      celestialGroupRef.current.add(eclipticLine);
      celestialMarkersRef.current.push(eclipticLine);

      // Celestial equator for reference (where Earth's equator projects onto sky)
      const cePoints = [];
      for (let lon = 0; lon <= 360; lon += 2) {
        cePoints.push(geoToVector3(0, lon, celestialRadius));
      }
      const ceGeometry = new THREE.BufferGeometry().setFromPoints(cePoints);
      const ceMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00aaff, 
        transparent: true, 
        opacity: 0.3 
      });
      const ceLine = new THREE.LineLoop(ceGeometry, ceMaterial);
      celestialGroupRef.current.add(ceLine);
      celestialMarkersRef.current.push(ceLine);
    }

    // Zodiac constellations
    if (showZodiac) {
      zodiacSigns.forEach((sign) => {
        const isCurrentSign = sign.name === currentZodiac?.name;
        
        // Constellation center marker
        const centerPos = eclipticToVector3(sign.eclipticLon + 15, 0, celestialRadius);
        const glowSize = isCurrentSign ? 0.25 : 0.18;
        const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: sign.color,
          transparent: true,
          opacity: isCurrentSign ? 0.6 : 0.25
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(centerPos);
        glow.userData = { ...sign, isZodiac: true };
        celestialGroupRef.current.add(glow);
        celestialMarkersRef.current.push(glow);

        // Individual stars in constellation
        sign.stars.forEach(([starLonOffset, starLat]) => {
          const starLon = sign.eclipticLon + starLonOffset;
          const starPos = eclipticToVector3(starLon, starLat, celestialRadius);
          const starSize = 0.025 + Math.random() * 0.015;
          const starGeom = new THREE.SphereGeometry(starSize, 8, 8);
          const starMat = new THREE.MeshBasicMaterial({ 
            color: isCurrentSign ? 0xffffcc : 0xffffff,
            transparent: true,
            opacity: isCurrentSign ? 1.0 : 0.7
          });
          const star = new THREE.Mesh(starGeom, starMat);
          star.position.copy(starPos);
          celestialGroupRef.current.add(star);
          celestialMarkersRef.current.push(star);
        });

        // Connect stars with constellation lines
        if (sign.stars.length > 1) {
          const linePoints = sign.stars.map(([sLonOffset, sLat]) => 
            eclipticToVector3(sign.eclipticLon + sLonOffset, sLat, celestialRadius)
          );
          const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({ 
            color: sign.color, 
            transparent: true, 
            opacity: isCurrentSign ? 0.5 : 0.2 
          });
          const line = new THREE.Line(lineGeom, lineMat);
          celestialGroupRef.current.add(line);
          celestialMarkersRef.current.push(line);
        }
      });

      // Sun marker on ecliptic
      const sunPos = eclipticToVector3(sunEclipticLon, 0, celestialRadius - 0.15);
      const sunGeometry = new THREE.SphereGeometry(0.15, 20, 20);
      const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
      const sun = new THREE.Mesh(sunGeometry, sunMaterial);
      sun.position.copy(sunPos);
      celestialGroupRef.current.add(sun);
      celestialMarkersRef.current.push(sun);

      // Sun glow
      const sunGlowGeom = new THREE.SphereGeometry(0.25, 16, 16);
      const sunGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3
      });
      const sunGlow = new THREE.Mesh(sunGlowGeom, sunGlowMat);
      sunGlow.position.copy(sunPos);
      celestialGroupRef.current.add(sunGlow);
      celestialMarkersRef.current.push(sunGlow);

      // Vernal equinox marker (0° ecliptic longitude)
      const vernalPos = eclipticToVector3(0, 0, celestialRadius + 0.1);
      const vernalGeom = new THREE.OctahedronGeometry(0.08);
      const vernalMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      const vernal = new THREE.Mesh(vernalGeom, vernalMat);
      vernal.position.copy(vernalPos);
      celestialGroupRef.current.add(vernal);
      celestialMarkersRef.current.push(vernal);
    }
  }, [showZodiac, showEcliptic, sunEclipticLon, currentZodiac]);

  // Handle clicks
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Check celestial markers (zodiac)
      const celestialIntersects = raycaster.intersectObjects(celestialMarkersRef.current);
      for (const intersect of celestialIntersects) {
        if (intersect.object.userData?.isZodiac) {
          setSelectedZodiac(intersect.object.userData);
          setSelectedLocation(null);
          return;
        }
      }

      // Check Earth markers
      const earthIntersects = raycaster.intersectObjects(earthMarkersRef.current);
      for (const intersect of earthIntersects) {
        if (intersect.object.userData?.name) {
          setSelectedLocation(intersect.object.userData);
          setSelectedZodiac(null);
          return;
        }
      }
    };

    rendererRef.current.domElement.addEventListener('click', onClick);
    return () => {
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('click', onClick);
      }
    };
  }, []);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 p-4 rounded-lg mb-4 border border-indigo-800">
          <h1 className="text-2xl font-light">🌍 Geomagnetic Field & Celestial Zodiac</h1>
          <p className="text-purple-300 text-sm mt-1">
            Accurate astronomical positioning · Earth rotates beneath fixed celestial sphere · Ecliptic tilted 23.4° from equator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Controls Panel */}
          <div className="bg-gray-900 p-4 rounded-lg border border-indigo-800 space-y-4">
            <h2 className="text-blue-300 font-medium border-b border-indigo-800 pb-2">Time & Position</h2>
            
            <div>
              <label className="text-xs text-blue-400 uppercase tracking-wide">Date: {monthNames[month]} {day}</label>
              <div className="flex gap-2 mt-1">
                <select 
                  value={month} 
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="flex-1 bg-gray-800 border border-indigo-700 rounded p-2 text-white text-sm"
                >
                  {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <input 
                  type="number" min="1" max="28" value={day}
                  onChange={(e) => setDay(parseInt(e.target.value) || 1)}
                  className="w-16 bg-gray-800 border border-indigo-700 rounded p-2 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-blue-400 uppercase tracking-wide">
                Hour (UTC): {hourAngle.toFixed(1)}h
              </label>
              <input 
                type="range" min="0" max="24" step="0.5" value={hourAngle}
                onChange={(e) => setHourAngle(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Controls Earth's rotation (Prime Meridian facing)</p>
            </div>

            <div>
              <label className="text-xs text-blue-400 uppercase tracking-wide">Year: {year}</label>
              <input 
                type="range" min="2020" max="2030" value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <div>
              <label className="text-xs text-blue-400 uppercase tracking-wide">Locations</label>
              <select 
                value={viewLevel} 
                onChange={(e) => setViewLevel(e.target.value)}
                className="w-full mt-1 bg-gray-800 border border-indigo-700 rounded p-2 text-white text-sm"
              >
                <option value="continent">Continents</option>
                <option value="country">Countries</option>
                <option value="capital">Capitals</option>
                <option value="all">All Locations</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-indigo-800">
              <h3 className="text-xs text-blue-400 uppercase tracking-wide">Display Options</h3>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} className="rounded" />
                Auto-rotate Earth
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showZodiac} onChange={(e) => setShowZodiac(e.target.checked)} className="rounded" />
                Zodiac constellations
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showEcliptic} onChange={(e) => setShowEcliptic(e.target.checked)} className="rounded" />
                Ecliptic & Equator
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showEquator} onChange={(e) => setShowEquator(e.target.checked)} className="rounded" />
                Earth's Equator
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showMagneticAxis} onChange={(e) => setShowMagneticAxis(e.target.checked)} className="rounded" />
                Magnetic Axis
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showFieldLines} onChange={(e) => setShowFieldLines(e.target.checked)} className="rounded" />
                Field Lines
              </label>
            </div>

            {/* Current Sun Position */}
            <div className="pt-2 border-t border-indigo-800">
              <div className="text-xs text-purple-400 uppercase tracking-wide mb-2">Sun Position</div>
              <div className="bg-purple-950/50 p-3 rounded border border-purple-800 text-center">
                <div className="text-4xl" style={{ color: `#${currentZodiac?.color.toString(16).padStart(6, '0')}` }}>
                  {currentZodiac?.symbol}
                </div>
                <div className="text-lg font-medium">{currentZodiac?.name}</div>
                <div className="text-sm text-purple-300">{currentZodiac?.element} Sign</div>
                <div className="text-xs text-gray-400 mt-1">Ecliptic: {sunEclipticLon.toFixed(1)}°</div>
              </div>
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-indigo-800">
              <div className="text-xs text-blue-400 uppercase tracking-wide mb-2">Magnetic Field</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Strong</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Moderate</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Weak</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> SAA</div>
              </div>
            </div>
          </div>

          {/* Pregnancy Simulation Panel */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-green-950 to-teal-950 p-4 rounded-lg border border-green-700 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-green-300 font-medium flex items-center gap-2">
                    🤰 9-Month Pregnancy Simulation
                    {isSimulating && <span className="text-xs bg-green-600 px-2 py-0.5 rounded animate-pulse">RUNNING</span>}
                  </h3>
                  <p className="text-green-400/70 text-xs mt-1">
                    Watch Earth rotate and Sun traverse the zodiac over a full pregnancy
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* Start Date */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-green-400">Start:</label>
                    <select 
                      value={pregnancyStartMonth}
                      onChange={(e) => setPregnancyStartMonth(parseInt(e.target.value))}
                      disabled={isSimulating}
                      className="bg-green-900/50 border border-green-700 rounded px-2 py-1 text-sm text-white"
                    >
                      {monthNames.map((m, i) => <option key={i} value={i}>{m.slice(0,3)}</option>)}
                    </select>
                    <input 
                      type="number" min="1" max="28" 
                      value={pregnancyStartDay}
                      onChange={(e) => setPregnancyStartDay(parseInt(e.target.value) || 1)}
                      disabled={isSimulating}
                      className="w-12 bg-green-900/50 border border-green-700 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                  
                  {/* Speed Control */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-green-400">Speed:</label>
                    <select 
                      value={simulationSpeed}
                      onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                      className="bg-green-900/50 border border-green-700 rounded px-2 py-1 text-sm text-white"
                    >
                      <option value={0.5}>0.5x (Slow)</option>
                      <option value={1}>1x (Normal)</option>
                      <option value={2}>2x (Fast)</option>
                      <option value={5}>5x (Very Fast)</option>
                      <option value={10}>10x (Ultra)</option>
                    </select>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    {simulationDay === 0 ? (
                      <button
                        onClick={startSimulation}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                      >
                        ▶️ Start Simulation
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={toggleSimulation}
                          className={`${isSimulating ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'} text-white px-3 py-2 rounded font-medium transition-colors`}
                        >
                          {isSimulating ? '⏸️ Pause' : '▶️ Resume'}
                        </button>
                        <button
                          onClick={resetSimulation}
                          className="bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded font-medium transition-colors"
                        >
                          🔄 Reset
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar and Stats */}
              {(simulationDay > 0 || isSimulating) && (
                <div className="mt-4 space-y-3">
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                      {/* Trimester markers */}
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 border-r border-gray-600"></div>
                        <div className="flex-1 border-r border-gray-600"></div>
                        <div className="flex-1"></div>
                      </div>
                      {/* Progress fill */}
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 transition-all duration-100 relative"
                        style={{ width: `${pregnancyInfo.progress}%` }}
                      >
                        <div className="absolute right-0 top-0 h-full w-1 bg-white animate-pulse"></div>
                      </div>
                    </div>
                    {/* Trimester labels */}
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                      <span>T1</span>
                      <span>T2</span>
                      <span>T3</span>
                      <span>Birth</span>
                    </div>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    <div className="bg-gray-900/50 p-2 rounded text-center">
                      <div className="text-lg font-light text-white">Day {Math.floor(simulationDay)}</div>
                      <div className="text-xs text-green-400">of 270</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center">
                      <div className="text-lg font-light text-white">Week {pregnancyInfo.weekNumber}</div>
                      <div className="text-xs text-green-400">of 38</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center">
                      <div className="text-lg font-light text-white">Trimester {pregnancyInfo.trimester}</div>
                      <div className="text-xs text-green-400">{['1st', '2nd', '3rd'][pregnancyInfo.trimester - 1]}</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center">
                      <div className="text-lg font-light text-white">{monthNames[pregnancyInfo.currentMonth]?.slice(0,3)} {pregnancyInfo.currentDay}</div>
                      <div className="text-xs text-green-400">Current Date</div>
                    </div>
                    <div className="bg-purple-900/50 p-2 rounded text-center">
                      <div className="text-2xl">{pregnancyInfo.zodiac?.symbol}</div>
                      <div className="text-xs text-purple-400">{pregnancyInfo.zodiac?.name}</div>
                    </div>
                    <div className="bg-gray-900/50 p-2 rounded text-center">
                      <div className="text-lg font-light text-white">{pregnancyInfo.sunLon.toFixed(0)}°</div>
                      <div className="text-xs text-yellow-400">Sun Position</div>
                    </div>
                  </div>
                  
                  {/* Zodiac Journey Visualization */}
                  <div className="bg-gray-900/30 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-2">Sun's journey through the zodiac:</div>
                    <div className="flex gap-0.5">
                      {zodiacSigns.map((sign, idx) => {
                        const startLon = sign.eclipticLon;
                        const endLon = sign.eclipticLon + 30;
                        const sunInSign = pregnancyInfo.sunLon >= startLon && pregnancyInfo.sunLon < endLon;
                        const startSunLon = getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay);
                        const startZodiacIdx = Math.floor(startSunLon / 30);
                        
                        // Calculate if we've passed through this sign
                        let passed = false;
                        if (simulationDay > 0) {
                          const daysIntoSign = ((pregnancyInfo.sunLon - startSunLon + 360) % 360);
                          const signStartFromStart = ((startLon - startSunLon + 360) % 360);
                          passed = signStartFromStart < daysIntoSign || sunInSign;
                        }
                        
                        return (
                          <div 
                            key={sign.name}
                            className={`flex-1 h-8 rounded flex items-center justify-center text-sm transition-all ${
                              sunInSign 
                                ? 'ring-2 ring-yellow-400 bg-yellow-900/50' 
                                : passed 
                                  ? 'bg-green-900/30' 
                                  : 'bg-gray-800/50'
                            }`}
                            title={sign.name}
                          >
                            <span style={{ color: `#${sign.color.toString(16).padStart(6, '0')}` }}>
                              {sign.symbol}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Globe */}
            <div className="bg-gray-900 rounded-lg border border-indigo-800 overflow-hidden">
              <div ref={containerRef} className="w-full" style={{ height: 600 }} />
              <div className="p-2 bg-gray-950/50 text-xs text-gray-400 text-center">
                Drag to orbit camera · Scroll to zoom · Click markers for details · 
                <span className="text-yellow-400"> Orange ring</span> = Ecliptic · 
                <span className="text-blue-400"> Blue ring</span> = Celestial Equator
              </div>
            </div>
          </div>
        </div>

        {/* Zodiac Belt */}
        <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-purple-800">
          <h3 className="text-purple-300 font-medium mb-3">Zodiac Belt · Ecliptic Longitude</h3>
          <div className="flex flex-wrap justify-center gap-1">
            {zodiacSigns.map((sign) => {
              const isCurrentSign = sign.name === currentZodiac?.name;
              return (
                <button
                  key={sign.name}
                  onClick={() => { setSelectedZodiac(sign); setSelectedLocation(null); }}
                  className={`px-2 py-2 rounded text-center transition-all min-w-[70px] ${
                    isCurrentSign
                      ? 'ring-2 ring-yellow-400 bg-yellow-900/40'
                      : selectedZodiac?.name === sign.name
                      ? 'ring-2 ring-purple-400 bg-purple-900/40'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-2xl" style={{ color: `#${sign.color.toString(16).padStart(6, '0')}` }}>
                    {sign.symbol}
                  </div>
                  <div className="text-xs">{sign.name}</div>
                  <div className="text-xs text-gray-500">{sign.eclipticLon}°</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Location */}
        {selectedLocation && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-indigo-800">
            <div className="flex justify-between items-start">
              <h2 className="text-blue-300 font-medium">
                📍 {selectedLocation.name}
                {selectedLocation.saa && <span className="ml-2 text-red-400 text-sm">⚠️ SAA Region</span>}
                {selectedLocation.auroral && <span className="ml-2 text-purple-400 text-sm">🌌 Auroral</span>}
              </h2>
              <button onClick={() => setSelectedLocation(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-3">
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{getFieldAtYear(selectedLocation, year).toFixed(0)}</div>
                <div className="text-xs text-blue-400">Field (nT)</div>
              </div>
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className={`text-xl font-light ${(selectedLocation.dFdt || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(selectedLocation.dFdt || 0) >= 0 ? '+' : ''}{(selectedLocation.dFdt || 0).toFixed(1)}
                </div>
                <div className="text-xs text-blue-400">dF/dt</div>
              </div>
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{(selectedLocation.I || 0).toFixed(1)}°</div>
                <div className="text-xs text-blue-400">Inclination</div>
              </div>
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{(selectedLocation.D || 0).toFixed(1)}°</div>
                <div className="text-xs text-blue-400">Declination</div>
              </div>
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedLocation.lat?.toFixed(1)}°</div>
                <div className="text-xs text-blue-400">Latitude</div>
              </div>
              <div className="bg-indigo-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedLocation.lon?.toFixed(1)}°</div>
                <div className="text-xs text-blue-400">Longitude</div>
              </div>
            </div>
            
            {/* Pregnancy Exposure Analysis */}
            {(simulationDay > 0 || isSimulating) && (
              <div className="mt-4 bg-green-950/30 p-3 rounded border border-green-800">
                <h4 className="text-green-300 text-sm font-medium mb-2">🤰 Pregnancy Magnetic Exposure at {selectedLocation.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className="text-lg font-light text-white">
                      {getFieldAtYear(selectedLocation, year + (simulationDay / 365)).toFixed(0)}
                    </div>
                    <div className="text-xs text-green-400">Current Field</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className={`text-lg font-light ${(selectedLocation.dFdt || 0) * 0.75 >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((selectedLocation.dFdt || 0) * 0.75) >= 0 ? '+' : ''}{((selectedLocation.dFdt || 0) * 0.75).toFixed(1)}
                    </div>
                    <div className="text-xs text-green-400">9-mo Change (nT)</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className="text-lg font-light text-white">
                      {((selectedLocation.dFdt || 0) * (simulationDay / 365)).toFixed(1)}
                    </div>
                    <div className="text-xs text-green-400">Δ So Far (nT)</div>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded text-center">
                    <div className="text-lg font-light text-white">
                      {(((selectedLocation.dFdt || 0) / selectedLocation.F) * 100 * 0.75).toFixed(4)}%
                    </div>
                    <div className="text-xs text-green-400">9-mo Δ%</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Storm sensitivity: 100 nT storm = {((100 / selectedLocation.F) * 100).toFixed(3)}% perturbation
                  {selectedLocation.saa && <span className="text-red-400 ml-2">(~1.5× higher than mid-latitudes)</span>}
                </div>
              </div>
            )}
            
            <div className="mt-3 bg-gray-950 p-2 rounded font-mono text-cyan-400 text-sm">
              F(t) = {selectedLocation.F?.toFixed(1)} + {(selectedLocation.dFdt || 0).toFixed(2)}(t - 2025) nT
            </div>
          </div>
        )}

        {/* Dynamic Magnetic Field Variation Chart */}
        {selectedLocation && showDynamicChart && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-cyan-800">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-cyan-300 font-medium flex items-center gap-2">
                  📈 Dynamic Magnetic Field Variation
                  {chartPlaying && <span className="text-xs bg-cyan-600 px-2 py-0.5 rounded animate-pulse">PLAYING</span>}
                </h2>
                <p className="text-cyan-400/70 text-xs mt-1">
                  Real-time magnetic field changes at <strong>{selectedLocation.name}</strong> ({(selectedLocation.F / 1000).toFixed(2)} μT baseline)
                </p>
              </div>
              
              <button 
                onClick={() => setShowDynamicChart(false)}
                className="text-gray-500 hover:text-white"
              >✕</button>
            </div>

            {/* Chart Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-950 rounded-lg">
              {/* Time Scale */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-cyan-400">Time Scale:</label>
                <select 
                  value={chartTimeScale}
                  onChange={(e) => { setChartTimeScale(e.target.value); setChartTimeIndex(0); setChartPlaying(false); }}
                  className="bg-gray-800 border border-cyan-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="pregnancy">9-Month Pregnancy</option>
                  <option value="year">Full Year</option>
                  <option value="day">24-Hour Day</option>
                  <option value="storm">72-Hour Storm Event</option>
                </select>
              </div>

              {/* Storm Activity */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-cyan-400 flex items-center gap-1">
                  <input 
                    type="checkbox" 
                    checked={showStormActivity}
                    onChange={(e) => setShowStormActivity(e.target.checked)}
                    className="rounded"
                  />
                  Storms
                </label>
                {showStormActivity && (
                  <select 
                    value={stormIntensity}
                    onChange={(e) => setStormIntensity(e.target.value)}
                    className="bg-gray-800 border border-cyan-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="quiet">Quiet</option>
                    <option value="moderate">Moderate</option>
                    <option value="strong">Strong</option>
                    <option value="extreme">Extreme (G4+)</option>
                  </select>
                )}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2 ml-auto">
                {!chartPlaying ? (
                  <button
                    onClick={playChart}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                  >
                    ▶️ Play
                  </button>
                ) : (
                  <button
                    onClick={pauseChart}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                  >
                    ⏸️ Pause
                  </button>
                )}
                <button
                  onClick={resetChart}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Current Values Display */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className="text-xl font-light text-white">{currentChartPoint.F?.toFixed(4) || '-'}</div>
                <div className="text-xs text-cyan-400">Total F (μT)</div>
              </div>
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className="text-xl font-light text-white">{((currentChartPoint.F - currentChartPoint.baseline) * 1000)?.toFixed(1) || '-'}</div>
                <div className="text-xs text-cyan-400">ΔF (nT)</div>
              </div>
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className={`text-xl font-light ${(currentChartPoint.stormEffect || 0) < -50 ? 'text-red-400' : (currentChartPoint.stormEffect || 0) < -20 ? 'text-orange-400' : 'text-green-400'}`}>
                  {currentChartPoint.stormEffect?.toFixed(1) || '0'}
                </div>
                <div className="text-xs text-cyan-400">Storm (nT)</div>
              </div>
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className="text-xl font-light text-white">{currentChartPoint.sqVariation?.toFixed(1) || '-'}</div>
                <div className="text-xs text-cyan-400">Sq Var (nT)</div>
              </div>
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className="text-xl font-light text-white">{currentChartPoint.H?.toFixed(4) || '-'}</div>
                <div className="text-xs text-cyan-400">H (μT)</div>
              </div>
              <div className="bg-cyan-950/50 p-2 rounded text-center">
                <div className="text-xl font-light text-white">{currentChartPoint.label || '-'}</div>
                <div className="text-xs text-cyan-400">Time</div>
              </div>
            </div>

            {/* Progress Slider */}
            <div className="mb-4">
              <input 
                type="range"
                min="0"
                max={chartData.length - 1}
                value={chartTimeIndex}
                onChange={(e) => { setChartTimeIndex(parseInt(e.target.value)); setChartPlaying(false); }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{chartData[0]?.label || 'Start'}</span>
                <span>{chartData[Math.floor(chartData.length / 2)]?.label || 'Middle'}</span>
                <span>{chartData[chartData.length - 1]?.label || 'End'}</span>
              </div>
            </div>

            {/* Main Chart */}
            <div className="bg-gray-950 p-2 rounded-lg" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="fieldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="stormGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(value) => {
                      if (chartTimeScale === 'day') return `${Math.floor(value)}h`;
                      if (chartTimeScale === 'storm') return `${value.toFixed(0)}h`;
                      return `D${Math.floor(value)}`;
                    }}
                  />
                  <YAxis 
                    yAxisId="field"
                    stroke="#06b6d4"
                    tick={{ fill: '#06b6d4', fontSize: 10 }}
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => value.toFixed(3)}
                    label={{ value: 'μT', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="storm"
                    orientation="right"
                    stroke="#ef4444"
                    tick={{ fill: '#ef4444', fontSize: 10 }}
                    domain={['auto', 'auto']}
                    label={{ value: 'nT', angle: 90, position: 'insideRight', fill: '#ef4444', fontSize: 12 }}
                  />
                  
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #0e7490',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => {
                      if (name === 'F') return [`${value.toFixed(4)} μT`, 'Total Field'];
                      if (name === 'baseline') return [`${value.toFixed(4)} μT`, 'Baseline'];
                      if (name === 'stormEffect') return [`${value.toFixed(1)} nT`, 'Storm Effect'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Time: ${chartData[label]?.label || label}`}
                  />
                  
                  <Legend />
                  
                  {/* Reference line for baseline */}
                  <ReferenceLine 
                    yAxisId="field"
                    y={selectedLocation.F / 1000} 
                    stroke="#22c55e" 
                    strokeDasharray="5 5"
                    label={{ value: 'Baseline', fill: '#22c55e', fontSize: 10 }}
                  />
                  
                  {/* Current time indicator */}
                  {chartTimeIndex > 0 && (
                    <ReferenceArea
                      yAxisId="field"
                      x1={0}
                      x2={chartData[chartTimeIndex]?.time || 0}
                      fill="#06b6d4"
                      fillOpacity={0.1}
                    />
                  )}
                  
                  {/* Baseline trend line */}
                  <Line 
                    yAxisId="field"
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="#22c55e" 
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="Secular Trend"
                  />
                  
                  {/* Total field line */}
                  <Area 
                    yAxisId="field"
                    type="monotone" 
                    dataKey="F" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fill="url(#fieldGradient)"
                    dot={false}
                    name="Total Field (F)"
                  />
                  
                  {/* Storm effect on secondary axis */}
                  {showStormActivity && (
                    <Line 
                      yAxisId="storm"
                      type="monotone" 
                      dataKey="stormEffect" 
                      stroke="#ef4444" 
                      strokeWidth={1.5}
                      dot={false}
                      name="Storm Effect"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend/Info */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-950 p-2 rounded">
                <div className="text-cyan-400 font-medium mb-1">📊 Total Field (F)</div>
                <p className="text-gray-400">Combined magnetic field strength including all variations. The cyan area shows the instantaneous field value in microtesla (μT).</p>
              </div>
              <div className="bg-gray-950 p-2 rounded">
                <div className="text-green-400 font-medium mb-1">📈 Secular Trend</div>
                <p className="text-gray-400">Long-term field change: {(selectedLocation.dFdt || 0) >= 0 ? '+' : ''}{(selectedLocation.dFdt || 0).toFixed(1)} nT/year. {selectedLocation.saa ? 'SAA region - field increasing as anomaly evolves.' : ''}</p>
              </div>
              <div className="bg-gray-950 p-2 rounded">
                <div className="text-red-400 font-medium mb-1">🌩️ Storm Activity</div>
                <p className="text-gray-400">
                  Geomagnetic storm effects (main phase depression). 
                  {selectedLocation.saa && <span className="text-orange-400"> SAA locations experience ~1.5× stronger relative perturbations.</span>}
                </p>
              </div>
            </div>

            {/* Statistics Summary */}
            {chartData.length > 0 && (
              <div className="mt-4 bg-cyan-950/30 p-3 rounded border border-cyan-800">
                <h4 className="text-cyan-300 text-sm font-medium mb-2">📉 Period Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Min F:</span>
                    <span className="text-white ml-2">{Math.min(...chartData.map(d => d.F)).toFixed(4)} μT</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max F:</span>
                    <span className="text-white ml-2">{Math.max(...chartData.map(d => d.F)).toFixed(4)} μT</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Range:</span>
                    <span className="text-white ml-2">{((Math.max(...chartData.map(d => d.F)) - Math.min(...chartData.map(d => d.F))) * 1000).toFixed(1)} nT</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Secular Δ:</span>
                    <span className={`ml-2 ${(chartData[chartData.length-1]?.secular || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {((chartData[chartData.length-1]?.secular || 0) * 1000).toFixed(1)} nT
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Storm:</span>
                    <span className="text-red-400 ml-2">{Math.min(...chartData.map(d => d.stormEffect)).toFixed(1)} nT</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Zodiac */}
        {selectedZodiac && (
          <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-purple-800">
            <div className="flex justify-between items-start">
              <h2 className="text-purple-300 font-medium">
                <span style={{ color: `#${selectedZodiac.color.toString(16).padStart(6, '0')}` }}>
                  {selectedZodiac.symbol}
                </span> {selectedZodiac.name}
                {selectedZodiac.name === currentZodiac?.name && 
                  <span className="ml-2 text-yellow-400 text-sm">☀️ Sun is here</span>}
              </h2>
              <button onClick={() => setSelectedZodiac(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-purple-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedZodiac.eclipticLon}°</div>
                <div className="text-xs text-purple-400">Start Longitude</div>
              </div>
              <div className="bg-purple-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedZodiac.eclipticLon + 30}°</div>
                <div className="text-xs text-purple-400">End Longitude</div>
              </div>
              <div className="bg-purple-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedZodiac.element}</div>
                <div className="text-xs text-purple-400">Element</div>
              </div>
              <div className="bg-purple-950/50 p-2 rounded text-center">
                <div className="text-xl font-light">{selectedZodiac.stars.length}</div>
                <div className="text-xs text-purple-400">Major Stars</div>
              </div>
            </div>
            
            {/* Pregnancy Zodiac Journey */}
            {(simulationDay > 0 || isSimulating) && (
              <div className="mt-4 bg-green-950/30 p-3 rounded border border-green-800">
                <h4 className="text-green-300 text-sm font-medium mb-2">🌟 Zodiac Journey During Pregnancy</h4>
                <p className="text-sm text-gray-300">
                  The Sun travels approximately <strong className="text-yellow-400">270°</strong> along the ecliptic during a 9-month pregnancy 
                  (about {Math.round(270/30)} zodiac signs).
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  <div>Started: {zodiacSigns[Math.floor(getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay) / 30)]?.symbol} {zodiacSigns[Math.floor(getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay) / 30)]?.name} ({getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay).toFixed(0)}°)</div>
                  <div>Current: {pregnancyInfo.zodiac?.symbol} {pregnancyInfo.zodiac?.name} ({pregnancyInfo.sunLon.toFixed(0)}°)</div>
                  <div>End (projected): {zodiacSigns[Math.floor(((getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay) + 270) % 360) / 30)]?.symbol} {zodiacSigns[Math.floor(((getSunEclipticLongitude(pregnancyStartMonth, pregnancyStartDay) + 270) % 360) / 30)]?.name}</div>
                </div>
              </div>
            )}
            
            <div className="mt-3 bg-gray-950 p-3 rounded text-sm text-gray-300">
              <strong>Astronomical Note:</strong> The zodiac constellations lie along the ecliptic plane, 
              which is tilted {AXIAL_TILT}° from Earth's equator. As Earth rotates beneath the fixed stars, 
              different longitudes face different parts of the zodiac. The Sun appears in {selectedZodiac.name} from 
              ecliptic longitude {selectedZodiac.eclipticLon}° to {selectedZodiac.eclipticLon + 30}°.
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-900 p-3 rounded border border-gray-800">
            <h4 className="text-yellow-400 font-medium mb-1">🌞 Ecliptic (Orange)</h4>
            <p className="text-gray-400">The Sun's apparent path through the sky, tilted 23.4° from the equator. The zodiac constellations lie along this plane.</p>
          </div>
          <div className="bg-gray-900 p-3 rounded border border-gray-800">
            <h4 className="text-blue-400 font-medium mb-1">🌐 Celestial Equator (Blue)</h4>
            <p className="text-gray-400">Earth's equator projected onto the sky. The ecliptic crosses it at the equinoxes (Aries 0° and Libra 180°).</p>
          </div>
          <div className="bg-gray-900 p-3 rounded border border-gray-800">
            <h4 className="text-pink-400 font-medium mb-1">🧲 Magnetic Axis (Pink)</h4>
            <p className="text-gray-400">Earth's magnetic poles are offset ~11° from the geographic poles, creating the SAA where the field is weakest.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
