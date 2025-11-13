import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CarModel } from '@/components/models/CarModel';
import { DroneModel } from '@/components/models/DroneModel';
import { NPCModel } from '@/components/models/NPCModel';
import { BuildingModel } from '@/components/models/BuildingModel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} color="#00D9FF" />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#FF8A00" />
          {children}
          <OrbitControls enablePan={false} enableZoom={true} />
        </Canvas>
      </div>
    </Card>
  );
};

const FireModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
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

const DestroyedBuildingModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
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

const PoliceBarrierModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[0.8, 0.1, 0.1]} />
      <meshStandardMaterial color="#FF0000" />
    </mesh>
    <mesh position={[0, 0.1, 0]}>
      <boxGeometry args={[0.8, 0.1, 0.1]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  </group>
);

const TrafficConeModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh>
      <coneGeometry args={[0.12, 0.25, 12]} />
      <meshStandardMaterial color="#FF7F00" />
    </mesh>
    <mesh position={[0, 0.08, 0]}>
      <torusGeometry args={[0.08, 0.02, 8, 16]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
  </group>
);

const AmbulanceModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[0.5, 0.2, 0.25]} />
      <meshStandardMaterial color="#FFFFFF" />
    </mesh>
    <mesh position={[0.2, 0.15, 0]}>
      <boxGeometry args={[0.2, 0.12, 0.2]} />
      <meshStandardMaterial color="#FF3333" />
    </mesh>
  </group>
);

const RepairCraneModel = ({ position = [0, 0, 0] as [number, number, number] }) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[0.4, 0.05, 0.2]} />
      <meshStandardMaterial color="#666" />
    </mesh>
    <mesh position={[0, 0.15, 0]}>
      <boxGeometry args={[0.05, 0.3, 0.05]} />
      <meshStandardMaterial color="#777" />
    </mesh>
    <mesh position={[0.15, 0.3, 0]}>
      <boxGeometry args={[0.3, 0.05, 0.05]} />
      <meshStandardMaterial color="#888" />
    </mesh>
  </group>
);

const Gallery = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Car Model */}
          <ModelShowcase
            title="Car Model"
            description="Detailed vehicle with body, cabin, wheels, and headlights"
          >
            <CarModel color="#00D9FF" position={[0, 0, 0]} isMoving={true} />
          </ModelShowcase>

          {/* Drone Model */}
          <ModelShowcase
            title="Drone Model"
            description="Quadcopter with rotating propellers, camera, and LED indicators"
          >
            <DroneModel color="#FF8A00" position={[0, 0.5, 0]} isFlying={true} />
          </ModelShowcase>

          {/* NPC Model */}
          <ModelShowcase
            title="NPC/Person Model"
            description="Animated human character with walking motion"
          >
            <NPCModel color="#0099FF" position={[0, 0, 0]} isWalking={true} />
          </ModelShowcase>

          {/* Building Model - Tall */}
          <ModelShowcase
            title="Tall Building"
            description="Multi-story office building with lit windows"
          >
            <BuildingModel position={[0, 0, 0]} height={2} color="#1a3a5a" />
          </ModelShowcase>

          {/* Building Model - Short */}
          <ModelShowcase
            title="Small Building"
            description="Residential or small commercial structure"
          >
            <BuildingModel position={[0, 0, 0]} height={1} width={0.6} depth={0.6} color="#2a4a3a" />
          </ModelShowcase>

          {/* Car Variant */}
          <ModelShowcase
            title="Emergency Vehicle"
            description="Red vehicle variant for emergency services"
          >
            <CarModel color="#FF3333" position={[0, 0, 0]} isMoving={false} />
          </ModelShowcase>

          {/* Drone Variant */}
          <ModelShowcase
            title="Surveillance Drone"
            description="Security drone with green indicator light"
          >
            <DroneModel color="#333333" position={[0, 0.5, 0]} isFlying={false} />
          </ModelShowcase>

          {/* NPC Variant */}
          <ModelShowcase
            title="Stationary Person"
            description="Person model in idle state"
          >
            <NPCModel color="#FF6600" position={[0, 0, 0]} isWalking={false} />
          </ModelShowcase>

          {/* Building Variant */}
          <ModelShowcase
            title="Wide Building"
            description="Shopping mall or warehouse structure"
          >
            <BuildingModel position={[0, 0, 0]} height={1.2} width={1.2} depth={0.8} color="#3a2a5a" />
          </ModelShowcase>

          {/* Fire */}
          <ModelShowcase
            title="Fire"
            description="Emissive fire effect for accidents and emergencies"
          >
            <FireModel position={[0, 0, 0]} />
          </ModelShowcase>

          {/* Destroyed Building */}
          <ModelShowcase
            title="Destroyed Building"
            description="Collapsed building rubble for disaster scenarios"
          >
            <DestroyedBuildingModel position={[0, 0, 0]} />
          </ModelShowcase>

          {/* Police Barrier */}
          <ModelShowcase
            title="Police Barrier"
            description="Roadblock barrier for traffic control"
          >
            <PoliceBarrierModel position={[0, 0, 0]} />
          </ModelShowcase>

          {/* Traffic Cone */}
          <ModelShowcase
            title="Traffic Cone"
            description="Safety cone for road work and incidents"
          >
            <TrafficConeModel position={[0, 0, 0]} />
          </ModelShowcase>

          {/* Ambulance */}
          <ModelShowcase
            title="Ambulance"
            description="Emergency medical vehicle"
          >
            <AmbulanceModel position={[0, 0, 0]} />
          </ModelShowcase>

          {/* Repair Crane */}
          <ModelShowcase
            title="Repair Crane"
            description="Construction crane for building repairs"
          >
            <RepairCraneModel position={[0, 0, 0]} />
          </ModelShowcase>
        </div>

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
