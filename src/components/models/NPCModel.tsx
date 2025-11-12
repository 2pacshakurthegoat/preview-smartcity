import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface NPCModelProps {
  color: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isWalking?: boolean;
}

export const NPCModel = ({ color, position, rotation = [0, 0, 0], isWalking = false }: NPCModelProps) => {
  const groupRef = useRef<any>(null);
  const leftLegRef = useRef<any>(null);
  const rightLegRef = useRef<any>(null);
  const leftArmRef = useRef<any>(null);
  const rightArmRef = useRef<any>(null);

  useFrame(() => {
    if (isWalking) {
      const time = Date.now() * 0.01;
      
      // Walking animation
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time) * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time + Math.PI) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.3;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time) * 0.3;
      
      // Subtle bob
      if (groupRef.current) {
        groupRef.current.position.y = position[1] + Math.abs(Math.sin(time * 2)) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Head */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#FFD4A3" />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Left arm */}
      <group ref={leftArmRef} position={[0.11, 0.25, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.18, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#FFD4A3" />
        </mesh>
      </group>
      
      {/* Right arm */}
      <group ref={rightArmRef} position={[-0.11, 0.25, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.18, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#FFD4A3" />
        </mesh>
      </group>
      
      {/* Left leg */}
      <group ref={leftLegRef} position={[0.05, 0.08, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.17, 0.02]}>
          <boxGeometry args={[0.06, 0.02, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
      
      {/* Right leg */}
      <group ref={rightLegRef} position={[-0.05, 0.08, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.17, 0.02]}>
          <boxGeometry args={[0.06, 0.02, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
};
