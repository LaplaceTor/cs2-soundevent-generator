export type PropertyKind =
  | 'type_select'
  | 'base'
  | 'float'
  | 'bool'
  | 'string_bool'
  | 'float_bool'
  | 'int_bool'
  | 'vector2'
  | 'vector3'
  | 'array_string'
  | 'array_float'
  | 'curve'
  | 'combobox'
  | 'select'
  | 'vsnd_weights'
  | 'files'
  | 'string';

export type GroupId =
  | 'general'
  | 'playback'
  | 'fade'
  | 'position'
  | 'distance_curves'
  | 'time_curves'
  | 'velocity'
  | 'occlusion'
  | 'dsp'
  | 'children'
  | 'retrigger'
  | 'limits'
  | 'mixer'
  | 'music'
  | 'files'
  | 'advanced';

export interface PropertySpec {
  kind: PropertyKind;
  group: GroupId;
  options?: {
    slider_range?: [number, number];
    only_positive?: boolean;
    objects?: readonly string[];
    labels?: readonly [string, string];
    default?: any;
  };
}

export const GROUPS: ReadonlyArray<readonly [GroupId, string]> = [
  ['general', 'General'],
  ['playback', 'Playback'],
  ['fade', 'Fade'],
  ['position', 'Position'],
  ['distance_curves', 'Distance Curves'],
  ['time_curves', 'Time Curves'],
  ['velocity', 'Velocity & Doppler'],
  ['occlusion', 'Occlusion & Reverb'],
  ['dsp', 'DSP'],
  ['children', 'Child Events'],
  ['retrigger', 'Retrigger'],
  ['limits', 'Limits & Blocking'],
  ['mixer', 'Mixer & Convar'],
  ['music', 'Music'],
  ['files', 'Audio Files'],
  ['advanced', 'Advanced'],
] as const;

// reverb/dsp presets:
export const DSP_PRESETS = [
  'reverb_2_crawlSpace',
  'reverb_3_smallTunnels',
  'reverb_4_smallCarpetRoom',
  'reverb_5_smallRoom',
  'reverb_6_largeRoom',
  'reverb_7_mediumHall',
  'reverb_8_mediumCarpetRoom',
  'reverb_9_mediumChamber',
  'reverb_10_warehouse',
  'reverb_11_smallBright9',
  'reverb_12_mediumBright',
  'reverb_13_largeBright',
  'reverb_14_brightHallway',
  'reverb_15_largeCarpetRoom',
  'reverb_16_carpetCorridor',
  'reverb_17_smallConcrete',
  'reverb_18_mediumConcrete',
  'reverb_19_largeConcrete',
  'reverb_20_outsideAlley',
  'reverb_21_outsideStreet',
  'reverb_22_outsideOpen',
  'reverb_23_smallBathroom',
  'reverb_24_largeBathroom',
] as const;

export const TYPE_OBJECTS = [
  'csgo_mega',
  'csgo_music',
  'csgo_ambient',
  'csgo_surf',
  'csgo_movie',
] as const;

export type SoundEventType = (typeof TYPE_OBJECTS)[number];

export const MIXGROUPS = [
  'Weapons',
  'WeaponsDistant',
  'BulletImpacts',
  'Explosions',
  'ExplosionsDistant',
  'C4Shockwave',
  'Foley',
  'Footsteps',
  'Physics',
  'PlayerDamage',
  'PlayerAttackerFeedback',
  'PlayerVictim',
  'VO',
  'voip',
  'UI',
  'UI_Amb',
  'ArmsRace',
  'Chickens',
  'KillCard',
  'Music',
  'BuyMusic',
  'DuckingMusic',
  'SelectedMusic',
  'World',
  'Ambient',
  'Amb_Common',
  'All',
  'Exceptions',
  'Surf',
  'Anubis',
  'Assault',
  'Aztec',
  'Baggage',
  'Bank',
  'Boathouse',
  'Cache',
  'Canals',
  'Cbble',
  'Chateau',
  'Compound',
  'Coop',
  'Dust',
  'Dust2',
  'Havana',
  'House',
  'Inferno',
  'Italy',
  'Lunacy',
  'Militia',
  'Mill',
  'Mirage',
  'Monestary',
  'Nuke',
  'Office',
  'Overpass',
  'Piranesi',
  'Port',
  'Prodigy',
  'Rush',
  'Shacks',
  'Shoots',
  'Train',
  'Training',
  'Vertigo',
] as const;

export const SPECS: Record<string, PropertySpec> = {
  type: {
    kind: 'type_select',
    group: 'general',
    options: { objects: TYPE_OBJECTS },
  },
  base: {
    kind: 'base',
    group: 'general',
  },
  value: {
    kind: 'float',
    group: 'general',
    options: { slider_range: [0, 10], only_positive: true },
  },
  vsnd_duration: {
    kind: 'float',
    group: 'general',
    options: { slider_range: [0, 600], only_positive: true },
  },
  volume: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 10], only_positive: true },
  },
  volume_random_min: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [-2.0, 2.0], only_positive: false },
  },
  volume_random_max: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [-2.0, 2.0], only_positive: false },
  },
  pitch: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [-1.0, 5.0], only_positive: false },
  },
  pitch_random_min: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [-2.0, 2.0], only_positive: false },
  },
  pitch_random_max: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [-2.0, 2.0], only_positive: false },
  },
  delay: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 60], only_positive: true },
  },
  priority: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 100], only_positive: true },
  },
  ducking_bypass: {
    kind: 'float_bool',
    group: 'playback',
  },
  preload_vsnds: {
    kind: 'bool',
    group: 'playback',
  },
  vsnd_pause_with_game: {
    kind: 'bool',
    group: 'playback',
  },
  is_ui_sound: {
    kind: 'bool',
    group: 'playback',
  },
  voice_culling_threshold: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 1], only_positive: true },
  },
  use_fadetime_volume_mapping_curve: {
    kind: 'bool',
    group: 'fade',
  },
  fadetime_volume_mapping_curve: {
    kind: 'curve',
    group: 'fade',
    options: { labels: ['Fade Time', 'Volume'] },
  },
  volume_fade_out_input_max: {
    kind: 'float',
    group: 'fade',
    options: { slider_range: [0, 60], only_positive: true },
  },
  volume_fade_initial_input_min: {
    kind: 'float',
    group: 'fade',
    options: { slider_range: [0, 100], only_positive: true },
  },
  volume_fade_initial_input_max: {
    kind: 'float',
    group: 'fade',
    options: { slider_range: [0, 100], only_positive: true },
  },
  volume_fade_initial_input_map_min: {
    kind: 'float',
    group: 'fade',
    options: { slider_range: [0, 10], only_positive: true },
  },
  volume_fade_initial_input_map_max: {
    kind: 'float',
    group: 'fade',
    options: { slider_range: [0, 10], only_positive: true },
  },
  position: {
    kind: 'vector3',
    group: 'position',
    options: { slider_range: [-1000, 1000] },
  },
  position_offset: {
    kind: 'vector3',
    group: 'position',
    options: { slider_range: [-1000, 1000] },
  },
  position_offset_relative: {
    kind: 'bool',
    group: 'position',
  },
  use_world_position: {
    kind: 'bool',
    group: 'position',
  },
  use_uiposition: {
    kind: 'bool',
    group: 'position',
  },
  position_relative_to_player: {
    kind: 'bool',
    group: 'position',
  },
  use_entity_position_if_local_player: {
    kind: 'bool',
    group: 'position',
  },
  set_child_position: {
    kind: 'bool',
    group: 'position',
  },
  randomize_position_min_radius: {
    kind: 'float',
    group: 'position',
    options: { slider_range: [0.0, 10000.0], only_positive: true },
  },
  randomize_position_max_radius: {
    kind: 'float',
    group: 'position',
    options: { slider_range: [0.0, 10000.0], only_positive: true },
  },
  randomize_position_hemisphere: {
    kind: 'bool',
    group: 'position',
  },
  distance_multiplier: {
    kind: 'float',
    group: 'position',
    options: { slider_range: [0, 50], only_positive: true },
  },
  broadcast_distance_override: {
    kind: 'float',
    group: 'position',
    options: { slider_range: [0, 10000], only_positive: true },
  },
  display_broadcast: {
    kind: 'bool',
    group: 'position',
  },
  use_distance_volume_mapping_curve: {
    kind: 'bool',
    group: 'distance_curves',
  },
  distance_volume_mapping_curve: {
    kind: 'curve',
    group: 'distance_curves',
    options: { labels: ['Distance', 'Volume'] },
  },
  use_distance_unfiltered_stereo_mapping_curve: {
    kind: 'bool',
    group: 'distance_curves',
  },
  distance_unfiltered_stereo_mapping_curve: {
    kind: 'curve',
    group: 'distance_curves',
    options: { labels: ['Distance', 'Unfiltered Stereo'] },
  },
  use_time_volume_mapping_curve: {
    kind: 'bool',
    group: 'time_curves',
  },
  time_volume_mapping_curve: {
    kind: 'curve',
    group: 'time_curves',
    options: { labels: ['Time', 'Volume'] },
  },
  use_time_unfiltered_stereo_mapping_curve: {
    kind: 'bool',
    group: 'time_curves',
  },
  time_unfiltered_stereo_mapping_curve: {
    kind: 'curve',
    group: 'time_curves',
    options: { labels: ['Time', 'Unfiltered Stereo'] },
  },
  use_doppler: {
    kind: 'bool',
    group: 'velocity',
  },
  use_velocity_volume_curve: {
    kind: 'bool',
    group: 'velocity',
  },
  velocity_volume_curve: {
    kind: 'curve',
    group: 'velocity',
    options: { labels: ['Velocity', 'Volume'] },
  },
  velocity_volume_seek_speed: {
    kind: 'float',
    group: 'velocity',
    options: { slider_range: [0, 5000], only_positive: true },
  },
  use_velocity_eq: {
    kind: 'bool',
    group: 'velocity',
  },
  use_impact_speed_input_volume_mapping_curve: {
    kind: 'bool',
    group: 'velocity',
  },
  impact_speed_input_volume_mapping_curve: {
    kind: 'curve',
    group: 'velocity',
    options: { labels: ['Impact Speed', 'Volume'] },
  },
  occlusion: {
    kind: 'bool',
    group: 'occlusion',
  },
  occlusion_intensity: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0, 2.0], only_positive: true },
  },
  occlusion_frequency_scale: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0, 1], only_positive: true },
  },
  occlusion_interval: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0, 1], only_positive: true },
  },
  use_baked_occlusion: {
    kind: 'bool',
    group: 'occlusion',
  },
  distance_effect_mix: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0, 1.0], only_positive: true },
  },
  reverb_wet: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0.0, 2.0], only_positive: true },
  },
  reverb_source_wet: {
    kind: 'float',
    group: 'occlusion',
    options: { slider_range: [0, 1], only_positive: true },
  },
  restrict_source_reverb: {
    kind: 'bool',
    group: 'occlusion',
  },
  dsp_preset: {
    kind: 'select',
    group: 'dsp',
    options: { objects: DSP_PRESETS },
  },
  override_dsp_preset: {
    kind: 'bool',
    group: 'dsp',
  },
  dsp_blend: {
    kind: 'float',
    group: 'dsp',
    options: { slider_range: [0, 1], only_positive: true },
  },
  dsp_bypass: {
    kind: 'float_bool',
    group: 'dsp',
  },
  enable_child_events: {
    kind: 'bool',
    group: 'children',
  },
  soundevent_01: {
    kind: 'string',
    group: 'children',
  },
  enable_retrigger: {
    kind: 'bool',
    group: 'retrigger',
  },
  retrigger_interval_min: {
    kind: 'float',
    group: 'retrigger',
    options: { slider_range: [0.0, 200.0], only_positive: true },
  },
  retrigger_interval_max: {
    kind: 'float',
    group: 'retrigger',
    options: { slider_range: [0.0, 600.0], only_positive: true },
  },
  retrigger_radius: {
    kind: 'float',
    group: 'retrigger',
    options: { slider_range: [0.0, 100000.0], only_positive: true },
  },
  retrigger_count: {
    kind: 'float',
    group: 'retrigger',
    options: { slider_range: [-1, 100], only_positive: false },
  },
  instance_limit: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 16], only_positive: true },
  },
  self_destruct_time: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 600], only_positive: true },
  },
  stop_at_time: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 600], only_positive: true },
  },
  block_matching_events: {
    kind: 'bool',
    group: 'limits',
  },
  block_match_entity: {
    kind: 'bool',
    group: 'limits',
  },
  block_duration: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 60], only_positive: true },
  },
  block_distance: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 10000], only_positive: true },
  },
  block_other: {
    kind: 'bool',
    group: 'limits',
  },
  block_other_name: {
    kind: 'string',
    group: 'limits',
  },
  block_other_duration: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 60], only_positive: true },
  },
  block_other_distance: {
    kind: 'float',
    group: 'limits',
    options: { slider_range: [0, 10000], only_positive: true },
  },
  mixgroup: {
    kind: 'select',
    group: 'mixer',
    options: { objects: MIXGROUPS },
  },
  mixlayer_name: {
    kind: 'string',
    group: 'mixer',
  },
  set_mixlayer_layer: {
    kind: 'string',
    group: 'mixer',
  },
  set_mixlayer_amount_enable: {
    kind: 'bool',
    group: 'mixer',
  },
  time_mixlayer_amount_curve: {
    kind: 'curve',
    group: 'mixer',
    options: { labels: ['Time', 'Mixlayer Amount'] },
  },
  use_volume_convar: {
    kind: 'bool',
    group: 'mixer',
  },
  volume_convar: {
    kind: 'string',
    group: 'mixer',
  },
  loop_track: {
    kind: 'string_bool',
    group: 'music',
  },
  should_queue_track: {
    kind: 'string_bool',
    group: 'music',
  },
  update_track_syncpoint_index: {
    kind: 'string_bool',
    group: 'music',
  },
  sync_action_to_startround: {
    kind: 'int_bool',
    group: 'music',
  },
  startpoint_01: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  startpoint_02: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  startpoint_03: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  endpoint_01: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  endpoint_02: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  endpoint_03: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  restart_startpoint_01: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  restart_startpoint_02: {
    kind: 'float',
    group: 'music',
    options: { slider_range: [0, 600], only_positive: true },
  },
  syncpoints_01: {
    kind: 'array_float',
    group: 'music',
  },
  syncpoints_02: {
    kind: 'array_float',
    group: 'music',
  },
  syncpoints_03: {
    kind: 'array_float',
    group: 'music',
  },
  stop_selection_music: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_all_non_music: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_music: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_match_end: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_loading: {
    kind: 'string_bool',
    group: 'music',
  },
  join_non_mvp_group: {
    kind: 'string_bool',
    group: 'music',
  },
  priority_override: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_start_round: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_tensec_count: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_bomb_planted: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_got_hostage: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_music_except_mvp: {
    kind: 'string_bool',
    group: 'music',
  },
  skip_if_muted: {
    kind: 'string_bool',
    group: 'music',
  },
  test_mvp_block: {
    kind: 'string_bool',
    group: 'music',
  },
  check_for_classic_deathcam: {
    kind: 'string_bool',
    group: 'music',
  },
  stop_won_mvp: {
    kind: 'string_bool',
    group: 'music',
  },
  block_won_lost: {
    kind: 'string_bool',
    group: 'music',
  },
  vsnd_files: {
    kind: 'files',
    group: 'files',
  },
  vsnd_files_track_01: {
    kind: 'files',
    group: 'files',
  },
  source_soundscape: {
    kind: 'string',
    group: 'advanced',
  },
  uiposition: {
    kind: 'vector3',
    group: 'advanced',
  },
  use_distance_pitch_mapping_curve: {
    kind: 'bool',
    group: 'advanced',
  },
  distance_pitch_mapping_curve: {
    kind: 'curve',
    group: 'advanced',
  },
  occlusion_path_curve: {
    kind: 'curve',
    group: 'advanced',
  },
  doppler_factor: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 5], only_positive: true },
  },
  doppler_factor_receding: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 5], only_positive: true },
  },
  impact_speed_input: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 2000], only_positive: true },
  },
  velocity_magnitude: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 3000], only_positive: true },
  },
  voice_fade_out_time: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 10], only_positive: true },
  },
  voice_looped_culling_update_time: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 5], only_positive: true },
  },
  randomize_start_time: {
    kind: 'bool',
    group: 'advanced',
  },
  restart_startpoint_03: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 600], only_positive: true },
  },
  retrigger_keepalive_override: {
    kind: 'float',
    group: 'advanced',
    options: { slider_range: [0, 100], only_positive: true },
  },
  suppression_enable: {
    kind: 'bool',
    group: 'playback',
  },
  suppression_volume_multiplier: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 2], only_positive: true },
  },
  suppression_falloff_multiplier: {
    kind: 'float',
    group: 'playback',
    options: { slider_range: [0, 2], only_positive: true },
  },
  use_ambient_entity_position: {
    kind: 'bool',
    group: 'position',
  },
  ambient_entity_name: {
    kind: 'string',
    group: 'position',
  },
  vsnd_selection_type: {
    kind: 'select',
    group: 'playback',
    options: { objects: ['random', 'random_weighted', 'round_robin', 'sequential'] },
  },
  vsnd_weights: {
    kind: 'vsnd_weights',
    group: 'playback',
  },
  use_mode_music_volume: {
    kind: 'bool',
    group: 'music',
  },
  _auto_calc_vnsd_duration_: {
    kind: 'bool',
    group: 'general',
  },
  metadata: {
    kind: 'array_string',
    group: 'general',
  },
};

export const DEFAULTS: Record<string, any> = {
  type: 'csgo_mega',
  base: '',
  value: 1.0,
  vsnd_duration: 1.0,
  volume: 1.0,
  volume_random_min: 0.0,
  volume_random_max: 0.0,
  pitch: 1.0,
  pitch_random_min: 0.0,
  pitch_random_max: 0.0,
  delay: 0.0,
  priority: 1.0,
  ducking_bypass: 0.0,
  preload_vsnds: false,
  vsnd_pause_with_game: true,
  is_ui_sound: false,
  voice_culling_threshold: 0.01,
  use_fadetime_volume_mapping_curve: false,
  fadetime_volume_mapping_curve: [
    [0.0, 1.0, 0.0, 0.0, 2.0, 3.0],
    [1.0, 0.0, 0.0, 0.0, 1.0, 1.0],
  ],
  volume_fade_out_input_max: 1.0,
  volume_fade_initial_input_min: 0.0,
  volume_fade_initial_input_max: 1.0,
  volume_fade_initial_input_map_min: 1.0,
  volume_fade_initial_input_map_max: 1.0,
  position: [0.0, 0.0, 0.0],
  position_offset: [0.0, 0.0, 0.0],
  position_offset_relative: false,
  use_world_position: false,
  use_uiposition: false,
  position_relative_to_player: false,
  use_entity_position_if_local_player: false,
  set_child_position: false,
  randomize_position_min_radius: 0.0,
  randomize_position_max_radius: 0.0,
  randomize_position_hemisphere: false,
  distance_multiplier: 1.0,
  broadcast_distance_override: 0.0,
  display_broadcast: false,
  use_distance_volume_mapping_curve: true,
  distance_volume_mapping_curve: [
    [0.0, 1.0, 0.0, 0.0, 2.0, 3.0],
    [1000.0, 0.0, -0.001, -0.001, 1.0, 1.0],
  ],
  use_distance_unfiltered_stereo_mapping_curve: false,
  distance_unfiltered_stereo_mapping_curve: [
    [0.0, 0.0, 0.0, 0.0, 2.0, 3.0],
    [300.0, 0.0, 0.0, 0.0, 2.0, 3.0],
  ],
  use_time_volume_mapping_curve: false,
  time_volume_mapping_curve: [
    [0.0, 1.0, 0.0, 0.0, 2.0, 3.0],
    [1.0, 1.0, 0.0, 0.0, 1.0, 1.0],
  ],
  use_time_unfiltered_stereo_mapping_curve: false,
  time_unfiltered_stereo_mapping_curve: [
    [0.0, 0.0, 0.0, 0.0, 2.0, 3.0],
    [1.0, 1.0, 0.0, 0.0, 2.0, 3.0],
  ],
  use_doppler: false,
  use_velocity_volume_curve: false,
  velocity_volume_curve: [
    [0.0, 0.0, 0.0, 0.0, 2.0, 3.0],
    [700.0, 1.0, 0.0, 0.0, 1.0, 1.0],
  ],
  velocity_volume_seek_speed: 700.0,
  use_velocity_eq: false,
  use_impact_speed_input_volume_mapping_curve: false,
  impact_speed_input_volume_mapping_curve: [
    [0.0, 0.0, 0.0, 0.0, 2.0, 3.0],
    [1000.0, 1.0, 0.0, 0.0, 1.0, 1.0],
  ],
  occlusion: false,
  occlusion_intensity: 0.6,
  occlusion_frequency_scale: 1.0,
  occlusion_interval: 0.1,
  use_baked_occlusion: false,
  distance_effect_mix: 1.0,
  reverb_wet: 1.0,
  reverb_source_wet: 1.0,
  restrict_source_reverb: false,
  dsp_preset: 'reverb_5_smallRoom',
  override_dsp_preset: false,
  dsp_blend: 1.0,
  dsp_bypass: 0.0,
  enable_child_events: false,
  soundevent_01: '',
  enable_retrigger: false,
  retrigger_interval_min: 1.0,
  retrigger_interval_max: 3.0,
  retrigger_radius: 1000.0,
  retrigger_count: -1,
  instance_limit: 0.0,
  self_destruct_time: -1.0,
  stop_at_time: -1.0,
  block_matching_events: false,
  block_match_entity: false,
  block_duration: 0.1,
  block_distance: 0.0,
  block_other: false,
  block_other_name: '',
  block_other_duration: 0.1,
  block_other_distance: 0.0,
  mixgroup: 'Weapons',
  mixlayer_name: '',
  set_mixlayer_layer: '',
  set_mixlayer_amount_enable: false,
  time_mixlayer_amount_curve: [
    [0.0, 1.0, 0.0, 0.0, 2.0, 3.0],
    [1.0, 0.0, 0.0, 0.0, 1.0, 1.0],
  ],
  use_volume_convar: false,
  volume_convar: 'snd_musicvolume',
  loop_track: 'false',
  should_queue_track: 'false',
  update_track_syncpoint_index: 'false',
  sync_action_to_startround: 0,
  startpoint_01: 0.0,
  startpoint_02: 0.0,
  startpoint_03: 0.0,
  endpoint_01: 0.0,
  endpoint_02: 0.0,
  endpoint_03: 0.0,
  restart_startpoint_01: 0.0,
  restart_startpoint_02: 0.0,
  syncpoints_01: [],
  syncpoints_02: [],
  syncpoints_03: [],
  stop_selection_music: 'false',
  stop_all_non_music: 'false',
  stop_music: 'false',
  stop_match_end: 'false',
  stop_loading: 'false',
  join_non_mvp_group: 'false',
  priority_override: 'false',
  stop_start_round: 'false',
  stop_tensec_count: 'false',
  stop_bomb_planted: 'false',
  stop_got_hostage: 'false',
  stop_music_except_mvp: 'false',
  skip_if_muted: 'false',
  test_mvp_block: 'false',
  check_for_classic_deathcam: 'false',
  stop_won_mvp: 'false',
  block_won_lost: 'false',
  vsnd_files: 'sounds/custom/new_sound.vsnd',
  vsnd_files_track_01: ['sounds/custom/new_sound.vsnd'],
  source_soundscape: '',
  uiposition: [0.0, 0.0, 0.0],
  use_distance_pitch_mapping_curve: false,
  distance_pitch_mapping_curve: [
    [0.0, 1.0, 0.0, 0.0, 2.0, 3.0],
    [1000.0, 1.0, 0.0, 0.0, 2.0, 3.0],
  ],
  occlusion_path_curve: [
    [0.0, 0.0, 0.0, 0.0, 2.0, 3.0],
    [1.0, 1.0, 0.0, 0.0, 2.0, 3.0],
  ],
  doppler_factor: 1.0,
  doppler_factor_receding: 1.0,
  impact_speed_input: 0.0,
  velocity_magnitude: 0.0,
  voice_fade_out_time: 0.0,
  voice_looped_culling_update_time: 0.25,
  randomize_start_time: false,
  restart_startpoint_03: 0.0,
  retrigger_keepalive_override: 0.0,
  suppression_enable: false,
  suppression_volume_multiplier: 0.07,
  suppression_falloff_multiplier: 0.2,
  use_ambient_entity_position: false,
  ambient_entity_name: '',
  vsnd_selection_type: 'random',
  vsnd_weights: [0.8, 0.2],
  use_mode_music_volume: false,
  _auto_calc_vnsd_duration_: true,
  metadata: [],
};

export function typeNeedsValue(typeName: unknown): boolean {
  if (!typeName || typeof typeName !== 'string') return false;
  const t = typeName.toLowerCase().trim();
  return t.includes('set_') || t.includes('setter') || t.startsWith('set') || t.includes('_set');
}
