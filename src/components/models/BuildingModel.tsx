interface BuildingModelProps {
  position: [number, number, number];
  width?: number;
  height?: number;
  depth?: number;
  color?: string;
}

export const BuildingModel = ({ 
  position, 
  width = 0.8, 
  height = 1.5, 
  depth = 0.8,
  color = '#1a3a5a'
}: BuildingModelProps) => {
  return (
    <group position={position}>
      {/* Main building structure */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.7}
        />
      </mesh>
      
      {/* Windows pattern */}
      {Array.from({ length: Math.floor(height * 4) }, (_, floor) => (
        <group key={floor}>
          {Array.from({ length: 3 }, (_, window) => (
            <mesh 
              key={`${floor}-${window}`}
              position={[
                (window - 1) * (width / 4),
                0.2 + floor * 0.3,
                depth / 2 + 0.01
              ]}
            >
              <planeGeometry args={[0.12, 0.15]} />
              <meshStandardMaterial 
                color="#FFD700" 
                emissive="#FFD700"
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Rooftop */}
      <mesh position={[0, height + 0.05, 0]}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      
      {/* Rooftop details - antenna */}
      <mesh position={[0, height + 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Entrance */}
      <mesh position={[0, 0.15, depth / 2 + 0.02]}>
        <planeGeometry args={[0.2, 0.3]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
};
