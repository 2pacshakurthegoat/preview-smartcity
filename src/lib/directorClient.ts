import { supabase } from '@/integrations/supabase/client';
import { WorldState, DirectorResponse } from '@/types/simulation';

export const callDirectorLLM = async (worldState: WorldState): Promise<DirectorResponse> => {
  try {
    console.log('Calling Director LLM with world state...');
    
    const { data, error } = await supabase.functions.invoke('director-llm', {
      body: { worldState }
    });

    if (error) {
      console.error('Director LLM error:', error);
      throw new Error(`Director LLM failed: ${error.message}`);
    }

    if (!data || !data.instructions) {
      throw new Error('Invalid response from Director LLM');
    }

    console.log('Director LLM response:', data);
    return data as DirectorResponse;
  } catch (error) {
    console.error('Failed to call Director LLM:', error);
    throw error;
  }
};
