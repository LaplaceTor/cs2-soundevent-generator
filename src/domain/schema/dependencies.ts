/**
 * Property Dependencies & Linkage Constraints
 */

// Parent toggle -> Children properties
export const TOGGLE_DEPENDENTS: Record<string, readonly string[]> = {
  use_distance_volume_mapping_curve: ['distance_volume_mapping_curve'],
  use_distance_unfiltered_stereo_mapping_curve: ['distance_unfiltered_stereo_mapping_curve'],
  use_distance_pitch_mapping_curve: ['distance_pitch_mapping_curve'],
  use_time_volume_mapping_curve: ['time_volume_mapping_curve'],
  use_time_unfiltered_stereo_mapping_curve: ['time_unfiltered_stereo_mapping_curve'],
  use_fadetime_volume_mapping_curve: ['fadetime_volume_mapping_curve'],
  use_world_position: [
    'position',
    'randomize_position_min_radius',
    'randomize_position_max_radius',
    'randomize_position_hemisphere',
  ],
  use_ambient_entity_position: ['ambient_entity_name'],
  suppression_enable: [
    'suppression_volume_multiplier',
    'suppression_falloff_multiplier',
  ],
  vsnd_selection_type: ['vsnd_weights'],
  use_velocity_volume_curve: ['velocity_volume_curve', 'velocity_volume_seek_speed'],
  use_impact_speed_input_volume_mapping_curve: [
    'impact_speed_input_volume_mapping_curve',
    'impact_speed_input',
  ],
  use_baked_occlusion: ['occlusion_path_curve'],
  use_doppler: ['doppler_factor', 'doppler_factor_receding'],
  use_volume_convar: ['volume_convar'],
  use_uiposition: ['uiposition'],
  override_dsp_preset: ['dsp_preset', 'dsp_blend'],
  enable_child_events: ['soundevent_01'],
  enable_retrigger: [
    'retrigger_interval_min',
    'retrigger_interval_max',
    'retrigger_radius',
    'retrigger_count',
    'retrigger_keepalive_override',
  ],
  block_other: [
    'block_other_name',
    'block_other_duration',
    'block_other_distance',
  ],
  block_matching_events: [
    'block_match_entity',
    'block_duration',
    'block_distance',
  ],
  set_mixlayer_amount_enable: [
    'set_mixlayer_layer',
    'time_mixlayer_amount_curve',
  ],
  loop_track: ['startpoint_01', 'endpoint_01', 'syncpoints_01'],
  update_track_syncpoint_index: ['syncpoints_01'],
} as const;

export const CHILD_TO_PARENT_MAP = new Map<string, string>();
for (const [parentKey, children] of Object.entries(TOGGLE_DEPENDENTS)) {
  for (const childKey of children) {
    CHILD_TO_PARENT_MAP.set(childKey, parentKey);
  }
}

// Strictly bounded Min/Max pairs (Enforces min <= max)
export interface MinMaxPairInfo {
  role: 'min' | 'max';
  partner: string;
}

export const MIN_MAX_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['volume_random_min', 'volume_random_max'],
  ['pitch_random_min', 'pitch_random_max'],
  ['retrigger_interval_min', 'retrigger_interval_max'],
  ['randomize_position_min_radius', 'randomize_position_max_radius'],
  ['startpoint_01', 'endpoint_01'],
  ['startpoint_02', 'endpoint_02'],
  ['startpoint_03', 'endpoint_03'],
  ['volume_fade_initial_input_min', 'volume_fade_initial_input_max'],
] as const;

export const MIN_MAX_MAP = new Map<string, MinMaxPairInfo>();
MIN_MAX_PAIRS.forEach(([minKey, maxKey]) => {
  MIN_MAX_MAP.set(minKey, { role: 'min', partner: maxKey });
  MIN_MAX_MAP.set(maxKey, { role: 'max', partner: minKey });
});

// Linked Pairs without min/max ordering constraints (Enable/Disable synchronously)
export const LINKED_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['suppression_volume_multiplier', 'suppression_falloff_multiplier'],
  ['volume_fade_initial_input_map_min', 'volume_fade_initial_input_map_max'],
] as const;

export const LINKED_PAIR_MAP = new Map<string, string>();
LINKED_PAIRS.forEach(([k1, k2]) => {
  LINKED_PAIR_MAP.set(k1, k2);
  LINKED_PAIR_MAP.set(k2, k1);
});
