import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Car, Plane, User, Play, Pause, RotateCcw } from 'lucide-react';
import { Agent, SimulationEvent, EventType } from '@/types/simulation';

interface ControlPanelProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onReset: () => void;
  onTriggerEvent: (type: EventType) => void;
  agents: Agent[];
  events: SimulationEvent[];
  modelType: 'local' | 'cerebras';
  onModelToggle: () => void;
}

export const ControlPanel = ({
  isRunning,
  onToggleSimulation,
  onReset,
  onTriggerEvent,
  agents,
  events,
  modelType,
  onModelToggle,
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
          <Button onClick={onReset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </Card>

      {/* Model Selection */}
      <Card className="p-4 bg-card border-border">
        <h2 className="text-lg font-semibold mb-3 text-foreground">LLM Model</h2>
        <div className="flex gap-2">
          <Button
            onClick={onModelToggle}
            variant={modelType === 'local' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
          >
            Local Model
          </Button>
          <Button
            onClick={onModelToggle}
            variant={modelType === 'cerebras' ? 'default' : 'outline'}
            className="flex-1"
            size="sm"
          >
            Cerebras
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Current: <span className="text-primary font-mono">{modelType}</span>
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
