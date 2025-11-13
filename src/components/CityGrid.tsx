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
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.2, 0.6, 12]} />
        <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#FFA500" emissive="#FFA500" emissiveIntensity={1.0} />
      </mesh>
    </group>
  );
};

const DestroyedBuildingModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh rotation={[0.2, 0.3, 0.1]}>
        <boxGeometry args={[0.4, 0.15, 0.3]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0.1, 0.1, -0.05]} rotation={[0.1, -0.2, 0.2]}>
        <boxGeometry args={[0.2, 0.1, 0.15]} />
        <meshStandardMaterial color="#444" />
      </mesh>
    </group>
  );
};

const PoliceBarrierModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.08, 0.05]} />
        <meshStandardMaterial color="#FFD700" roughness={0.3} />
      </mesh>
      <mesh position={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

const TrafficConeModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial color="#FF6600" />
      </mesh>
      <mesh position={[0, -0.125, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
};

const AmbulanceModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

const RepairCraneModel = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.15, 0.3]} />
        <meshStandardMaterial color="#FFA500" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      <mesh position={[0.2, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color="#555" />
      </mesh>
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
