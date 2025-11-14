export type AgentType = 'car' | 'npc'; // Note: drone not currently present in world, but Director schema allows it

export type AgentStatus = 'idle' | 'moving' | 'stopped' | 'emergency';

export interface Position {
  x: number;
  y: number;
}

export interface Agent {
  id: string;
  type: AgentType;
  position: Position;
  destination: Position | null;
  status: AgentStatus;
  speed: number;
  color: string;
  path?: Position[]; // Current navigation path
  currentInstruction?: DirectorInstruction; // Current directive from Director
}

export type RoadStatus = 'open' | 'congested' | 'blocked';

export interface Road {
  from: Position;
  to: Position;
  status: RoadStatus;
}

export interface GridNode {
  position: Position;
  isIntersection: boolean;
  roads: Road[];
}

export type EventType = 'accident' | 'congestion' | 'emergency';

export interface SimulationEvent {
  id: string;
  type: EventType;
  position: Position;
  timestamp: number;
  description: string;
}

export interface Building {
  id: string;
  position: Position;
  size: number; // Building size/scale
  type: 'residential' | 'commercial' | 'industrial' | 'park' | 'hospital' | 'school';
  color: string;
}

export type AssetKind = 'fire' | 'destroyed_building' | 'police_barrier' | 'traffic_cone' | 'ambulance' | 'repair_crane' | 'police_car' | 'fire_truck' | 'street_light' | 'bench' | 'tree' | 'dumpster';

export interface Asset {
  id: string;
  kind: AssetKind;
  position: Position;
  ttl?: number; // ticks remaining (optional)
}

export interface WorldEffects {
  shake?: number; // ticks remaining for world shake effect
}

export interface WorldEffects {
  shake?: number; // countdown ticks for shake effect
}

export interface WorldState {
  agents: Agent[];
  roads: Road[];
  events: SimulationEvent[];
  buildings: Building[];
  assets?: Asset[];
  effects?: WorldEffects;
  gridSize: number;
}

export interface DirectorInstructionAssetOp {
  op: 'add' | 'remove';
  kind: AssetKind;
  position: Position;
  ttl?: number;
}

export interface DirectorInstruction {
  agentId: string;
  action: 'move' | 'stop' | 'reroute' | 'emergency_response' | 'patrol';
  target?: Position;
  priority?: 'low' | 'medium' | 'high';
  reasoning?: string;
}

export interface DirectorResponse {
  // agent-level instructions
  instructions: DirectorInstruction[];
  // world-level operations
  assetsOps?: DirectorInstructionAssetOp[];
  // special effects
  shakeWorld?: boolean;
  globalStrategy?: string;
}
  instructions: DirectorInstruction[];
  globalStrategy?: string;
}

export interface AgentAction {
  agentId: string;
  action: 'move' | 'stop' | 'wait';
  newPosition?: Position;
  path?: Position[];
}
