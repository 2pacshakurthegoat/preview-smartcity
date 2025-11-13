import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';

interface CarModelProps {
  color: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isMoving?: boolean;
}

export const CarModel = ({ color, position, rotation = [0, 0, 0], isMoving = false }: CarModelProps) => {
  const groupRef = useRef<any>(null);

  useFrame(() => {
    if (groupRef.current && isMoving) {
      // Subtle bounce when moving
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.005) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Car body */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.7]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Car roof/cabin */}
      <mesh position={[0, 0.3, -0.05]}>
        <boxGeometry args={[0.35, 0.15, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Windshield */}
      <mesh position={[0, 0.32, 0.12]}>
        <boxGeometry args={[0.3, 0.12, 0.02]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Front wheels */}
      <mesh position={[0.22, 0.08, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.22, 0.08, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Rear wheels */}
      <mesh position={[0.22, 0.08, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.22, 0.08, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Headlights */}
      <mesh position={[0.15, 0.15, 0.36]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FFFF88" emissive="#FFFF88" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.36]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FFFF88" emissive="#FFFF88" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};
