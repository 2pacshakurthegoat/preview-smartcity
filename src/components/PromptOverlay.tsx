import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptOverlayProps {
  open: boolean;
  prompt: string;
  onChange: (val: string) => void;
  onApply: () => void;
  onClose: () => void;
}

// A floating, centered prompt box with a glassy panel and subtle glow
export const PromptOverlay: React.FC<PromptOverlayProps> = ({ open, prompt, onChange, onApply, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-4 p-4 sm:p-6 rounded-2xl border bg-gradient-to-b from-background/80 to-background/60 shadow-2xl border-border">
        <div className="absolute -inset-0.5 rounded-2xl pointer-events-none bg-gradient-to-r from-primary/20 via-primary/5 to-transparent blur-2xl" />
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Scenario Prompt</h2>
          <p className="text-sm text-muted-foreground mb-3">Describe a situation for the Director to coordinate (e.g. “Rush hour in the NE, accident near (12,8), prioritize emergency vehicles”).</p>
          <Textarea
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe the situation..."
            className="font-mono text-sm min-h-[140px] bg-background/70 border-border focus-visible:ring-primary"
          />
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={onApply}>Apply Scenario</Button>
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOverlay;
