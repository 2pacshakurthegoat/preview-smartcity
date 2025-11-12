import { Agent, Building, Position, WorldState, SimulationEvent, Road, RoadStatus, AgentStatus, DirectorInstruction } from '@/types/simulation';
import { findPath, getNextPosition } from './pathfinding';

const GRID_SIZE = 100; // MASSIVE city grid

// Car colors
const CAR_COLORS = ['#00D9FF', '#00FFB3', '#FF006E', '#FFBE0B', '#FB5607', '#8338EC', '#3A86FF', '#06FFA5'];

// NPC colors
const NPC_COLORS = ['#FFD60A', '#FFC300', '#FF9500', '#FF006E', '#FB5607', '#8338EC'];

// Building types and colors
const BUILDING_TYPES: Array<{ type: 'residential' | 'commercial' | 'industrial' | 'park' | 'hospital' | 'school', color: string }> = [
  { type: 'residential', color: '#A8E6CF' },
  { type: 'commercial', color: '#FFD3B6' },
  { type: 'industrial', color: '#FFAAA5' },
  { type: 'park', color: '#88DD88' },
  { type: 'hospital', color: '#FF6B6B' },
  { type: 'school', color: '#4ECDC4' },
];

// Helper to generate random position
const randomPosition = (max: number = GRID_SIZE - 1): Position => ({
  x: Math.random() * max,
  y: Math.random() * max,
});

// Helper to generate destination far from current position
const getRandomDestination = (currentPos: Position, minDistance: number = 20): Position => {
  let dest: Position;
  let distance = 0;
  let attempts = 0;
  
  do {
    dest = randomPosition(GRID_SIZE - 1);
    distance = Math.sqrt((dest.x - currentPos.x) ** 2 + (dest.y - currentPos.y) ** 2);
    attempts++;
  } while (distance < minDistance && attempts < 10);
  
  return dest;
};

// Helper to check if position conflicts with buildings
const isPositionValid = (pos: Position, buildings: Building[], minDistance: number = 2): boolean => {
  return !buildings.some(b => {
    const dist = Math.sqrt((pos.x - b.position.x) ** 2 + (pos.y - b.position.y) ** 2);
    return dist < minDistance;
  });
};

export const createInitialWorld = (): WorldState => {
  const buildings: Building[] = [];
  
  // Create 400+ BUILDINGS scattered across the city
  for (let i = 0; i < 400; i++) {
    let pos = randomPosition();
    let attempts = 0;
    
    // Find valid position not conflicting with other buildings
    while (!isPositionValid(pos, buildings, 3) && attempts < 5) {
      pos = randomPosition();
      attempts++;
    }
    
    if (isPositionValid(pos, buildings, 3)) {
      const buildingType = BUILDING_TYPES[i % BUILDING_TYPES.length];
      buildings.push({
        id: `building-${i + 1}`,
        position: pos,
        size: 0.3 + Math.random() * 0.7, // Varied sizes
        type: buildingType.type,
        color: buildingType.color,
      });
    }
  }

  const agents: Agent[] = [];

  // Create 200 CARS
  for (let i = 0; i < 200; i++) {
    let startPos = randomPosition();
    let attempts = 0;
    
    while (!isPositionValid(startPos, buildings, 1.5) && attempts < 5) {
      startPos = randomPosition();
      attempts++;
    }
    
    agents.push({
      id: `car-${i + 1}`,
      type: 'car',
      position: startPos,
      destination: getRandomDestination(startPos),
      status: 'moving',
      speed: 0.5 + Math.random() * 0.5,
      color: CAR_COLORS[i % CAR_COLORS.length],
    });
  }

  // Create 300 NPCs (pedestrians)
  for (let i = 0; i < 300; i++) {
    let startPos = randomPosition();
    let attempts = 0;
    
    while (!isPositionValid(startPos, buildings, 1.5) && attempts < 5) {
      startPos = randomPosition();
      attempts++;
    }
    
    agents.push({
      id: `npc-${i + 1}`,
      type: 'npc',
      position: startPos,
      destination: getRandomDestination(startPos, 15),
      status: 'moving',
      speed: 0.2 + Math.random() * 0.3,
      color: NPC_COLORS[i % NPC_COLORS.length],
    });
  }

  // Create massive road network
  const roads: Road[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      // Horizontal roads
      if (x < GRID_SIZE - 1) {
        roads.push({
          from: { x, y },
          to: { x: x + 1, y },
          status: 'open',
        });
      }
      // Vertical roads
      if (y < GRID_SIZE - 1) {
        roads.push({
          from: { x, y },
          to: { x, y: y + 1 },
          status: 'open',
        });
      }
    }
  }

  return {
    agents,
    roads,
    buildings,
    events: [],
    gridSize: GRID_SIZE,
  };
};

export const moveAgentTowards = (agent: Agent, target: Position): Position => {
  const dx = target.x - agent.position.x;
  const dy = target.y - agent.position.y;

  const distanceSquared = dx * dx + dy * dy;
  const speedThreshold = agent.speed * 0.1;

  if (distanceSquared < speedThreshold * speedThreshold) {
    return target;
  }

  const distance = Math.sqrt(distanceSquared);
  const normalizedDx = dx / distance;
  const normalizedDy = dy / distance;

  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, agent.position.x + normalizedDx * agent.speed * 0.1)),
    y: Math.max(0, Math.min(GRID_SIZE - 1, agent.position.y + normalizedDy * agent.speed * 0.1)),
  };
};

export const updateAgentPosition = (agent: Agent, roads: Road[]): Agent => {
  if (agent.status === 'stopped') {
    return agent;
  }

  // If agent has no destination, stay idle
  if (!agent.destination) {
    return { ...agent, status: 'idle' };
  }

  // If agent has no path or path is outdated, calculate new path
  if (!agent.path || agent.path.length === 0) {
    const path = findPath(agent.position, agent.destination, GRID_SIZE, roads);
    
    if (!path || path.length === 0) {
      // No path found, agent stops
      return { 
        ...agent, 
        status: 'stopped',
        path: undefined
      };
    }

    agent = { ...agent, path };
  }

  // Get next position along the path
  const nextTarget = getNextPosition(agent.position, agent.path);
  
  if (!nextTarget) {
    // Reached destination
    return {
      ...agent,
      position: agent.destination,
      status: 'idle',
      destination: null,
      path: undefined,
    };
  }

  // Move towards next target
  const newPosition = moveAgentTowards(agent, nextTarget);
  
  // Check if reached the next waypoint
  const dx = nextTarget.x - newPosition.x;
  const dy = nextTarget.y - newPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 0.2) {
    // Reached waypoint, update path
    const currentIndex = agent.path.findIndex(p => 
      Math.abs(p.x - nextTarget.x) < 0.5 && Math.abs(p.y - nextTarget.y) < 0.5
    );
    
    const updatedPath = currentIndex !== -1 && currentIndex < agent.path.length - 1
      ? agent.path.slice(currentIndex + 1)
      : [];

    return {
      ...agent,
      position: newPosition,
      status: 'moving',
      path: updatedPath.length > 0 ? updatedPath : undefined,
    };
  }
  
  return {
    ...agent,
    position: newPosition,
    status: 'moving',
  };
};

export const updateWorldState = (state: WorldState): WorldState => {
  const updatedAgents = state.agents.map(agent => updateAgentPosition(agent, state.roads));
  
  return {
    ...state,
    agents: updatedAgents,
  };
};

export const applyDirectorInstructions = (
  state: WorldState,
  instructions: DirectorInstruction[]
): WorldState => {
  const updatedAgents = state.agents.map(agent => {
    const instruction = instructions.find(inst => inst.agentId === agent.id);
    
    if (!instruction) return agent;

    let newAgent = { ...agent, currentInstruction: instruction };

    switch (instruction.action) {
      case 'stop':
        return { ...newAgent, status: 'stopped' as AgentStatus, destination: null, path: undefined };
      
      case 'move':
      case 'reroute':
      case 'patrol':
        if (instruction.target) {
          return {
            ...newAgent,
            destination: instruction.target,
            status: 'moving' as AgentStatus,
            path: undefined, // Will be recalculated
          };
        }
        return newAgent;
      
      case 'emergency_response':
        if (instruction.target) {
          return {
            ...newAgent,
            destination: instruction.target,
            status: 'emergency' as AgentStatus,
            speed: agent.speed * 1.5, // Faster response
            path: undefined,
          };
        }
        return newAgent;
      
      default:
        return newAgent;
    }
  });

  return {
    ...state,
    agents: updatedAgents,
  };
};

export const createEvent = (
  type: SimulationEvent['type'],
  position: Position,
  description: string
): SimulationEvent => {
  return {
    id: `event-${Date.now()}-${Math.random()}`,
    type,
    position,
    timestamp: Date.now(),
    description,
  };
};

export const applyEventToWorld = (state: WorldState, event: SimulationEvent): WorldState => {
  const updatedRoads = state.roads.map(road => {
    // Check if road is near the event
    const roadMidX = (road.from.x + road.to.x) / 2;
    const roadMidY = (road.from.y + road.to.y) / 2;
    const distance = Math.sqrt(
      Math.pow(roadMidX - event.position.x, 2) + 
      Math.pow(roadMidY - event.position.y, 2)
    );
    
    if (distance < 1.5) {
      let newStatus: RoadStatus = 'open';
      if (event.type === 'accident') newStatus = 'blocked';
      else if (event.type === 'congestion') newStatus = 'congested';
      
      return { ...road, status: newStatus };
    }
    return road;
  });

  // Update affected agents
  const updatedAgents = state.agents.map(agent => {
    const agentDistance = Math.sqrt(
      Math.pow(agent.position.x - event.position.x, 2) + 
      Math.pow(agent.position.y - event.position.y, 2)
    );
    
    if (agentDistance < 1.5 && event.type === 'accident') {
      return { ...agent, status: 'stopped' as AgentStatus };
    }
    return agent;
  });

  return {
    ...state,
    roads: updatedRoads,
    agents: updatedAgents,
    events: [...state.events, event],
  };
};
