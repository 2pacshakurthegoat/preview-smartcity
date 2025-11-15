import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarModel } from '@/components/models/CarModel';
import { DroneModel } from '@/components/models/DroneModel';
import { NPCModel } from '@/components/models/NPCModel';
import { BuildingModel } from '@/components/models/BuildingModel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ModelShowcase = ({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode 
}) => {
  return (
    <Card className="p-4 bg-card border-primary/20">
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="h-64 bg-background rounded-lg overflow-hidden border border-border">
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }} shadows>
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[5, 5, 5]} 
            intensity={1} 
            color="#00D9FF" 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-5, 5, -5]} intensity={0.6} color="#FF8A00" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          {children}
          <OrbitControls enablePan={false} enableZoom={true} />
        </Canvas>
      </div>
    </Card>
  );
};

const FireModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.2, 0]}><coneGeometry args={[0.28, 0.7, 12]} /><meshStandardMaterial color="#FF2200" emissive="#FF2200" emissiveIntensity={2.0} transparent opacity={0.9} /></mesh>
    <mesh position={[0, 0.28, 0.08]}><coneGeometry args={[0.18, 0.55, 8]} /><meshStandardMaterial color="#FF6600" emissive="#FF6600" emissiveIntensity={1.6} transparent opacity={0.8} /></mesh>
    <mesh position={[0, 0.45, 0]}><coneGeometry args={[0.12, 0.4, 8]} /><meshStandardMaterial color="#FFAA00" emissive="#FFAA00" emissiveIntensity={2.2} transparent opacity={0.75} /></mesh>
    <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#FFFF88" emissive="#FFFFFF" emissiveIntensity={2.8} transparent opacity={0.6} /></mesh>
    <mesh position={[0, 0.7, 0]}><sphereGeometry args={[0.22, 10, 10]} /><meshStandardMaterial color="#2a2a2a" transparent opacity={0.5} /></mesh>
    <pointLight position={[0, 0.3, 0]} color="#FF5500" intensity={3} distance={4} />
  </group>
);

const DestroyedBuildingModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.1, 0]} rotation={[0.12, 0.35, 0.08]}><boxGeometry args={[0.6, 0.25, 0.5]} /><meshStandardMaterial color="#3a3a3a" roughness={0.95} /></mesh>
    <mesh position={[0.25, 0.18, -0.12]} rotation={[0.25, -0.45, 0.35]}><boxGeometry args={[0.28, 0.42, 0.1]} /><meshStandardMaterial color="#2a2a2a" roughness={0.95} /></mesh>
    <mesh position={[-0.18, 0.06, 0.14]} rotation={[0.18, 0.75, -0.25]}><boxGeometry args={[0.22, 0.15, 0.18]} /><meshStandardMaterial color="#4a4a4a" roughness={1} /></mesh>
    <mesh position={[0.18, 0.3, 0.02]} rotation={[0.45, 0, 0.28]}><cylinderGeometry args={[0.012, 0.012, 0.38, 8]} /><meshStandardMaterial color="#704214" metalness={0.75} /></mesh>
    <mesh position={[0, 0.18, 0]}><sphereGeometry args={[0.42, 12, 12]} /><meshStandardMaterial color="#8a8a8a" transparent opacity={0.18} /></mesh>
  </group>
);

const PoliceBarrierModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[-0.28, 0.09, 0]}><cylinderGeometry args={[0.028, 0.032, 0.2, 12]} /><meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.4} /></mesh>
    <mesh position={[0.28, 0.09, 0]}><cylinderGeometry args={[0.028, 0.032, 0.2, 12]} /><meshStandardMaterial color="#0a0a0a" roughness={0.5} metalness={0.4} /></mesh>
    <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.6, 0.1, 0.08]} /><meshStandardMaterial color="#FFD700" roughness={0.15} metalness={0.5} /></mesh>
    <mesh position={[-0.18, 0.17, 0.041]}><boxGeometry args={[0.12, 0.08, 0.002]} /><meshStandardMaterial color="#000000" /></mesh>
    <mesh position={[0, 0.17, 0.041]}><boxGeometry args={[0.12, 0.08, 0.002]} /><meshStandardMaterial color="#000000" /></mesh>
    <mesh position={[0.18, 0.17, 0.041]}><boxGeometry args={[0.12, 0.08, 0.002]} /><meshStandardMaterial color="#000000" /></mesh>
    <mesh position={[-0.28, 0.14, 0.03]}><boxGeometry args={[0.035, 0.05, 0.002]} /><meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.8} /></mesh>
    <pointLight position={[-0.28, 0.14, 0.05]} color="#FF0000" intensity={0.8} distance={1.2} />
  </group>
);

const TrafficConeModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.008, 0]}><boxGeometry args={[0.16, 0.018, 0.16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.108, 0.14, 16]} /><meshStandardMaterial color="#FF4400" roughness={0.25} /></mesh>
    <mesh position={[0, 0.18, 0]}><coneGeometry args={[0.088, 0.12, 16]} /><meshStandardMaterial color="#FF5500" roughness={0.25} /></mesh>
    <mesh position={[0, 0.075, 0]}><cylinderGeometry args={[0.11, 0.11, 0.035, 16]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} roughness={0.05} /></mesh>
    <mesh position={[0, 0.165, 0]}><cylinderGeometry args={[0.095, 0.095, 0.032, 16]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} roughness={0.05} /></mesh>
    <mesh position={[0, 0.32, 0]}><sphereGeometry args={[0.032, 12, 12]} /><meshStandardMaterial color="#FF3300" roughness={0.15} /></mesh>
  </group>
);

const AmbulanceModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.52, 0.26, 0.3]} /><meshStandardMaterial color="#F5F5F5" roughness={0.15} metalness={0.4} /></mesh>
    <mesh position={[0.18, 0.2, 0]} castShadow><boxGeometry args={[0.22, 0.16, 0.28]} /><meshStandardMaterial color="#F0F0F0" roughness={0.15} metalness={0.4} /></mesh>
    <mesh position={[0, 0.13, 0.152]}><boxGeometry args={[0.53, 0.08, 0.002]} /><meshStandardMaterial color="#CC0000" roughness={0.25} metalness={0.2} /></mesh>
    <mesh position={[0, 0.19, 0.152]}><boxGeometry args={[0.53, 0.03, 0.002]} /><meshStandardMaterial color="#FF6600" roughness={0.25} /></mesh>
    <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.35, 0.05, 0.12]} /><meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} /></mesh>
    <mesh position={[-0.12, 0.28, 0.03]}><boxGeometry args={[0.1, 0.04, 0.06]} /><meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[0.12, 0.28, 0.03]}><boxGeometry args={[0.1, 0.04, 0.06]} /><meshStandardMaterial color="#0055FF" emissive="#0055FF" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[0.18, 0.035, 0.16]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[0.18, 0.035, -0.16]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[-0.18, 0.035, 0.16]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[-0.18, 0.035, -0.16]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[0, 0.16, 0.153]}><boxGeometry args={[0.05, 0.15, 0.002]} /><meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} /></mesh>
    <mesh position={[0, 0.16, 0.153]}><boxGeometry args={[0.15, 0.05, 0.002]} /><meshStandardMaterial color="#CC0000" emissive="#CC0000" emissiveIntensity={0.2} /></mesh>
    <pointLight position={[-0.12, 0.28, 0]} color="#FF0000" intensity={1.2} distance={2.5} />
    <pointLight position={[0.12, 0.28, 0]} color="#0055FF" intensity={1.0} distance={2.5} />
  </group>
);

const RepairCraneModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.025, 0]}><boxGeometry args={[0.45, 0.05, 0.45]} /><meshStandardMaterial color="#1a1a1a" roughness={0.75} metalness={0.3} /></mesh>
    <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.38, 0.18, 0.35]} /><meshStandardMaterial color="#FF9500" roughness={0.35} metalness={0.25} /></mesh>
    <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.042, 0.045, 0.3, 12]} /><meshStandardMaterial color="#FFD700" roughness={0.25} metalness={0.6} /></mesh>
    <mesh position={[0.28, 0.7, 0]} rotation={[0, 0, Math.PI/5.5]}><boxGeometry args={[0.58, 0.035, 0.038]} /><meshStandardMaterial color="#777777" roughness={0.35} metalness={0.65} /></mesh>
    <mesh position={[0.52, 0.58, 0]}><cylinderGeometry args={[0.008, 0.008, 0.24, 8]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
    <mesh position={[0.52, 0.42, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[0.035, 0.01, 10, 16]} /><meshStandardMaterial color="#FFD700" roughness={0.25} metalness={0.8} /></mesh>
    <mesh position={[0, 0.73, 0]}><sphereGeometry args={[0.028, 12, 12]} /><meshStandardMaterial color="#FF3300" emissive="#FF3300" emissiveIntensity={1.2} /></mesh>
    <pointLight position={[0, 0.73, 0]} color="#FF3300" intensity={0.8} distance={2} />
  </group>
);

const PoliceCarModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[0.5, 0.22, 0.28]} /><meshStandardMaterial color="#FFFFFF" roughness={0.15} metalness={0.5} /></mesh>
    <mesh position={[0.22, 0.1, 0]} rotation={[0, 0, -0.15]} castShadow><boxGeometry args={[0.08, 0.18, 0.28]} /><meshStandardMaterial color="#FFFFFF" roughness={0.15} metalness={0.5} /></mesh>
    <mesh position={[0.02, 0.2, 0]} castShadow><boxGeometry args={[0.24, 0.14, 0.26]} /><meshStandardMaterial color="#F5F5F5" roughness={0.15} metalness={0.45} /></mesh>
    <mesh position={[0, 0.11, 0.143]}><boxGeometry args={[0.52, 0.06, 0.002]} /><meshStandardMaterial color="#0055FF" roughness={0.2} metalness={0.3} /></mesh>
    <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.28, 0.04, 0.11]} /><meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} /></mesh>
    <mesh position={[-0.1, 0.285, 0.03]}><boxGeometry args={[0.07, 0.035, 0.05]} /><meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[0.1, 0.285, 0.03]}><boxGeometry args={[0.07, 0.035, 0.05]} /><meshStandardMaterial color="#0055FF" emissive="#0055FF" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[0.16, 0.035, 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.042, 0.042, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[0.16, 0.035, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.042, 0.042, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[-0.16, 0.035, 0.15]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.042, 0.042, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <mesh position={[-0.16, 0.035, -0.15]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.042, 0.042, 0.04, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.85} /></mesh>
    <pointLight position={[-0.1, 0.285, 0]} color="#FF0000" intensity={1.2} distance={2.5} />
    <pointLight position={[0.1, 0.285, 0]} color="#0055FF" intensity={1.0} distance={2.5} />
  </group>
);

const FireTruckModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.18, 0]} castShadow><boxGeometry args={[0.65, 0.35, 0.35]} /><meshStandardMaterial color="#CC0000" roughness={0.2} metalness={0.35} /></mesh>
    <mesh position={[0.25, 0.28, 0]} castShadow><boxGeometry args={[0.28, 0.2, 0.33]} /><meshStandardMaterial color="#CC0000" roughness={0.2} metalness={0.35} /></mesh>
    <mesh position={[0, 0.14, 0.177]}><boxGeometry args={[0.66, 0.08, 0.002]} /><meshStandardMaterial color="#FFFFFF" roughness={0.25} metalness={0.2} /></mesh>
    <mesh position={[0, 0.25, 0.177]}><boxGeometry args={[0.66, 0.04, 0.002]} /><meshStandardMaterial color="#FFD700" roughness={0.25} /></mesh>
    <mesh position={[0.1, 0.38, 0]} castShadow><boxGeometry args={[0.4, 0.05, 0.13]} /><meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} /></mesh>
    <mesh position={[-0.05, 0.39, 0.035]}><boxGeometry args={[0.12, 0.04, 0.06]} /><meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[0.15, 0.39, 0.035]}><boxGeometry args={[0.1, 0.04, 0.06]} /><meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.5} transparent opacity={0.9} /></mesh>
    <mesh position={[-0.22, 0.24, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.09, 0.09, 0.08, 16]} /><meshStandardMaterial color="#888888" metalness={0.75} roughness={0.3} /></mesh>
    <mesh position={[0.25, 0.05, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
    <mesh position={[0.25, 0.05, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
    <mesh position={[-0.2, 0.05, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
    <mesh position={[-0.2, 0.05, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.9} /></mesh>
    <pointLight position={[-0.05, 0.39, 0]} color="#FF0000" intensity={1.5} distance={3} />
    <pointLight position={[0.15, 0.39, 0]} color="#FFFFFF" intensity={1.2} distance={2.5} />
  </group>
);

const StreetLightModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.02, 0.025, 0.8, 12]} /><meshStandardMaterial color="#2a2a2a" metalness={0.6} /></mesh>
    <mesh position={[0.15, 0.82, 0]} rotation={[0, 0, Math.PI/6]}><boxGeometry args={[0.3, 0.05, 0.08]} /><meshStandardMaterial color="#3a3a3a" metalness={0.5} /></mesh>
    <mesh position={[0.28, 0.82, 0]}><boxGeometry args={[0.08, 0.08, 0.1]} /><meshStandardMaterial color="#FFFF88" emissive="#FFFF88" emissiveIntensity={1.5} /></mesh>
    <pointLight position={[0.28, 0.82, 0]} color="#FFFF88" intensity={2} distance={8} />
  </group>
);

const BenchModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.4, 0.03, 0.15]} /><meshStandardMaterial color="#8B4513" roughness={0.9} /></mesh>
    <mesh position={[0, 0.22, 0.06]}><boxGeometry args={[0.4, 0.2, 0.03]} /><meshStandardMaterial color="#8B4513" roughness={0.9} /></mesh>
  </group>
);

const TreeModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.04, 0.06, 0.3, 8]} /><meshStandardMaterial color="#4a2a1a" roughness={0.95} /></mesh>
    <mesh position={[0, 0.35, 0]}><coneGeometry args={[0.25, 0.4, 8]} /><meshStandardMaterial color="#2a5a1a" roughness={0.8} /></mesh>
    <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.2, 0.35, 8]} /><meshStandardMaterial color="#2a6a1a" roughness={0.8} /></mesh>
  </group>
);

const DumpsterModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.4, 0.3, 0.25]} /><meshStandardMaterial color="#2a5a2a" roughness={0.7} metalness={0.2} /></mesh>
    <mesh position={[0, 0.31, 0]}><boxGeometry args={[0.42, 0.02, 0.27]} /><meshStandardMaterial color="#1a4a1a" /></mesh>
  </group>
);

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState('vehicles');

  return (
    <div className="min-h-screen bg-background grid-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary glow-primary">
                3D Model Gallery
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Showcase of all simulation models
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Back to Simulation
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Gallery Grid */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="buildings">Buildings</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModelShowcase title="Car Model" description="Detailed vehicle with body, cabin, wheels, and headlights">
                <CarModel color="#00D9FF" position={[0, 0, 0]} isMoving={true} />
              </ModelShowcase>
              <ModelShowcase title="Emergency Car" description="Red vehicle variant for emergency services">
                <CarModel color="#FF3333" position={[0, 0, 0]} isMoving={false} />
              </ModelShowcase>
              <ModelShowcase title="Ambulance" description="Emergency medical vehicle">
                <AmbulanceModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Police Car" description="Emergency police vehicle with flashing lights">
                <PoliceCarModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Fire Truck" description="Emergency fire truck with ladder">
                <FireTruckModel position={[0, 0, 0]} />
              </ModelShowcase>
            </div>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModelShowcase title="Drone Model" description="Quadcopter with rotating propellers, camera, and LED indicators">
                <DroneModel color="#FF8A00" position={[0, 0.5, 0]} isFlying={true} />
              </ModelShowcase>
              <ModelShowcase title="Surveillance Drone" description="Security drone with green indicator light">
                <DroneModel color="#333333" position={[0, 0.5, 0]} isFlying={false} />
              </ModelShowcase>
              <ModelShowcase title="NPC/Person Model" description="Animated human character with walking motion">
                <NPCModel color="#0099FF" position={[0, 0, 0]} isWalking={true} />
              </ModelShowcase>
              <ModelShowcase title="Stationary Person" description="Person model in idle state">
                <NPCModel color="#FF6600" position={[0, 0, 0]} isWalking={false} />
              </ModelShowcase>
            </div>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModelShowcase title="Tall Building" description="Multi-story office building with lit windows">
                <BuildingModel position={[0, 0, 0]} height={2} color="#1a3a5a" />
              </ModelShowcase>
              <ModelShowcase title="Small Building" description="Residential or small commercial structure">
                <BuildingModel position={[0, 0, 0]} height={1} width={0.6} depth={0.6} color="#2a4a3a" />
              </ModelShowcase>
              <ModelShowcase title="Wide Building" description="Shopping mall or warehouse structure">
                <BuildingModel position={[0, 0, 0]} height={1.2} width={1.2} depth={0.8} color="#3a2a5a" />
              </ModelShowcase>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ModelShowcase title="Fire" description="Emissive fire effect for accidents and emergencies">
                <FireModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Destroyed Building" description="Collapsed building rubble for disaster scenarios">
                <DestroyedBuildingModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Police Barrier" description="Roadblock barrier for traffic control">
                <PoliceBarrierModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Traffic Cone" description="Safety cone for road work and incidents">
                <TrafficConeModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Repair Crane" description="Construction crane for building repairs">
                <RepairCraneModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Street Light" description="Illuminated street lamp">
                <StreetLightModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Park Bench" description="Wooden bench for city parks">
                <BenchModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Tree" description="City park tree with green foliage">
                <TreeModel position={[0, 0, 0]} />
              </ModelShowcase>
              <ModelShowcase title="Dumpster" description="Waste dumpster for city maintenance">
                <DumpsterModel position={[0, 0, 0]} />
              </ModelShowcase>
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="mt-8 p-6 bg-card border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Model Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-primary mb-2">Vehicles</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Cars feature realistic body, cabin, wheels, and headlights</li>
                <li>• Subtle bounce animation when moving</li>
                <li>• Metallic materials with reflections</li>
                <li>• Multiple color variants available</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Drones</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Quadcopter design with 4 rotating propellers</li>
                <li>• Hovering motion with tilt physics</li>
                <li>• Camera/sensor underneath</li>
                <li>• LED status indicator on top</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">People/NPCs</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Articulated humanoid model</li>
                <li>• Walking animation with arm/leg swing</li>
                <li>• Vertical bob motion when moving</li>
                <li>• Skin tone and clothing colors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Buildings</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Configurable height, width, and depth</li>
                <li>• Lit windows creating city atmosphere</li>
                <li>• Rooftop details including antennas</li>
                <li>• Entrance/doorway at ground level</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">World Assets</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Fire: Emissive flames for accidents</li>
                <li>• Destroyed Buildings: Collapsed rubble</li>
                <li>• Police Barriers: Traffic control</li>
                <li>• Traffic Cones: Safety markers</li>
                <li>• Ambulances: Emergency response</li>
                <li>• Repair Cranes: Construction equipment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-primary mb-2">Special Effects</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Director can spawn/remove assets dynamically</li>
                <li>• Assets have configurable TTL (time-to-live)</li>
                <li>• Earthquake effect shakes the entire world</li>
                <li>• Scenario presets combine multiple assets</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Gallery;
