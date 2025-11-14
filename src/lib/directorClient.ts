// Client-side OpenAI-compatible Director client (no Supabase)
import { WorldState, DirectorResponse } from '@/types/simulation';

export const validateLLM = async (opts?: { baseUrl?: string; model?: string; apiKey?: string }): Promise<{ ok: boolean; provider: string; model: string }> => {
  const baseUrl = opts?.baseUrl || import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.cerebras.ai/v1';
  const model = opts?.model || import.meta.env.VITE_OPENAI_MODEL || 'gpt-oss-120b';
  const apiKey = opts?.apiKey || import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) throw new Error('API Key is not set');

  const response = await fetch(`${baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  // We just check reachability and return the chosen model
  return { ok: response.ok, provider: baseUrl, model };
};

const summarizeWorldState = (state: WorldState, sampleSize: number = 50) => {
  // Summarize to avoid context length limits
  return {
    gridSize: state.gridSize,
    agentCount: state.agents.length,
    agents: state.agents.slice(0, sampleSize).map(a => ({ // Sample first N agents
      id: a.id,
      type: a.type,
      position: a.position,
      status: a.status,
    })),
    events: state.events.map(e => ({ type: e.type, position: e.position, description: e.description })),
    roads: state.roads.filter(r => r.status !== 'open').slice(0, 30).map(r => ({ // Only problematic roads
      from: r.from,
      to: r.to,
      status: r.status,
    })),
    assets: (state.assets || []).map(a => ({ kind: a.kind, position: a.position })),
    buildingCount: state.buildings.length,
  };
};

export const callDirectorLLM = async (worldState: WorldState, opts?: { baseUrl?: string; model?: string; prompt?: string; sampleSize?: number; apiKey?: string }): Promise<DirectorResponse> => {
  const baseUrl = opts?.baseUrl || import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.cerebras.ai/v1';
  const model = opts?.model || import.meta.env.VITE_OPENAI_MODEL || 'gpt-oss-120b';
  const apiKey = opts?.apiKey || import.meta.env.VITE_OPENAI_API_KEY as string;

  if (!apiKey) {
    throw new Error('API Key is not set');
  }

  try {
    console.log('Calling Director LLM with world state...');
    
    const tools = [
      {
        type: 'function',
        function: {
          name: 'control_agents',
          description: 'Give instructions to agents (cars/NPCs) to move, stop, reroute, or respond to emergencies',
          parameters: {
            type: 'object',
            properties: {
              instructions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    agentId: { type: 'string', description: 'Agent ID (e.g. car-1, npc-45)' },
                    action: { type: 'string', enum: ['move', 'stop', 'reroute', 'emergency_response', 'patrol'] },
                    target: { 
                      type: 'object', 
                      properties: { x: { type: 'number' }, y: { type: 'number' } },
                      description: 'Target position (optional)'
                    },
                    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                    reasoning: { type: 'string', description: 'Why this action' }
                  },
                  required: ['agentId', 'action']
                }
              }
            },
            required: ['instructions']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'spawn_assets',
          description: 'Spawn assets: fires, ambulances, police_barriers, traffic_cones, destroyed_buildings, repair_cranes, police_cars, fire_trucks, street_lights, benches, trees, dumpsters',
          parameters: {
            type: 'object',
            properties: {
              assets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    kind: { type: 'string', enum: ['fire', 'destroyed_building', 'police_barrier', 'traffic_cone', 'ambulance', 'repair_crane', 'police_car', 'fire_truck', 'street_light', 'bench', 'tree', 'dumpster'] },
                    position: { 
                      type: 'object', 
                      properties: { x: { type: 'number' }, y: { type: 'number' } },
                      required: ['x', 'y']
                    },
                    ttl: { type: 'number', description: 'Time to live in ticks (optional, default 1500)' }
                  },
                  required: ['kind', 'position']
                }
              }
            },
            required: ['assets']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'remove_assets',
          description: 'Remove assets by kind or position',
          parameters: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['fire', 'destroyed_building', 'police_barrier', 'traffic_cone', 'ambulance', 'repair_crane', 'police_car', 'fire_truck', 'street_light', 'bench', 'tree', 'dumpster'], description: 'Remove all of this kind' },
              position: { 
                type: 'object', 
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                description: 'Remove assets near this position (within 5 units)'
              }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'modify_roads',
          description: 'Change road status (open, congested, blocked)',
          parameters: {
            type: 'object',
            properties: {
              changes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    from: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] },
                    to: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] },
                    status: { type: 'string', enum: ['open', 'congested', 'blocked'] }
                  },
                  required: ['from', 'to', 'status']
                }
              }
            },
            required: ['changes']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'trigger_earthquake',
          description: 'Trigger earthquake effect that shakes the entire world',
          parameters: {
            type: 'object',
            properties: {
              intensity: { type: 'string', enum: ['mild', 'moderate', 'severe'], description: 'Earthquake intensity' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'set_strategy',
          description: 'Set the global strategy message to display to users',
          parameters: {
            type: 'object',
            properties: {
              strategy: { type: 'string', description: 'Strategy description' }
            },
            required: ['strategy']
          }
        }
      }
    ];
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: `You are the Director AI for a Smart City Simulation controlling ${worldState.agents.length} agents in a ${worldState.gridSize}x${worldState.gridSize} city.

Use the provided tools to:
1. control_agents: Direct cars/NPCs to move, stop, or respond
2. spawn_assets: Add emergency assets (fires, ambulances, barriers, etc)
3. trigger_earthquake: Shake the world for earthquake scenarios
4. set_strategy: Describe your plan to users

Current situation: ${opts?.prompt || 'Normal operations'}

Always respond with tool calls to handle the scenario.`
          },
          { 
            role: 'user', 
            content: `World State: ${JSON.stringify(summarizeWorldState(worldState, opts?.sampleSize || 50))}

User Request: ${opts?.prompt || 'Coordinate traffic flow'}

Use tools to implement this scenario.`
          }
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Director LLM HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    
    // Parse tool calls from response
    const toolCalls = data.choices?.[0]?.message?.tool_calls || [];
    
    let parsed: DirectorResponse = {
      instructions: [],
      assetsOps: [],
      shakeWorld: false,
      globalStrategy: '',
    };

    // Process each tool call
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name;
      const args = JSON.parse(toolCall.function?.arguments || '{}');
      
      console.log(`Tool called: ${functionName}`, args);
      
      switch (functionName) {
        case 'control_agents':
          if (args.instructions) {
            parsed.instructions.push(...args.instructions);
          }
          break;
          
        case 'spawn_assets':
          if (args.assets) {
            parsed.assetsOps = parsed.assetsOps || [];
            args.assets.forEach((asset: any) => {
              parsed.assetsOps!.push({
                op: 'add',
                kind: asset.kind,
                position: asset.position,
                ttl: asset.ttl || 1500
              });
            });
          }
          break;
        
        case 'remove_assets':
          parsed.assetsOps = parsed.assetsOps || [];
          if (args.kind) {
            parsed.assetsOps.push({ op: 'remove', kind: args.kind });
          }
          if (args.position) {
            parsed.assetsOps.push({ op: 'remove', position: args.position, radius: 5 });
          }
          break;
        
        case 'modify_roads':
          if (args.changes) {
            parsed.roadChanges = args.changes;
          }
          break;
          
        case 'trigger_earthquake':
          parsed.shakeWorld = true;
          break;
          
        case 'set_strategy':
          parsed.globalStrategy = args.strategy || '';
          break;
      }
    }
    
    // Fallback if no tool calls (old-style JSON response)
    if (toolCalls.length === 0) {
      const aiResponse = data.choices?.[0]?.message?.content || '';
      try {
        let cleaned = aiResponse.trim();
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }
        const oldFormat = JSON.parse(cleaned);
        parsed.instructions = oldFormat.instructions || [];
        parsed.assetsOps = oldFormat.assetsOps || [];
        parsed.shakeWorld = oldFormat.shakeWorld || false;
        parsed.globalStrategy = oldFormat.globalStrategy || '';
      } catch (e) {
        console.warn('No tool calls and failed to parse JSON, using defaults');
      }
    }

    console.log('Director response:', parsed);
    return parsed;
  } catch (error) {
    console.error('Failed to call Director LLM:', error);
    throw error;
  }
};
