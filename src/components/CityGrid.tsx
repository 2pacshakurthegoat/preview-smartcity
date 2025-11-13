import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Agent, Road, WorldState, Building, Asset } from '@/types/simulation';
import { CarModel } from './models/CarModel';
import { NPCModel } from './models/NPCModel';

interface CityGridProps {
  worldState: WorldState;
}

const FRUSTUM_CULLING_DISTANCE = 120;

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

const RoadsLayer = ({ roads }: { roads: Road[] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];

    roads.forEach(road => {
      const color = road.status === 'blocked'
        ? [1, 0.2, 0.2]
        : road.status === 'congested'
        ? [1, 0.54, 0]
        : [0, 0.85, 1];

      const midX = (road.from.x + road.to.x) / 2 - 50;
      const midZ = (road.from.y + road.to.y) / 2 - 50;
      const isHorizontal = road.from.y === road.to.y;

      const w = isHorizontal ? 0.5 : 0.075;
      const h = isHorizontal ? 0.075 : 0.5;

      const corners = [
        [-w, -h], [w, -h], [w, h], [-w, h]
      ];

      const baseIndex = positions.length / 3;
      corners.forEach(([cx, cz]) => {
        positions.push(midX + cx, 0.01, midZ + cz);
        colors.push(...color);
      });

      positions.push(
        midX - w, 0.01, midZ - h,
        midX + w, 0.01, midZ - h,
        midX + w, 0.01, midZ + h,
        midX - w, 0.01, midZ + h
      );
      for (let i = 0; i < 4; i++) colors.push(...color);
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    if (geometryRef.current) geometryRef.current.dispose();
    geometryRef.current = geometry;
    meshRef.current.geometry = geometry;
  }, [roads]);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <meshStandardMaterial
        vertexColors
        emissive={new THREE.Color(0x0088FF)}
        emissiveIntensity={0.2}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

const BuildingsGroup = ({ buildings }: { buildings: Building[] }) => {
  const { camera } = useThree();
  const [visibleBuildings, setVisibleBuildings] = useState(buildings);

  useFrame(() => {
    const cameraPos = camera.position;
    const filtered = buildings.filter(building => {
      const dist = Math.hypot(
        building.position.x - 50 - cameraPos.x,
        building.position.y - 50 - cameraPos.z
      );
      return dist < FRUSTUM_CULLING_DISTANCE;
    });

    if (filtered.length !== visibleBuildings.length) {
      setVisibleBuildings(filtered);
    }
  });

  return (
    <group>
      {visibleBuildings.map(building => (
        <BuildingMesh key={building.id} building={building} />
      ))}
    </group>
  );
};

const AgentsGroup = ({ agents }: { agents: Agent[] }) => {
  const { camera } = useThree();
  const [visibleAgents, setVisibleAgents] = useState(agents);

  useFrame(() => {
    const cameraPos = camera.position;
    const filtered = agents.filter(agent => {
      const dist = Math.hypot(
        agent.position.x - 50 - cameraPos.x,
        agent.position.y - 50 - cameraPos.z
      );
      return dist < FRUSTUM_CULLING_DISTANCE;
    });

    if (filtered.length !== visibleAgents.length) {
      setVisibleAgents(filtered);
    }
  });

  return (
    <group>
      {visibleAgents.map(agent => (
        <AgentMesh key={agent.id} agent={agent} />
      ))}
    </group>
  );
};

const FireModel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((_, delta) => {
    time.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const flicker1 = Math.sin(time.current * 3) * 0.3 + 1;
  const flicker2 = Math.cos(time.current * 4.5) * 0.25 + 1;
  const flicker3 = Math.sin(time.current * 2.8) * 0.35 + 0.9;
  
  return (
    <group position={position} ref={meshRef}>
      {/* Ground scorch mark */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" emissive="#331100" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Base large flames (multiple layers) */}
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.28, 0.7, 12]} />
        <meshStandardMaterial color="#FF2200" emissive="#FF2200" emissiveIntensity={flicker1 * 2.0} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI / 6, 0]}>
        <coneGeometry args={[0.24, 0.65, 10]} />
        <meshStandardMaterial color="#FF4400" emissive="#FF4400" emissiveIntensity={flicker2 * 1.8} transparent opacity={0.85} />
      </mesh>
      
      {/* Mid-level flames (orange) */}
      <mesh position={[0.12, 0.28, 0.08]}>
        <coneGeometry args={[0.18, 0.55, 8]} />
        <meshStandardMaterial color="#FF6600" emissive="#FF6600" emissiveIntensity={flicker1 * 1.6} transparent opacity={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.25, -0.06]}>
        <coneGeometry args={[0.16, 0.5, 8]} />
        <meshStandardMaterial color="#FF7700" emissive="#FF7700" emissiveIntensity={flicker3 * 1.5} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0.08, 0.3, -0.1]}>
        <coneGeometry args={[0.14, 0.45, 7]} />
        <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={flicker2 * 1.4} transparent opacity={0.7} />
      </mesh>
      
      {/* Top flames (yellow-white) */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.12, 0.4, 8]} />
        <meshStandardMaterial color="#FFAA00" emissive="#FFAA00" emissiveIntensity={flicker1 * 2.2} transparent opacity={0.75} />
      </mesh>
      <mesh position={[0.05, 0.5, 0.04]}>
        <coneGeometry args={[0.08, 0.3, 6]} />
        <meshStandardMaterial color="#FFDD00" emissive="#FFDD00" emissiveIntensity={flicker2 * 2.5} transparent opacity={0.7} />
      </mesh>
      
      {/* Intense white-hot core */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFFF88" emissive="#FFFFFF" emissiveIntensity={flicker3 * 2.8} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshStandardMaterial color="#FFFFDD" emissive="#FFFFDD" emissiveIntensity={flicker1 * 3.0} />
      </mesh>
      
      {/* Smoke particles (layered) */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#2a2a2a" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.08, 0.85, 0.06]} rotation={[0.2, 0.3, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-0.06, 0.95, -0.04]} rotation={[0.3, -0.2, 0.1]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#0a0a0a" transparent opacity={0.3} />
      </mesh>
      
      {/* Enhanced lighting */}
      <pointLight position={[0, 0.3, 0]} color="#FF5500" intensity={3.5 * flicker1} distance={4} decay={2} />
      <pointLight position={[0, 0.5, 0]} color="#FFAA00" intensity={2.5 * flicker2} distance={3} decay={2} />
      <pointLight position={[0, 0.15, 0]} color="#FF2200" intensity={2.0 * flicker3} distance={2.5} decay={2} />
    </group>
  );
};

const DestroyedBuildingModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Main collapsed structure - larger base */}
      <mesh position={[0, 0.1, 0]} rotation={[0.12, 0.35, 0.08]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} metalness={0.05} />
      </mesh>
      
      {/* Tilted wall fragments */}
      <mesh position={[0.25, 0.18, -0.12]} rotation={[0.25, -0.45, 0.35]} castShadow>
        <boxGeometry args={[0.28, 0.42, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.22, 0.16, 0.15]} rotation={[-0.2, 0.6, -0.3]} castShadow>
        <boxGeometry args={[0.3, 0.38, 0.09]} />
        <meshStandardMaterial color="#353535" roughness={0.95} />
      </mesh>
      
      {/* Multiple broken concrete chunks */}
      <mesh position={[-0.18, 0.06, 0.14]} rotation={[0.18, 0.75, -0.25]} castShadow>
        <boxGeometry args={[0.22, 0.15, 0.18]} />
        <meshStandardMaterial color="#4a4a4a" roughness={1} />
      </mesh>
      <mesh position={[0.15, 0.04, 0.18]} rotation={[-0.12, 0.25, 0.18]} castShadow>
        <boxGeometry args={[0.16, 0.1, 0.14]} />
        <meshStandardMaterial color="#555555" roughness={1} />
      </mesh>
      <mesh position={[0.08, 0.03, -0.16]} rotation={[0.15, -0.4, 0.12]} castShadow>
        <boxGeometry args={[0.14, 0.09, 0.12]} />
        <meshStandardMaterial color="#5a5a5a" roughness={1} />
      </mesh>
      <mesh position={[-0.12, 0.02, -0.12]} rotation={[-0.08, 0.55, -0.15]} castShadow>
        <boxGeometry args={[0.12, 0.07, 0.11]} />
        <meshStandardMaterial color="#606060" roughness={1} />
      </mesh>
      
      {/* Rebar sticking out - more pieces */}
      <mesh position={[0.18, 0.3, 0.02]} rotation={[0.45, 0, 0.28]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.38, 8]} />
        <meshStandardMaterial color="#704214" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[-0.14, 0.25, -0.06]} rotation={[0.28, 0.65, -0.35]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 8]} />
        <meshStandardMaterial color="#8B4513" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0.22, 0.22, -0.08]} rotation={[0.35, -0.25, 0.42]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.28, 8]} />
        <meshStandardMaterial color="#704214" metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 0.28, 0.12]} rotation={[0.52, 0.45, -0.22]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.35, 8]} />
        <meshStandardMaterial color="#8B4513" metalness={0.75} roughness={0.35} />
      </mesh>
      
      {/* Cracked floor pieces */}
      <mesh position={[0.28, 0.01, 0.22]} rotation={[-0.05, 0.15, 0.08]}>
        <boxGeometry args={[0.18, 0.02, 0.16]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.24, 0.01, -0.2]} rotation={[0.06, -0.22, -0.05]}>
        <boxGeometry args={[0.16, 0.02, 0.15]} />
        <meshStandardMaterial color="#404040" roughness={0.95} />
      </mesh>
      
      {/* Dust/debris clouds - layered */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshStandardMaterial color="#8a8a8a" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0.12, 0.25, 0.08]} rotation={[0.2, 0.3, 0]}>
        <sphereGeometry args={[0.32, 10, 10]} />
        <meshStandardMaterial color="#7a7a7a" transparent opacity={0.15} />
      </mesh>
      <mesh position={[-0.08, 0.3, -0.06]} rotation={[0.3, -0.2, 0.1]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#6a6a6a" transparent opacity={0.12} />
      </mesh>
      
      {/* Small debris particles */}
      <mesh position={[0.32, 0.02, 0.08]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial color="#555555" roughness={1} />
      </mesh>
      <mesh position={[-0.28, 0.02, 0.14]}>
        <boxGeometry args={[0.05, 0.03, 0.05]} />
        <meshStandardMaterial color="#4a4a4a" roughness={1} />
      </mesh>
      <mesh position={[0.18, 0.02, -0.24]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial color="#505050" roughness={1} />
      </mesh>
    </group>
  );
};

const PoliceBarrierModel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((_, delta) => {
    time.current += delta;
  });

  const flashIntensity = Math.abs(Math.sin(time.current * 3)) * 0.8 + 0.2;
  
  return (
    <group position={position} ref={meshRef}>
      {/* Left post with detail */}
      <mesh position={[-0.28, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, 0.2, 12]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[-0.28, 0.01, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.65} metalness={0.3} />
      </mesh>
      
      {/* Right post with detail */}
      <mesh position={[0.28, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, 0.2, 12]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.28, 0.01, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.03, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.65} metalness={0.3} />
      </mesh>
      
      {/* Top yellow barrier - main body */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.08]} />
        <meshStandardMaterial color="#FFD700" roughness={0.15} metalness={0.5} />
      </mesh>
      
      {/* Black diagonal stripes */}
      <mesh position={[-0.18, 0.17, 0.041]}>
        <boxGeometry args={[0.12, 0.08, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.25} />
      </mesh>
      <mesh position={[-0.06, 0.17, 0.041]}>
        <boxGeometry args={[0.12, 0.08, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.25} />
      </mesh>
      <mesh position={[0.06, 0.17, 0.041]}>
        <boxGeometry args={[0.12, 0.08, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.25} />
      </mesh>
      <mesh position={[0.18, 0.17, 0.041]}>
        <boxGeometry args={[0.12, 0.08, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.25} />
      </mesh>
      
      {/* Metallic end caps */}
      <mesh position={[-0.3, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.09]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.3, 0.17, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.09]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Base plates with weight indicators */}
      <mesh position={[-0.28, 0.005, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.015, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.2} />
      </mesh>
      <mesh position={[0.28, 0.005, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.015, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.2} />
      </mesh>
      
      {/* Reflective tape strips on posts (flashing) */}
      <mesh position={[-0.28, 0.14, 0.03]}>
        <boxGeometry args={[0.035, 0.05, 0.002]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={flashIntensity * 0.8} 
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.28, 0.14, 0.03]}>
        <boxGeometry args={[0.035, 0.05, 0.002]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={flashIntensity * 0.8} 
          roughness={0.1}
        />
      </mesh>
      
      {/* Additional reflective strips */}
      <mesh position={[-0.28, 0.06, 0.03]}>
        <boxGeometry args={[0.035, 0.04, 0.002]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={flashIntensity * 0.4} 
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0.28, 0.06, 0.03]}>
        <boxGeometry args={[0.035, 0.04, 0.002]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={flashIntensity * 0.4} 
          roughness={0.1}
        />
      </mesh>
      
      {/* "POLICE" text simulation (small rectangles) */}
      <mesh position={[0, 0.17, 0.042]}>
        <boxGeometry args={[0.25, 0.04, 0.001]} />
        <meshStandardMaterial color="#0055FF" emissive="#0055FF" emissiveIntensity={0.3} />
      </mesh>
      
      {/* Flashing point lights */}
      <pointLight 
        position={[-0.28, 0.14, 0.05]} 
        color="#FF0000" 
        intensity={flashIntensity * 0.8} 
        distance={1.2} 
      />
      <pointLight 
        position={[0.28, 0.14, 0.05]} 
        color="#FF0000" 
        intensity={flashIntensity * 0.8} 
        distance={1.2} 
      />
    </group>
  );
};

const TrafficConeModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Heavy rubber base */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.16, 0.018, 0.16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.018, 0]}>
        <cylinderGeometry args={[0.11, 0.08, 0.006, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      
      {/* Main cone body - orange (multiple segments for better detail) */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <coneGeometry args={[0.108, 0.14, 16]} />
        <meshStandardMaterial color="#FF4400" roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <coneGeometry args={[0.088, 0.12, 16]} />
        <meshStandardMaterial color="#FF5500" roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow>
        <coneGeometry args={[0.068, 0.1, 16]} />
        <meshStandardMaterial color="#FF6600" roughness={0.25} metalness={0.1} />
      </mesh>
      
      {/* White reflective stripe 1 (bottom) */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.035, 16]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={0.3} 
          roughness={0.05} 
          metalness={0.2}
        />
      </mesh>
      
      {/* White reflective stripe 2 (middle) */}
      <mesh position={[0, 0.165, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.032, 16]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={0.3} 
          roughness={0.05} 
          metalness={0.2}
        />
      </mesh>
      
      {/* White reflective stripe 3 (upper) */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.028, 16]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={0.3} 
          roughness={0.05} 
          metalness={0.2}
        />
      </mesh>
      
      {/* Top cap with handle hole */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.032, 12, 12]} />
        <meshStandardMaterial color="#FF3300" roughness={0.15} metalness={0.3} />
      </mesh>
      
      {/* Handle ring at top */}
      <mesh position={[0, 0.315, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.025, 0.008, 8, 16]} />
        <meshStandardMaterial color="#FF3300" roughness={0.15} metalness={0.3} />
      </mesh>
      
      {/* Base grip ridges */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.09, 0.095, 0.008, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      
      {/* Reflective diamonds on orange sections */}
      <mesh position={[0, 0.13, 0.11]}>
        <boxGeometry args={[0.015, 0.015, 0.001]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.22, 0.08]}>
        <boxGeometry args={[0.012, 0.012, 0.001]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.13, -0.11]}>
        <boxGeometry args={[0.015, 0.015, 0.001]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.22, -0.08]}>
        <boxGeometry args={[0.012, 0.012, 0.001]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

const AmbulanceModel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((_, delta) => {
    time.current += delta;
  });

  const flashIntensity = Math.abs(Math.sin(time.current * 4)) * 1.5;
  const flash2 = Math.abs(Math.cos(time.current * 4.3)) * 1.5;
  
  return (
    <group position={position} ref={meshRef}>
      {/* Main cargo body */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.52, 0.26, 0.3]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.15} metalness={0.4} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0.18, 0.2, 0]} castShadow>
        <boxGeometry args={[0.22, 0.16, 0.28]} />
        <meshStandardMaterial color="#F0F0F0" roughness={0.15} metalness={0.4} />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0.29, 0.2, 0]} castShadow>
        <boxGeometry args={[0.02, 0.14, 0.26]} />
        <meshStandardMaterial color="#3388BB" transparent opacity={0.65} roughness={0.05} />
      </mesh>
      
      {/* Side windows */}
      <mesh position={[0.18, 0.2, 0.145]}>
        <boxGeometry args={[0.2, 0.12, 0.002]} />
        <meshStandardMaterial color="#4499CC" transparent opacity={0.6} roughness={0.05} />
      </mesh>
      <mesh position={[0.18, 0.2, -0.145]}>
        <boxGeometry args={[0.2, 0.12, 0.002]} />
        <meshStandardMaterial color="#4499CC" transparent opacity={0.6} roughness={0.05} />
      </mesh>
      
      {/* Red stripe - main body */}
      <mesh position={[0, 0.13, 0.152]}>
        <boxGeometry args={[0.53, 0.08, 0.002]} />
        <meshStandardMaterial color="#CC0000" roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.13, -0.152]}>
        <boxGeometry args={[0.53, 0.08, 0.002]} />
        <meshStandardMaterial color="#CC0000" roughness={0.25} metalness={0.2} />
      </mesh>
      
      {/* Orange stripe above red */}
      <mesh position={[0, 0.19, 0.152]}>
        <boxGeometry args={[0.53, 0.03, 0.002]} />
        <meshStandardMaterial color="#FF6600" roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.19, -0.152]}>
        <boxGeometry args={[0.53, 0.03, 0.002]} />
        <meshStandardMaterial color="#FF6600" roughness={0.25} />
      </mesh>
      
      {/* Emergency light bar on top */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.35, 0.05, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
      </mesh>
      
      {/* Red emergency lights */}
      <mesh position={[-0.12, 0.28, 0.03]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={flashIntensity} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      <mesh position={[-0.12, 0.28, -0.03]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={flashIntensity} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Blue emergency lights */}
      <mesh position={[0.12, 0.28, 0.03]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial 
          color="#0055FF" 
          emissive="#0055FF" 
          emissiveIntensity={flash2} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0.12, 0.28, -0.03]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial 
          color="#0055FF" 
          emissive="#0055FF" 
          emissiveIntensity={flash2} 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Front grille */}
      <mesh position={[0.31, 0.08, 0]}>
        <boxGeometry args={[0.01, 0.1, 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[0.315, 0.08, 0.1]}>
        <circleGeometry args={[0.025, 12]} />
        <meshStandardMaterial color="#FFFFCC" emissive="#FFFFAA" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.315, 0.08, -0.1]}>
        <circleGeometry args={[0.025, 12]} />
        <meshStandardMaterial color="#FFFFCC" emissive="#FFFFAA" emissiveIntensity={0.8} />
      </mesh>
      
      {/* Wheels (detailed) */}
      <mesh position={[0.18, 0.035, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.035, -0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, 0.035, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, 0.035, -0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
      </mesh>
      
      {/* Wheel rims */}
      <mesh position={[0.18, 0.035, 0.165]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.002, 16]} />
        <meshStandardMaterial color="#CCCCCC" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.035, -0.165]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.002, 16]} />
        <meshStandardMaterial color="#CCCCCC" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.035, 0.165]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.002, 16]} />
        <meshStandardMaterial color="#CCCCCC" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.035, -0.165]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.002, 16]} />
        <meshStandardMaterial color="#CCCCCC" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Cross symbol on side (vertical) */}
      <mesh position={[0, 0.16, 0.153]}>
        <boxGeometry args={[0.05, 0.15, 0.002]} />
        <meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} />
      </mesh>
      {/* Cross symbol on side (horizontal) */}
      <mesh position={[0, 0.16, 0.153]}>
        <boxGeometry args={[0.15, 0.05, 0.002]} />
        <meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Cross on other side */}
      <mesh position={[0, 0.16, -0.153]}>
        <boxGeometry args={[0.05, 0.15, 0.002]} />
        <meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.16, -0.153]}>
        <boxGeometry args={[0.15, 0.05, 0.002]} />
        <meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Back doors detail */}
      <mesh position={[-0.26, 0.13, 0]}>
        <boxGeometry args={[0.01, 0.22, 0.28]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.2} metalness={0.3} />
      </mesh>
      
      {/* Door handles */}
      <mesh position={[-0.265, 0.13, 0.08]}>
        <boxGeometry args={[0.008, 0.03, 0.025]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[-0.265, 0.13, -0.08]}>
        <boxGeometry args={[0.008, 0.03, 0.025]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Siren speaker on roof */}
      <mesh position={[0.08, 0.26, 0]}>
        <boxGeometry args={[0.08, 0.02, 0.06]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.5} />
      </mesh>
      
      {/* Emergency lights glow */}
      <pointLight 
        position={[-0.12, 0.28, 0]} 
        color="#FF0000" 
        intensity={flashIntensity * 1.2} 
        distance={2.5} 
        decay={2}
      />
      <pointLight 
        position={[0.12, 0.28, 0]} 
        color="#0055FF" 
        intensity={flash2 * 1.0} 
        distance={2.5} 
        decay={2}
      />
    </group>
  );
};

const RepairCraneModel = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((_, delta) => {
    time.current += delta;
  });

  const warningBlink = Math.abs(Math.sin(time.current * 2)) * 0.8 + 0.2;
  
  return (
    <group position={position} ref={meshRef}>
      {/* Heavy base platform with treads */}
      <mesh position={[0, 0.025, 0]} castShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.48, 0.02, 0.48]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.85} />
      </mesh>
      
      {/* Track/tread details */}
      <mesh position={[0.22, 0.02, 0.22]}>
        <boxGeometry args={[0.04, 0.03, 0.42]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.22, 0.02, 0.22]}>
        <boxGeometry args={[0.04, 0.03, 0.42]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      <mesh position={[0.22, 0.02, -0.22]}>
        <boxGeometry args={[0.04, 0.03, 0.42]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.22, 0.02, -0.22]}>
        <boxGeometry args={[0.04, 0.03, 0.42]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
      </mesh>
      
      {/* Main body/cabin */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.38, 0.18, 0.35]} />
        <meshStandardMaterial color="#FF9500" roughness={0.35} metalness={0.25} />
      </mesh>
      
      {/* Cabin top */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.36, 0.02, 0.33]} />
        <meshStandardMaterial color="#FFA500" roughness={0.3} metalness={0.3} />
      </mesh>
      
      {/* Cabin windows - front */}
      <mesh position={[0.191, 0.14, 0]}>
        <boxGeometry args={[0.002, 0.12, 0.28]} />
        <meshStandardMaterial color="#3388BB" transparent opacity={0.6} roughness={0.08} />
      </mesh>
      {/* Side windows */}
      <mesh position={[0, 0.14, 0.176]}>
        <boxGeometry args={[0.3, 0.12, 0.002]} />
        <meshStandardMaterial color="#4499CC" transparent opacity={0.55} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0.14, -0.176]}>
        <boxGeometry args={[0.3, 0.12, 0.002]} />
        <meshStandardMaterial color="#4499CC" transparent opacity={0.55} roughness={0.08} />
      </mesh>
      
      {/* Black/yellow warning stripes */}
      <mesh position={[0, 0.09, 0.178]}>
        <boxGeometry args={[0.39, 0.05, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0.178]}>
        <boxGeometry args={[0.39, 0.05, 0.002]} />
        <meshStandardMaterial color="#000000" roughness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.12, 0.178]}>
        <boxGeometry args={[0.08, 0.14, 0.002]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12, 0.178]}>
        <boxGeometry args={[0.08, 0.14, 0.002]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} />
      </mesh>
      <mesh position={[0.15, 0.12, 0.178]}>
        <boxGeometry args={[0.08, 0.14, 0.002]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} />
      </mesh>
      
      {/* Tower base mount */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.12, 0.14, 0.12]} />
        <meshStandardMaterial color="#CC7700" roughness={0.3} metalness={0.4} />
      </mesh>
      
      {/* Main tower - segmented */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.045, 0.3, 12]} />
        <meshStandardMaterial color="#FFD700" roughness={0.25} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.042, 0.25, 12]} />
        <meshStandardMaterial color="#FFC700" roughness={0.25} metalness={0.6} />
      </mesh>
      
      {/* Tower segments (hydraulic joints) */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.57, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.04, 12]} />
        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Main boom arm */}
      <mesh position={[0.28, 0.7, 0]} rotation={[0, 0, Math.PI / 5.5]} castShadow>
        <boxGeometry args={[0.58, 0.035, 0.038]} />
        <meshStandardMaterial color="#777777" roughness={0.35} metalness={0.65} />
      </mesh>
      
      {/* Boom structural reinforcements */}
      <mesh position={[0.28, 0.7, 0.02]} rotation={[0, 0, Math.PI / 5.5]}>
        <boxGeometry args={[0.58, 0.01, 0.001]} />
        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.7, -0.02]} rotation={[0, 0, Math.PI / 5.5]}>
        <boxGeometry args={[0.58, 0.01, 0.001]} />
        <meshStandardMaterial color="#555555" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Support cables - multiple */}
      <mesh position={[0.18, 0.65, 0.01]} rotation={[0, 0, Math.PI / 3.8]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.32, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[0.18, 0.65, -0.01]} rotation={[0, 0, Math.PI / 3.8]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.32, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh position={[0.35, 0.65, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
        <meshStandardMaterial color="#444444" roughness={0.45} metalness={0.55} />
      </mesh>
      
      {/* Cable drum/winch on boom */}
      <mesh position={[0.42, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.06, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.5} metalness={0.6} />
      </mesh>
      
      {/* Hanging cable */}
      <mesh position={[0.52, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.24, 8]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Hook assembly */}
      <mesh position={[0.52, 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0.52, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.035, 0.01, 10, 16]} />
        <meshStandardMaterial color="#FFD700" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Hook tip */}
      <mesh position={[0.52, 0.38, 0]}>
        <coneGeometry args={[0.012, 0.03, 8]} />
        <meshStandardMaterial color="#FFD700" roughness={0.25} metalness={0.8} />
      </mesh>
      
      {/* Counterweight at back */}
      <mesh position={[0, 0.15, -0.22]} castShadow>
        <boxGeometry args={[0.32, 0.12, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.75} metalness={0.2} />
      </mesh>
      
      {/* Warning light on top (blinking) */}
      <mesh position={[0, 0.73, 0]} castShadow>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial 
          color="#FF3300" 
          emissive="#FF3300" 
          emissiveIntensity={warningBlink * 1.2} 
        />
      </mesh>
      <mesh position={[0, 0.755, 0]}>
        <cylinderGeometry args={[0.02, 0.028, 0.015, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Additional warning lights on cabin */}
      <mesh position={[0.12, 0.23, 0.165]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial 
          color="#FFAA00" 
          emissive="#FFAA00" 
          emissiveIntensity={warningBlink * 0.8} 
        />
      </mesh>
      <mesh position={[-0.12, 0.23, 0.165]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial 
          color="#FFAA00" 
          emissive="#FFAA00" 
          emissiveIntensity={warningBlink * 0.8} 
        />
      </mesh>
      
      {/* Wheels/bogies (detailed) */}
      <mesh position={[0.18, 0.035, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.18, 0.035, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.035, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.18, 0.035, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      
      {/* Stabilizer outriggers */}
      <mesh position={[0.25, 0.06, 0.25]} castShadow>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-0.25, 0.06, 0.25]} castShadow>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0.25, 0.06, -0.25]} castShadow>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[-0.25, 0.06, -0.25]} castShadow>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.6} />
      </mesh>
      
      {/* Warning light glow */}
      <pointLight 
        position={[0, 0.73, 0]} 
        color="#FF3300" 
        intensity={warningBlink * 0.8} 
        distance={2} 
        decay={2}
      />
    </group>
  );
};

const Scene = ({ worldState, shake }: { worldState: WorldState; shake: boolean }) => {
  const sceneRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (shake && sceneRef.current) {
      const intensity = 0.5;
      const duration = 1000; // ms
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > duration) {
          clearInterval(interval);
          sceneRef.current!.position.set(0, 0, 0);
          return;
        }
        const progress = elapsed / duration;
        const decay = 1 - progress;
        sceneRef.current!.position.set(
          (Math.random() - 0.5) * intensity * decay,
          (Math.random() - 0.5) * intensity * decay * 0.5,
          (Math.random() - 0.5) * intensity * decay
        );
      }, 16);
      return () => clearInterval(interval);
    }
  }, [shake]);

  return (
    <group ref={sceneRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 40, 50]} intensity={1} color="#00D9FF" />
      <directionalLight position={[-50, 40, -50]} intensity={0.6} color="#FF8A00" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0A1628" />
      </mesh>

      <BuildingsGroup buildings={worldState.buildings} />
      <RoadsLayer roads={worldState.roads} />
      <AgentsGroup agents={worldState.agents} />

      {/* Assets Layer */}
      <group>
        {(worldState.assets || []).map(asset => {
          const ax = asset.position.x - 50;
          const az = asset.position.y - 50;
          const pos: [number, number, number] = [ax, 0.05, az];
          if (asset.kind === 'fire') return <FireModel key={asset.id} position={pos} />;
          if (asset.kind === 'destroyed_building') return <DestroyedBuildingModel key={asset.id} position={pos} />;
          if (asset.kind === 'police_barrier') return <PoliceBarrierModel key={asset.id} position={pos} />;
          if (asset.kind === 'traffic_cone') return <TrafficConeModel key={asset.id} position={pos} />;
          if (asset.kind === 'ambulance') return <AmbulanceModel key={asset.id} position={pos} />;
          if (asset.kind === 'repair_crane') return <RepairCraneModel key={asset.id} position={pos} />;
          return null;
        })}
      </group>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={150}
        minDistance={10}
        maxPolarAngle={Math.PI / 2.2}
      />
    </group>
  );
};

export const CityGrid = ({ worldState, shake }: CityGridProps & { shake?: boolean }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [80, 60, 80], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene worldState={worldState} shake={shake || false} />
      </Canvas>
    </div>
  );
};
