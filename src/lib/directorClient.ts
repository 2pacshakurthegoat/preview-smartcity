// Client-side OpenAI-compatible Director client (no Supabase)
import { WorldState, DirectorResponse } from '@/types/simulation';

export const validateLLM = async (opts?: { baseUrl?: string; model?: string; apiKey?: string }): Promise<{ ok: boolean; provider: string; model: string }> => {
  const baseUrl = opts?.baseUrl || import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.cerebras.ai/v1';
  const model = opts?.model || import.meta.env.VITE_OPENAI_MODEL || 'gpt-oss-120b';
  const apiKey = opts?.apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string);
  if (!apiKey) throw new Error('API Key is not set');

  const response = await fetch(`${baseUrl}/models`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  return { ok: response.ok, provider: baseUrl, model };
};

export const callDirectorLLM = async (worldState: WorldState, opts?: { baseUrl?: string; model?: string; prompt?: string; apiKey?: string }): Promise<DirectorResponse> => {
  const baseUrl = opts?.baseUrl || import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.cerebras.ai/v1';
  const model = opts?.model || import.meta.env.VITE_OPENAI_MODEL || 'gpt-oss-120b';
  const apiKey = opts?.apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string);

  if (!apiKey) throw new Error('API Key is not set');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: "You are the Director AI for a Smart City Multi-Agent Simulation. Return ONLY valid JSON with 'instructions', optional 'assetsOps', optional 'shakeWorld', and optional 'globalStrategy'." },
        { role: 'user', content: JSON.stringify({ worldState, userPrompt: opts?.prompt || '' }) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Director LLM HTTP ${response.status}: ${err}`);
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';

  let parsed: DirectorResponse = { instructions: [] } as DirectorResponse;
  try {
    const cleaned = (aiResponse || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse Director response');
  }

  if (!parsed.instructions) {
    throw new Error('Director response missing instructions');
  }

  return parsed;
};
