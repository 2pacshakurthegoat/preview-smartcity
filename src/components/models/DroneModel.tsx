import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface DroneModelProps {
  color: string;
  position: [number, number, number];
  isFlying?: boolean;
}

export const DroneModel = ({ color, position, isFlying = true }: DroneModelProps) => {
  const groupRef = useRef<any>(null);
  const propellerRefs = [useRef<any>(null), useRef<any>(null), useRef<any>(null), useRef<any>(null)];

  useFrame(() => {
    if (groupRef.current && isFlying) {
      // Hovering motion
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003) * 0.1;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.002) * 0.05;
      groupRef.current.rotation.z = Math.cos(Date.now() * 0.002) * 0.05;
    }

    // Spin propellers
    propellerRefs.forEach(ref => {
      if (ref.current && isFlying) {
        ref.current.rotation.y += 0.3;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main body */}
      <mesh>
        <boxGeometry args={[0.3, 0.08, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Camera/sensor underneath */}
      <mesh position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* LED indicator */}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={1} />
      </mesh>

      {/* Arms and propellers */}
      {[
        { pos: [0.2, 0, 0.2] as [number, number, number] },
        { pos: [-0.2, 0, 0.2] as [number, number, number] },
        { pos: [0.2, 0, -0.2] as [number, number, number] },
        { pos: [-0.2, 0, -0.2] as [number, number, number] },
      ].map((arm, idx) => (
        <group key={idx} position={arm.pos}>
          {/* Arm */}
          <mesh position={[arm.pos[0] > 0 ? -0.1 : 0.1, 0, arm.pos[2] > 0 ? -0.1 : 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          
          {/* Motor */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 12]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Propeller */}
          <group ref={propellerRefs[idx]} position={[0, 0.06, 0]}>
            <mesh>
              <boxGeometry args={[0.25, 0.01, 0.03]} />
              <meshStandardMaterial color="#666666" transparent opacity={0.7} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.25, 0.01, 0.03]} />
              <meshStandardMaterial color="#666666" transparent opacity={0.7} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
};
