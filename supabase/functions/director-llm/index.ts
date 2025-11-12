import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorldState {
  agents: Array<{
    id: string;
    type: 'car' | 'drone' | 'npc';
    position: { x: number; y: number };
    destination: { x: number; y: number } | null;
    status: 'idle' | 'moving' | 'stopped' | 'emergency';
    speed: number;
  }>;
  roads: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    status: 'open' | 'congested' | 'blocked';
  }>;
  events: Array<{
    id: string;
    type: 'accident' | 'congestion' | 'emergency';
    position: { x: number; y: number };
    timestamp: number;
    description: string;
  }>;
  gridSize: number;
}

interface DirectorInstruction {
  agentId: string;
  action: 'move' | 'stop' | 'reroute' | 'emergency_response' | 'patrol';
  target?: { x: number; y: number };
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { worldState } = await req.json() as { worldState: WorldState };
    
    if (!worldState) {
      throw new Error('World state is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing world state with', worldState.agents.length, 'agents and', worldState.events.length, 'events');

    // Create a comprehensive system prompt for the Director
    const systemPrompt = `You are the Director AI for a Smart City Multi-Agent Simulation. Your role is to coordinate all agents (cars, drones, NPCs) to respond efficiently to city events.

CRITICAL RULES:
1. Return ONLY valid JSON, no markdown, no explanations
2. Every agent MUST receive an instruction
3. Priorities: emergency > congestion > normal traffic
4. Drones monitor accidents, cars reroute around blocked roads, NPCs evacuate emergencies

Analysis Guidelines:
- Blocked roads: Reroute affected vehicles immediately
- Accidents: Dispatch nearest drone to monitor, stop nearby vehicles
- Congestion: Spread traffic to alternative routes
- Emergency: High priority response, clear affected areas
- Idle agents: Assign patrol or standby positions

Return format:
{
  "instructions": [
    {
      "agentId": "string",
      "action": "move|stop|reroute|emergency_response|patrol",
      "target": {"x": number, "y": number},
      "priority": "low|medium|high",
      "reasoning": "brief explanation"
    }
  ],
  "globalStrategy": "overall coordination plan"
}`;

    // Build the user message with world state
    const userMessage = `Current city state:

AGENTS:
${worldState.agents.map(a => 
  `- ${a.id} (${a.type}): at (${a.position.x.toFixed(1)}, ${a.position.y.toFixed(1)}), status: ${a.status}, ` +
  (a.destination ? `going to (${a.destination.x}, ${a.destination.y})` : 'no destination')
).join('\n')}

ACTIVE EVENTS:
${worldState.events.length > 0 ? worldState.events.map(e => 
  `- ${e.type} at (${e.position.x}, ${e.position.y}): ${e.description}`
).join('\n') : 'No active events'}

ROAD STATUS:
${worldState.roads.filter(r => r.status !== 'open').map(r =>
  `- Road from (${r.from.x}, ${r.from.y}) to (${r.to.x}, ${r.to.y}): ${r.status}`
).join('\n') || 'All roads open'}

Analyze the situation and provide instructions for ALL agents to optimize city flow and respond to events.`;

    console.log('Calling Lovable AI for director analysis...');

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response received:', aiResponse.substring(0, 200));

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', aiResponse);
      
      // Return a fallback response
      parsedResponse = {
        instructions: worldState.agents.map(agent => ({
          agentId: agent.id,
          action: agent.status === 'moving' ? 'move' : 'patrol',
          target: agent.destination || { 
            x: Math.floor(Math.random() * worldState.gridSize),
            y: Math.floor(Math.random() * worldState.gridSize)
          },
          priority: 'low' as const,
          reasoning: 'Fallback instruction due to parsing error'
        })),
        globalStrategy: 'Continue normal operations with fallback instructions'
      };
    }

    console.log('Successfully generated', parsedResponse.instructions?.length || 0, 'instructions');

    return new Response(
      JSON.stringify(parsedResponse),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Director LLM error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
