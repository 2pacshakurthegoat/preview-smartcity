import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Car, Plane, User, Play, Pause, RotateCcw } from 'lucide-react';
import { Agent, SimulationEvent, EventType } from '@/types/simulation';

interface ControlPanelProps {
  // LLM
  apiKey: string;
  onChangeApiKey: (key: string) => void;
  providerBaseUrl: string;
  modelId: string;
  onValidateLLM: () => void;
  onChangeBaseUrl: (url: string) => void;
  onChangeModelId: (model: string) => void;
  isRunning: boolean;
  onToggleSimulation: () => void;
  onTriggerEvent: (type: EventType) => void;
  agents: Agent[];
  events: SimulationEvent[];
  modelType: 'cerebras' | 'openai';
  onModelToggle: () => void;
  userPrompt: string;
  onChangePrompt: (val: string) => void;
  onSubmitPrompt: () => void;
  onApplyPreset: (preset: string) => void;
  agentSampleSize: number;
  onChangeAgentSampleSize: (size: number) => void;
}

export const ControlPanel = ({
  apiKey,
  onChangeApiKey,
  providerBaseUrl,
  modelId,
  onValidateLLM,
  onChangeBaseUrl,
  onChangeModelId,
  isRunning,
  onToggleSimulation,
  onTriggerEvent,
  agents,
  events,
  modelType,
  onModelToggle,
  userPrompt,
  onChangePrompt,
  onSubmitPrompt,
  onApplyPreset,
  agentSampleSize,
  onChangeAgentSampleSize,
}: ControlPanelProps) => {
  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'car': return <Car className="w-4 h-4" />;
      case 'drone': return <Plane className="w-4 h-4" />;
      case 'npc': return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'moving': return 'bg-primary text-primary-foreground';
      case 'idle': return 'bg-muted text-muted-foreground';
      case 'stopped': return 'bg-warning text-warning-foreground';
      case 'emergency': return 'bg-destructive text-destructive-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Changes Made */}
      <Card className="p-4 bg-card border-primary/20 glow-primary">
        <h2 className="text-lg font-semibold mb-3 text-primary">📝 Recent Changes</h2>
        <div className="text-xs space-y-1 text-muted-foreground max-h-32 overflow-y-auto">
          <div>✅ Added 6 new models: Police Car, Fire Truck, Street Light, Bench, Tree, Dumpster</div>
          <div>✅ Added function calling tools for Director LLM</div>
          <div>✅ Added remove_assets & modify_roads tools</div>
          <div>✅ Added About & Reset buttons in header</div>
          <div>✅ Enhanced all 6 emergency asset models (2-5x detail)</div>
          <div>✅ Added API key input in settings</div>
          <div>✅ Agent sample size now configurable (10-500)</div>
        </div>
      </Card>

      {/* Simulation Controls */}
      <Card className="p-4 bg-card border-primary/20 glow-primary">
        <h2 className="text-lg font-semibold mb-3 text-primary">Simulation Control</h2>
        <div className="flex gap-2">
          <Button
            onClick={onToggleSimulation}
            variant={isRunning ? 'destructive' : 'default'}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* LLM Settings */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">LLM Settings</h2>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">API Key</div>
            <Input
              type="password"
              value={apiKey}
              onChange={e => onChangeApiKey(e.target.value)}
              placeholder="sk-... or csk-..."
              className="font-mono"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Base URL</div>
            <Input
              value={providerBaseUrl}
              onChange={e => onChangeBaseUrl(e.target.value)}
              placeholder="https://api.cerebras.ai/v1"
              className="font-mono"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Model</div>
            <Input
              value={modelId}
              onChange={e => onChangeModelId(e.target.value)}
              placeholder="gpt-oss-120b"
              className="font-mono"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Agent Sample Size (for Director)</div>
            <Input
              type="number"
              value={agentSampleSize}
              onChange={e => onChangeAgentSampleSize(parseInt(e.target.value) || 50)}
              placeholder="50"
              min="10"
              max="500"
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground mt-1">Higher = more context, but may exceed token limits</div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={onValidateLLM}>Test Connection</Button>
        </div>
      </Card>

      {/* Natural Language Scenario */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Scenario Prompt</h2>
        <Textarea
          value={userPrompt}
          onChange={e => onChangePrompt(e.target.value)}
          placeholder="Describe the situation (e.g., 'Rush hour in the north-east, accident near (12,8), prioritize emergency vehicles.')."
          className="font-mono text-xs min-h-[90px]"
        />
        <div className="flex flex-col gap-2 mt-3">
          <Button size="sm" onClick={onSubmitPrompt}>Apply Scenario</Button>
          <div className="text-xs text-muted-foreground mb-1">Quick Presets:</div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => onApplyPreset('rush_hour')}>Rush Hour</Button>
            <Button size="sm" variant="outline" onClick={() => onApplyPreset('multi_car_pileup')}>Multi-Car Pileup</Button>
            <Button size="sm" variant="outline" onClick={() => onApplyPreset('building_collapse')}>Building Collapse</Button>
            <Button size="sm" variant="outline" onClick={() => onApplyPreset('earthquake')}>Earthquake</Button>
          </div>
        </div>
      </Card>

      {/* Provider Selection */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">LLM Provider</h2>
        <div className="flex gap-2">
          <Button
            onClick={onModelToggle}
            variant={modelType === 'cerebras' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
          >
            Cerebras
          </Button>
          <Button
            onClick={onModelToggle}
            variant={modelType === 'openai' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
          >
            OpenAI-compatible
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Current: <span className="text-primary font-mono">{modelType === 'cerebras' ? 'Cerebras' : 'OpenAI-compatible'}</span>
        </p>
      </Card>

      {/* Event Triggers */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Trigger Events</h2>
        <div className="space-y-2">
          <Button
            onClick={() => onTriggerEvent('accident')}
            variant="outline"
            className="w-full justify-start border-destructive/50 hover:bg-destructive/10"
            size="sm"
          >
            <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
            Accident
          </Button>
          <Button
            onClick={() => onTriggerEvent('congestion')}
            variant="outline"
            className="w-full justify-start border-warning/50 hover:bg-warning/10"
            size="sm"
          >
            <AlertCircle className="w-4 h-4 mr-2 text-warning" />
            Congestion
          </Button>
          <Button
            onClick={() => onTriggerEvent('emergency')}
            variant="outline"
            className="w-full justify-start border-accent/50 hover:bg-accent/10"
            size="sm"
          >
            <AlertCircle className="w-4 h-4 mr-2 text-accent" />
            Emergency
          </Button>
        </div>
      </Card>

      {/* Agent Status */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Agent Status</h2>
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getAgentIcon(agent.type)}
                <span className="font-mono text-xs">{agent.id}</span>
              </div>
              <Badge variant="outline" className={getStatusColor(agent.status)}>
                {agent.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Events */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Event Log</h2>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {events.slice(-5).reverse().map(event => (
            <div key={event.id} className="text-xs font-mono p-2 bg-muted rounded border-l-2 border-primary">
              <div className="text-primary">[{new Date(event.timestamp).toLocaleTimeString()}]</div>
              <div className="text-muted-foreground">{event.description}</div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No events yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
