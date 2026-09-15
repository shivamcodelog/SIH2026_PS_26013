/**
 * Mission 16: AI Assistance (Simulated)
 * 
 * To guarantee 100% reliability during the 2-minute live demo (Mission 17/18),
 * we use a deterministic simulated AI service. This prevents the demo from crashing 
 * due to API rate limits, timeouts, or lack of internet connectivity.
 * 
 * "an LLM is never authoritative for geometry, coordinates, area, distance... 
 * Those come only from real data and deterministic algorithms." (§19)
 */

export const aiService = {
  /**
   * Generates a schema mapping suggestion.
   * "holder_nm" -> suggest owner_name, reviewable, never auto-applied.
   */
  suggestSchemaMapping: async (headers) => {
    const suggestions = {};
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Simple deterministic heuristics simulating an LLM understanding semantics
    if (lowerHeaders.includes('holder_nm')) suggestions['holder_nm'] = 'owner_name';
    if (lowerHeaders.includes('owner')) suggestions['owner'] = 'owner_name';
    if (lowerHeaders.includes('landholder')) suggestions['landholder'] = 'owner_name';
    
    if (lowerHeaders.includes('plot_area')) suggestions['plot_area'] = 'area';
    if (lowerHeaders.includes('parcel_area')) suggestions['parcel_area'] = 'area';
    if (lowerHeaders.includes('sqm')) suggestions['sqm'] = 'area';

    if (lowerHeaders.includes('property_id')) suggestions['property_id'] = 'parcel_id';
    if (lowerHeaders.includes('uid')) suggestions['uid'] = 'parcel_id';

    // Simulate network latency for AI feel
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      success: true,
      suggestions,
      message: "AI has analyzed the columns and suggested semantic mappings."
    };
  },

  /**
   * Generates a plain-language explanation of a conflict.
   */
  explainConflict: async (recordData) => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    const { confidence, conflicts, source_record_a, source_record_b, spatial_score, area_score, attribute_score } = recordData;
    
    if (!conflicts || conflicts.length === 0) {
      return { explanation: "The AI detected no significant conflicts between the source records." };
    }

    let explanation = `The cadastral record (${source_record_a || 'A'}) and municipal record (${source_record_b || 'B'}) likely represent the same parcel because their geometries overlap by ${Math.round((spatial_score || 0) * 100)}%, `;

    const ownerConflict = conflicts.find(c => c.type === 'OWNER_MISMATCH');
    const areaConflict = conflicts.find(c => c.type === 'AREA_MISMATCH');

    if (ownerConflict && areaConflict) {
      explanation += `but owner names differ substantially ("${ownerConflict.description}") and reported areas differ noticeably ("${areaConflict.description}").`;
    } else if (ownerConflict) {
      explanation += `but owner names differ substantially ("${ownerConflict.description}").`;
    } else if (areaConflict) {
      explanation += `but reported areas differ noticeably ("${areaConflict.description}").`;
    } else {
      explanation += `but there are inconsistencies needing review.`;
    }

    explanation += ` The overall confidence is ${confidence}%.`;

    return { explanation };
  }
};
