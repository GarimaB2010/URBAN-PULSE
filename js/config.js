JavaScript


// ==============================================================================
// UrbanPulse - Configuration & Material Palette Constants
// ==============================================================================

export const NODE_TYPES = {
  CONCRETE_SKYSCRAPER: {
    id: 'CONCRETE_SKYSCRAPER',
    name: 'Skyscraper',
    icon: '🏙️',
    albedo: 0.15,
    thermalMass: 85.0,
    heatMod: 8.5,
    coolingOffset: 0.0,
    color: '#64748b'
  },
  ASPHALT_ROAD: {
    id: 'ASPHALT_ROAD',
    name: 'Asphalt Road',
    icon: '🛣️',
    albedo: 0.05,
    thermalMass: 40.0,
    heatMod: 12.0,
    coolingOffset: 0.0,
    color: '#334155'
  },
  UTILITY_HUB: {
    id: 'UTILITY_HUB',
    name: 'Utility Hub',
    icon: '⚡',
    albedo: 0.25,
    thermalMass: 55.0,
    heatMod: 4.0,
    maxThreshold: 48.5,
    baseCost: 5000,
    escalationCost: 1500,
    baseLoad: 120.0,
    color: '#eab308'
  },
  TREE_CANOPY: {
    id: 'TREE_CANOPY',
    name: 'Tree Canopy',
    icon: '🌳',
    albedo: 0.35,
    thermalMass: 30.0,
    heatMod: -7.5,
    coolingOffset: -3.5,
    color: '#22c55e'
  },
  POCKET_PARK: {
    id: 'POCKET_PARK',
    name: 'Pocket Park',
    icon: '🏞️',
    albedo: 0.28,
    thermalMass: 45.0,
    heatMod: -4.5,
    coolingOffset: -2.0,
    color: '#10b981'
  },
  WATER_BODY: {
    id: 'WATER_BODY',
    name: 'Water Body',
    icon: '💧',
    albedo: 0.08,
    thermalMass: 240.0,
    heatMod: -9.0,
    coolingOffset: -5.0,
    color: '#0284c7'
  }
};
