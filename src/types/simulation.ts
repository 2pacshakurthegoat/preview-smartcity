export type AgentType = 'car' | 'npc';

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

export interface WorldState {
  agents: Agent[];
  roads: Road[];
  events: SimulationEvent[];
  buildings: Building[];
  gridSize: number;
}

export interface DirectorInstruction {
  agentId: string;
  action: 'move' | 'stop' | 'reroute' | 'emergency_response' | 'patrol';
  target?: Position;
  priority?: 'low' | 'medium' | 'high';
  reasoning?: string;
}

export interface DirectorResponse {
  instructions: DirectorInstruction[];
  globalStrategy?: string;
}

export interface AgentAction {
  agentId: string;
  action: 'move' | 'stop' | 'wait';
  newPosition?: Position;
  path?: Position[];
}
