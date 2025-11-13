# DONE and TODO Summary (Aligned to MVP)

**Last Updated:** After implementing Director-controlled assets, world shake effects, scenario presets, and full LLM integration.

## Purpose (from mvp.md)
Demonstrate a fully interactive smart city where a central LLM (Director) coordinates multiple agents (cars, drones, NPCs/characters) to respond to dynamic events (accidents, congestion, emergencies). The system can switch between lightweight local models and high-performance Cerebras-hosted LLMs.

## MVP Checklist

1) World Representation (5×5 grid or small road network with edge status)
- Done:
  - Road network with status (open/congested/blocked)
  - Events can affect road status and agent routing
- Not done / Differences:
  - Grid size is expanded to 100×100 (beyond MVP’s 5×5)
  - Nodes-as-intersections view is implicit (not explicitly visualized as graph nodes)

2) Agents (cars, drones, NPCs/characters). Each agent controlled by an LLM instance
- Done:
  - Cars and NPCs implemented with local state (position, destination, speed, status)
- Not done:
  - Drones removed from current build
  - Per-agent LLM control is not implemented (only Director LLM exists)

3) Director LLM (receives global world state every tick; outputs structured JSON; handles simple event logic)
- Done:
  - Supabase edge function `director-llm` accepts world state and returns JSON instructions
  - Frontend calls Director periodically and applies instructions
  - Event logic guidance included in system prompt and fallback logic implemented
- Not done / Differences:
  - Runs every 5 seconds, not every tick
  - No visible per-instruction overlay/log for verification (only strategy text + toast)

4) Agent LLM (receives local state + Director instructions; returns JSON actions)
- Done:
  - None (agents are controlled by simulation logic, not per-agent LLMs)
- Not done:
  - Need per-agent LLM stub (local model) and plumbing to translate Director directives into agent-level LLM actions

5) Simulation Loop (tick-based; updates positions, events, road status; collisions/roadblocks)
- Done:
  - Tick-based updates drive agent movement
  - Events are created from UI and applied to world/roads
- Not done / Partial:
  - Collision handling is minimal/basic
  - More explicit road-status propagation and rerouting diagnostics would help

6) 3D Visualization (R3F/Three.js; color-coded nodes/roads; simple agent models; optional WebSocket)
- Done:
  - R3F scene renders roads, agents (cars/NPCs), and buildings
  - Color coding and materials in place; interactive camera + controls
- Not done / Optional:
  - No WebSocket live feed (current loop is client-side)
  - Nodes-as-intersections visualization is not explicit

7) Model Selection Toggle (switch between local model and Cerebras LLM)
- Done:
  - UI toggle exists (local ↔ cerebras)
- Not done:
  - Toggle isn’t wired to the Director backend/model choice; server always calls a single provider
  - No local small-model path is implemented

8) Interactive Demo (trigger events; Director replans; agents reroute; live status)
- Done:
  - Users can trigger accidents/congestion/emergencies
  - Director returns instructions; instructions applied; agents move
  - Strategy text shown; toasts confirm updates
- Not done / Nice-to-have:
  - Rich overlay showing last N instructions, impacted agents, and outcome

## Additional Work Done (outside MVP scope)
- Massive world scale (100×100), 400+ buildings, 500 agents
- Performance tuning and UI polish for large scene
- Fixed runtime error in NPCModel by migrating Three.js geometry creation to ESM imports
- **Client-side AI Integration** (Cerebras/OpenAI-compatible)
  - Director LLM calls OpenAI-compatible API directly from browser
  - Configurable Base URL, Model ID, and API Key (persisted to localStorage)
  - Model: gpt-oss-120b (default)
  - Test Connection validation UI
  - Natural language scenario prompt input
  - User can type situations and Director applies instructions immediately
- **World Assets System**
  - AssetKind types: fire, destroyed_building, police_barrier, traffic_cone, ambulance, repair_crane
  - Assets have position and optional TTL (auto-expire after N ticks)
  - Director can spawn/remove assets via DirectorInstructionAssetOp (op: 'add'|'remove')
  - Events (accidents/emergencies) auto-spawn assets (fires, rubble)
  - Primitive-based 3D models for all asset types (performance optimized)
- **World Shake Effect (Earthquake)**
  - Director can trigger shakeWorld flag
  - Scene shakes for ~10 seconds with decaying intensity
  - Earthquake preset creates multiple destroyed buildings and fires
- **Scenario Presets**
  - Rush Hour: congestion prompt
  - Multi-Car Pileup: fires, ambulances, police barriers
  - Building Collapse: destroyed building, repair crane, traffic cones
  - Earthquake: world shake + multiple fires and destroyed buildings
  - Presets apply assets immediately + call Director with prompt
- **Gallery Page Enhanced**
  - All new asset models displayed (Fire, Destroyed Building, Police Barrier, Traffic Cone, Ambulance, Repair Crane)
  - Documentation for World Assets and Special Effects sections

## Next Steps to Align with MVP
1) Wire model selection toggle end-to-end
   - Frontend: Pass selected model to `callDirectorLLM`
   - Backend: Support local small model (mock or embedded rules) and a Cerebras path (or existing gateway model param)
   - Config: Allow selecting provider/model via env/params

2) Optional but strongly aligned: reintroduce a minimal Drone agent
   - Basic drone entity with patrol/monitor actions used by Director for accidents
   - Simple visualization (sphere or small box) and behavior rules

3) Per-agent LLM (MVP-scaled)
   - Implement a lightweight per-agent decision stub: accept local state + Director directive → produce JSON action (`move/stop/reroute`)
   - Start with a deterministic local function; later swap to actual small model

4) Director cadence & observability
   - Option A: run every tick for small MVP grid; Option B: keep 5s but note difference
   - Add instruction overlay: list last N instructions, per-agent action and priority
   - Add debug panel to verify reroutes vs. events/road statuses

5) Simulation loop robustness
   - Add basic collision avoidance between agents (simple radius check + wait)
   - Improve road-status-aware rerouting feedback (log when routes are recalculated)

6) Fast wins for demo readiness
   - Seeded RNG for reproducible demos
   - Scenario presets (rush hour, multi-accident, blocked corridor)

## Tracking and Housekeeping
- Recommend Jira tickets for:
  - Model toggle wiring (frontend + backend)
  - Minimal Drone reintroduction
  - Per-agent LLM stub integration
  - Instruction overlay + debug panel
  - Collision avoidance improvements
- Recommend a Confluence page with:
  - MVP scope, current deviations (grid size, cadence), and rationale
  - How to run both model paths (local vs Cerebras)

