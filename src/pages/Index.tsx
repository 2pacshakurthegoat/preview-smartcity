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
import { callDirectorLLM, validateLLM } from '@/lib/directorClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Package, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const Index = () => {
  const { toast } = useToast();
  const [worldState, setWorldState] = useState<WorldState>(createInitialWorld());
  const [isRunning, setIsRunning] = useState(false);
  const [modelType, setModelType] = useState<'cerebras' | 'openai'>('cerebras');
  const getDefaultBaseUrl = useCallback((mt: 'cerebras' | 'openai') => (
    mt === 'cerebras' ? (import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.cerebras.ai/v1') : (import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1')
  ), []);
  const [apiKey, setApiKey] = useState<string>(() => (
    localStorage.getItem('llm.apiKey') || (import.meta.env.VITE_OPENAI_API_KEY || '')
  ));
  const [providerBaseUrl, setProviderBaseUrl] = useState<string>(() => (
    localStorage.getItem('llm.baseUrl') || getDefaultBaseUrl('cerebras')
  ));
  const [modelId, setModelId] = useState<string>(() => (
    localStorage.getItem('llm.model') || (import.meta.env.VITE_OPENAI_MODEL || 'gpt-oss-120b')
  ));
  const [agentSampleSize, setAgentSampleSize] = useState<number>(() => (
    parseInt(localStorage.getItem('llm.agentSampleSize') || '50')
  ));
  const [directorStrategy, setDirectorStrategy] = useState<string>('');
  const [isDirectorEnabled, setIsDirectorEnabled] = useState(true);
  const [userPrompt, setUserPrompt] = useState<string>(() => localStorage.getItem('llm.prompt') || '');
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
        const response = await callDirectorLLM(worldState, {
          baseUrl: providerBaseUrl,
          model: modelId,
          prompt: userPrompt,
          sampleSize: agentSampleSize,
          apiKey: apiKey,
        });
        
        if (response && response.instructions) {
          setWorldState(prevState => applyDirectorInstructions(
            prevState, 
            response.instructions, 
            response.assetsOps, 
            response.shakeWorld
          ));
          setDirectorStrategy(response.globalStrategy || '');
          
          const assetMsg = response.assetsOps ? ` | ${response.assetsOps.length} asset ops` : '';
          const shakeMsg = response.shakeWorld ? ' | 🌍 EARTHQUAKE!' : '';
          console.log('Director issued', response.instructions.length, 'instructions', assetMsg, shakeMsg);
          toast({
            title: "Director Update",
            description: `Coordinating ${response.instructions.length} agents${assetMsg}${shakeMsg}`,
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

  // Simulation loop - reduced to 50ms for better performance
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setWorldState(prevState => updateWorldState(prevState));
    }, 50);

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

  const handleApplyPreset = useCallback(async (preset: string) => {
    const presets: Record<string, { prompt: string; assets?: any[]; shake?: boolean }> = {
      rush_hour: {
        prompt: 'Rush hour congestion in the city center. Heavy traffic everywhere. Optimize routing and prioritize emergency lanes.',
        assets: [],
      },
      multi_car_pileup: {
        prompt: 'Major multi-car pileup at position (50,50). Multiple fires and blocked roads. Send ambulances and set up police barriers.',
        assets: [
          { op: 'add', kind: 'fire', position: { x: 50, y: 50 }, ttl: 1500 },
          { op: 'add', kind: 'fire', position: { x: 51, y: 50 }, ttl: 1500 },
          { op: 'add', kind: 'ambulance', position: { x: 48, y: 50 }, ttl: 2000 },
          { op: 'add', kind: 'police_barrier', position: { x: 49, y: 49 }, ttl: 2000 },
          { op: 'add', kind: 'police_barrier', position: { x: 51, y: 51 }, ttl: 2000 },
        ],
      },
      building_collapse: {
        prompt: 'Building collapsed at (70,30). Deploy repair cranes, ambulances, and traffic cones around the perimeter. Reroute all traffic.',
        assets: [
          { op: 'add', kind: 'destroyed_building', position: { x: 70, y: 30 }, ttl: 3000 },
          { op: 'add', kind: 'repair_crane', position: { x: 69, y: 30 }, ttl: 3000 },
          { op: 'add', kind: 'ambulance', position: { x: 71, y: 30 }, ttl: 2500 },
          { op: 'add', kind: 'traffic_cone', position: { x: 68, y: 29 }, ttl: 2500 },
          { op: 'add', kind: 'traffic_cone', position: { x: 72, y: 31 }, ttl: 2500 },
        ],
      },
      earthquake: {
        prompt: 'EARTHQUAKE! Multiple buildings damaged across the city. Fires breaking out. All agents take emergency response actions.',
        shake: true,
        assets: [
          { op: 'add', kind: 'destroyed_building', position: { x: 30, y: 30 }, ttl: 5000 },
          { op: 'add', kind: 'destroyed_building', position: { x: 60, y: 60 }, ttl: 5000 },
          { op: 'add', kind: 'fire', position: { x: 40, y: 40 }, ttl: 3000 },
          { op: 'add', kind: 'fire', position: { x: 70, y: 20 }, ttl: 3000 },
        ],
      },
    };

    const selected = presets[preset];
    if (!selected) return;

    setUserPrompt(selected.prompt);
    localStorage.setItem('llm.prompt', selected.prompt);

    // Apply preset assets and effects immediately
    setWorldState(prevState => applyDirectorInstructions(
      prevState,
      [],
      selected.assets,
      selected.shake
    ));

    toast({
      title: 'Preset Applied',
      description: `${preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} scenario activated!`,
    });

    // Also call director with the prompt
    if (isDirectorEnabled && !isDirectorProcessing) {
      setIsDirectorProcessing(true);
      try {
        const response = await callDirectorLLM(worldState, { baseUrl: providerBaseUrl, model: modelId, prompt: selected.prompt, sampleSize: agentSampleSize });
        if (response.instructions) {
          setWorldState(prevState => applyDirectorInstructions(
            prevState,
            response.instructions,
            response.assetsOps,
            response.shakeWorld
          ));
          setDirectorStrategy(response.globalStrategy || '');
        }
      } catch (e) {
        console.error('Director call failed for preset:', e);
      } finally {
        setIsDirectorProcessing(false);
      }
    }
  }, [worldState, providerBaseUrl, modelId, isDirectorEnabled, isDirectorProcessing, toast]);

  const handleModelToggle = useCallback(() => {
    setModelType(prev => {
      const next = prev === 'cerebras' ? 'openai' : 'cerebras';
      const nextBase = getDefaultBaseUrl(next);
      setProviderBaseUrl(nextBase);
      localStorage.setItem('llm.baseUrl', nextBase);
      toast({
        title: 'Provider Switched',
        description: `Now using ${next === 'cerebras' ? 'Cerebras' : 'OpenAI-compatible'} API`,
      });
      return next;
    });
  }, [getDefaultBaseUrl, toast]);

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
            <CityGrid worldState={worldState} shake={(worldState.effects?.shake || 0) > 0} />
            
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
              providerBaseUrl={providerBaseUrl}
              modelId={modelId}
              onChangeBaseUrl={(url) => { setProviderBaseUrl(url); localStorage.setItem('llm.baseUrl', url); }}
              onChangeModelId={(model) => { setModelId(model); localStorage.setItem('llm.model', model); }}
              agentSampleSize={agentSampleSize}
              onChangeAgentSampleSize={(size) => { setAgentSampleSize(size); localStorage.setItem('llm.agentSampleSize', size.toString()); }}
              onValidateLLM={async () => {
                try {
                  const res = await validateLLM({ baseUrl: providerBaseUrl, model: modelId });
                  toast({ title: 'LLM Check', description: `OK=${res.ok} | Provider=${res.provider} | Model=${res.model}` });
                } catch (e) {
                  toast({ title: 'LLM Check Failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
                }
              }}
              isRunning={isRunning}
              onToggleSimulation={handleToggleSimulation}
              onReset={handleReset}
              onTriggerEvent={handleTriggerEvent}
              agents={worldState.agents}
              events={worldState.events}
              modelType={modelType}
              onModelToggle={handleModelToggle}
              userPrompt={userPrompt}
              onChangePrompt={(val) => { setUserPrompt(val); localStorage.setItem('llm.prompt', val); }}
              onApplyPreset={handleApplyPreset}
              onSubmitPrompt={async () => {
                // Immediately invoke director once with the new prompt
                if (isDirectorProcessing) return;
                setIsDirectorProcessing(true);
                try {
                  const response = await callDirectorLLM(worldState, { baseUrl: providerBaseUrl, model: modelId, prompt: userPrompt, sampleSize: agentSampleSize });
                  if (response.instructions) {
                    setWorldState(prevState => applyDirectorInstructions(
                      prevState,
                      response.instructions,
                      response.assetsOps,
                      response.shakeWorld
                    ));
                    setDirectorStrategy(response.globalStrategy || '');
                    const assetMsg = response.assetsOps ? ` + ${response.assetsOps.length} assets` : '';
                    const shakeMsg = response.shakeWorld ? ' + earthquake' : '';
                    toast({ title: 'Scenario Applied', description: `Director applied the scenario${assetMsg}${shakeMsg}.` });
                  }
                } catch (e) {
                  toast({ title: 'Scenario Failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
                } finally {
                  setIsDirectorProcessing(false);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
