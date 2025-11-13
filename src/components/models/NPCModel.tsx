import { useRef, useMemo } from 'react';
import { SphereGeometry, BoxGeometry, CylinderGeometry } from 'three';
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
  const timeOffsetRef = useRef(Math.random() * 1000);

  useFrame((state) => {
    if (isWalking && groupRef.current) {
      const time = (state.clock.elapsedTime + timeOffsetRef.current * 0.001) * 1.2;

      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time) * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time + Math.PI) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.3;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time) * 0.3;

      groupRef.current.position.y = Math.abs(Math.sin(time * 2)) * 0.015;
    } else if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
  });

  const headGeometry = useMemo(() => new SphereGeometry(0.08, 8, 8), []);
  const torsoGeometry = useMemo(() => new BoxGeometry(0.15, 0.2, 0.1), []);
  const limbGeometry = useMemo(() => new CylinderGeometry(0.03, 0.03, 0.16, 6), []);
  const footGeometry = useMemo(() => new BoxGeometry(0.06, 0.02, 0.1), []);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh position={[0, 0.35, 0]} geometry={headGeometry}>
        <meshStandardMaterial color="#FFD4A3" />
      </mesh>

      <mesh position={[0, 0.2, 0]} geometry={torsoGeometry}>
        <meshStandardMaterial color={color} />
      </mesh>

      <group ref={leftArmRef} position={[0.11, 0.25, 0]}>
        <mesh position={[0, -0.08, 0]} geometry={limbGeometry}>
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#FFD4A3" />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[-0.11, 0.25, 0]}>
        <mesh position={[0, -0.08, 0]} geometry={limbGeometry}>
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#FFD4A3" />
        </mesh>
      </group>

      <group ref={leftLegRef} position={[0.05, 0.08, 0]}>
        <mesh position={[0, -0.08, 0]} geometry={limbGeometry}>
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0, -0.17, 0.02]} geometry={footGeometry}>
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[-0.05, 0.08, 0]}>
        <mesh position={[0, -0.08, 0]} geometry={limbGeometry}>
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0, -0.17, 0.02]} geometry={footGeometry}>
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
};
