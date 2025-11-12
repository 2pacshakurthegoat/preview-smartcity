import { useState, useEffect, useCallback, useRef } from 'react';
import { CityGrid } from '@/components/CityGrid';
import { ControlPanel } from '@/components/ControlPanel';
import { WorldState, EventType } from '@/types/simulation';
import { 
  createInitialWorld, 
  updateWorldState, 
  createEvent, 
  applyEventToWorld,
  applyDirectorInstructions
} from '@/lib/simulationEngine';
import { callDirectorLLM } from '@/lib/directorClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Package, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const Index = () => {
  const { toast } = useToast();
  const [worldState, setWorldState] = useState<WorldState>(createInitialWorld());
  const [isRunning, setIsRunning] = useState(false);
  const [modelType, setModelType] = useState<'local' | 'cerebras'>('local');
  const [directorStrategy, setDirectorStrategy] = useState<string>('');
  const [isDirectorEnabled, setIsDirectorEnabled] = useState(true);
  const [isDirectorProcessing, setIsDirectorProcessing] = useState(false);
  const directorIntervalRef = useRef<number | null>(null);

  // Director LLM coordination - runs every 5 seconds
  useEffect(() => {
    if (!isRunning || !isDirectorEnabled) {
      if (directorIntervalRef.current) {
        clearInterval(directorIntervalRef.current);
        directorIntervalRef.current = null;
      }
      return;
    }

    const runDirector = async () => {
      if (isDirectorProcessing) return; // Prevent overlapping calls
      
      setIsDirectorProcessing(true);
      try {
        console.log('Running Director analysis...');
        const response = await callDirectorLLM(worldState);
        
        if (response && response.instructions) {
          setWorldState(prevState => applyDirectorInstructions(prevState, response.instructions));
          setDirectorStrategy(response.globalStrategy || '');
          
          console.log('Director issued', response.instructions.length, 'instructions');
          toast({
            title: "Director Update",
            description: `Coordinating ${response.instructions.length} agents`,
          });
        }
      } catch (error) {
        console.error('Director error:', error);
        toast({
          title: "Director Error",
          description: error instanceof Error ? error.message : "Failed to coordinate agents",
          variant: "destructive",
        });
      } finally {
        setIsDirectorProcessing(false);
      }
    };

    // Run immediately, then every 5 seconds
    runDirector();
    const interval = window.setInterval(runDirector, 5000);
    directorIntervalRef.current = interval;

    return () => {
      if (directorIntervalRef.current) {
        clearInterval(directorIntervalRef.current);
        directorIntervalRef.current = null;
      }
    };
  }, [isRunning, isDirectorEnabled, worldState.events.length, worldState.roads, toast]);

  // Simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setWorldState(prevState => updateWorldState(prevState));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleToggleSimulation = useCallback(() => {
    setIsRunning(prev => !prev);
    toast({
      title: isRunning ? "Simulation Paused" : "Simulation Started",
      description: isRunning ? "All agents stopped" : "Agents are now moving",
    });
  }, [isRunning, toast]);

  const handleReset = useCallback(() => {
    setWorldState(createInitialWorld());
    setIsRunning(false);
    toast({
      title: "Simulation Reset",
      description: "World state restored to initial conditions",
    });
  }, [toast]);

  const handleTriggerEvent = useCallback((type: EventType) => {
    // Random position in the grid
    const randomPos = {
      x: Math.floor(Math.random() * worldState.gridSize),
      y: Math.floor(Math.random() * worldState.gridSize),
    };

    const descriptions = {
      accident: `Vehicle collision at (${randomPos.x}, ${randomPos.y})`,
      congestion: `Heavy traffic detected at (${randomPos.x}, ${randomPos.y})`,
      emergency: `Emergency response needed at (${randomPos.x}, ${randomPos.y})`,
    };

    const event = createEvent(type, randomPos, descriptions[type]);
    setWorldState(prevState => applyEventToWorld(prevState, event));

    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Event`,
      description: descriptions[type],
      variant: type === 'accident' ? 'destructive' : 'default',
    });
  }, [worldState.gridSize, toast]);

  const handleModelToggle = useCallback(() => {
    setModelType(prev => prev === 'local' ? 'cerebras' : 'local');
    toast({
      title: "Model Switched",
      description: `Now using ${modelType === 'local' ? 'Cerebras' : 'Local'} model`,
    });
  }, [modelType, toast]);

  return (
    <div className="min-h-screen bg-background grid-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary glow-primary">
                Smart City Multi-Agent Simulation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                LLM-Coordinated Traffic Management System
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/gallery">
                <Button variant="outline" className="gap-2">
                  <Package className="w-4 h-4" />
                  Models
                </Button>
              </Link>
              <Button 
                variant={isDirectorEnabled ? "default" : "outline"}
                onClick={() => {
                  setIsDirectorEnabled(!isDirectorEnabled);
                  toast({
                    title: isDirectorEnabled ? "Director Disabled" : "Director Enabled",
                    description: isDirectorEnabled ? "Manual control active" : "AI coordination active",
                  });
                }}
                className="gap-2"
              >
                <Brain className="w-4 h-4" />
                Director {isDirectorEnabled ? 'ON' : 'OFF'}
              </Button>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Active Agents</div>
                <div className="text-2xl font-bold font-mono text-primary">
                  {worldState.agents.length}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Events</div>
                <div className="text-2xl font-bold font-mono text-accent">
                  {worldState.events.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
          {/* 3D Visualization */}
          <div className="lg:col-span-3 bg-card border border-border rounded-lg overflow-hidden glow-primary relative">
            <CityGrid worldState={worldState} />
            
            {/* Director Strategy Overlay */}
            {isDirectorEnabled && directorStrategy && (
              <Card className="absolute top-4 left-4 right-4 p-3 bg-card/90 backdrop-blur-sm border-primary/30 max-w-2xl">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Director Strategy:</p>
                    <p className="text-xs text-muted-foreground mt-1">{directorStrategy}</p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Processing Indicator */}
            {isDirectorProcessing && (
              <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-sm border border-primary rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-primary font-semibold">Director Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1 overflow-y-auto">
            <ControlPanel
              isRunning={isRunning}
              onToggleSimulation={handleToggleSimulation}
              onReset={handleReset}
              onTriggerEvent={handleTriggerEvent}
              agents={worldState.agents}
              events={worldState.events}
              modelType={modelType}
              onModelToggle={handleModelToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
