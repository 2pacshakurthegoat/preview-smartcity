import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid as DreiGrid } from '@react-three/drei';
import * as THREE from 'three';
import { Agent, Road, WorldState, Building } from '@/types/simulation';
import { CarModel } from './models/CarModel';
import { NPCModel } from './models/NPCModel';

interface CityGridProps {
  worldState: WorldState;
}

const AgentMesh = ({ agent }: { agent: Agent }) => {
  const targetX = agent.position.x - 50;
  const targetZ = agent.position.y - 50;
  
  const isMoving = agent.status === 'moving';
  
  if (agent.type === 'car') {
    return (
      <CarModel 
        color={agent.color} 
        position={[targetX, 0, targetZ]}
        isMoving={isMoving}
      />
    );
  } else {
    return (
      <NPCModel 
        color={agent.color} 
        position={[targetX, 0, targetZ]}
        isWalking={isMoving}
      />
    );
  }
};

const BuildingMesh = ({ building }: { building: Building }) => {
  const posX = building.position.x - 50;
  const posZ = building.position.y - 50;
  const height = 0.5 + building.size * 1.5;
  
  return (
    <mesh position={[posX, height / 2, posZ]}>
      <boxGeometry args={[building.size, height, building.size]} />
      <meshStandardMaterial 
        color={building.color}
        emissive={building.color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

const RoadMesh = ({ road }: { road: Road }) => {
  const color = useMemo(() => {
    switch (road.status) {
      case 'blocked': return '#FF3333';
      case 'congested': return '#FF8A00';
      default: return '#00D9FF';
    }
  }, [road.status]);

  const midX = (road.from.x + road.to.x) / 2 - 50;
  const midZ = (road.from.y + road.to.y) / 2 - 50;
  const isHorizontal = road.from.y === road.to.y;
  
  return (
    <mesh position={[midX, 0.01, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={isHorizontal ? [1, 0.15] : [0.15, 1]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

const BuildingsGroup = ({ buildings }: { buildings: Building[] }) => {
  return (
    <group>
      {buildings.map(building => (
        <BuildingMesh key={building.id} building={building} />
      ))}
    </group>
  );
};

const Scene = ({ worldState }: { worldState: WorldState }) => {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      
      {/* Key light */}
      <directionalLight position={[50, 40, 50]} intensity={1} color="#00D9FF" />
      <directionalLight position={[-50, 40, -50]} intensity={0.6} color="#FF8A00" />
      
      {/* Base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0A1628" />
      </mesh>

      {/* Buildings */}
      <BuildingsGroup buildings={worldState.buildings} />

      {/* Roads */}
      {worldState.roads.map((road, idx) => (
        <RoadMesh key={`road-${idx}`} road={road} />
      ))}

      {/* Agents */}
      {worldState.agents.map(agent => (
        <AgentMesh key={agent.id} agent={agent} />
      ))}

      {/* Camera controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={150}
        minDistance={10}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
};

export const CityGrid = ({ worldState }: CityGridProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [80, 60, 80], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene worldState={worldState} />
      </Canvas>
    </div>
  );
};
