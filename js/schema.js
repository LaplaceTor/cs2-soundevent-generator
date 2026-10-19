/**
 * CS2 SoundEvent Schema & Objects definition
 * Ported from Hammer5Tools/Hammer5ToolsGUI/gui/editors/soundevent_editor
 */

export const GROUPS = [
  [
    "general",
    "General"
  ],
  [
    "playback",
    "Playback"
  ],
  [
    "fade",
    "Fade"
  ],
  [
    "position",
    "Position"
  ],
  [
    "distance_curves",
    "Distance Curves"
  ],
  [
    "time_curves",
    "Time Curves"
  ],
  [
    "velocity",
    "Velocity & Doppler"
  ],
  [
    "occlusion",
    "Occlusion & Reverb"
  ],
  [
    "dsp",
    "DSP"
  ],
  [
    "children",
    "Child Events"
  ],
  [
    "retrigger",
    "Retrigger"
  ],
  [
    "limits",
    "Limits & Blocking"
  ],
  [
    "mixer",
    "Mixer & Convar"
  ],
  [
    "music",
    "Music"
  ],
  [
    "files",
    "Audio Files"
  ],
  [
    "advanced",
    "Advanced"
  ]
];

export const COLLAPSED_BY_DEFAULT = new Set(["advanced"]);

export const SPECS = {
  "type": {
    "kind": "combobox",
    "group": "general",
    "options": {
      "objects": [
        "csgo_mega",
        "csgo_music"
      ]
    }
  },
  "base": {
    "kind": "base",
    "group": "general",
    "options": {
      "objects": []
    }
  },
  "value": {
    "kind": "float",
    "group": "general",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "vsnd_duration": {
    "kind": "float",
    "group": "general",
    "options": {
      "slider_range": [
        0,
        600
      ],
      "only_positive": true
    }
  },
  "volume": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "volume_random_min": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        -2.0,
        2.0
      ],
      "only_positive": false
    }
  },
  "volume_random_max": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        -2.0,
        2.0
      ],
      "only_positive": false
    }
  },
  "pitch": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "pitch_random_min": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        -2.0,
        2.0
      ],
      "only_positive": false
    }
  },
  "pitch_random_max": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        -2.0,
        2.0
      ],
      "only_positive": false
    }
  },
  "delay": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "priority": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        100
      ],
      "only_positive": true
    }
  },
  "ducking_bypass": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "preload_vsnds": {
    "kind": "bool",
    "group": "playback",
    "options": {}
  },
  "vsnd_pause_with_game": {
    "kind": "bool",
    "group": "playback",
    "options": {}
  },
  "is_ui_sound": {
    "kind": "bool",
    "group": "playback",
    "options": {}
  },
  "voice_culling_threshold": {
    "kind": "float",
    "group": "playback",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "use_fadetime_volume_mapping_curve": {
    "kind": "bool",
    "group": "fade",
    "options": {}
  },
  "fadetime_volume_mapping_curve": {
    "kind": "curve",
    "group": "fade",
    "options": {
      "labels": [
        "Fade Time",
        "Volume"
      ]
    }
  },
  "volume_fade_out_input_max": {
    "kind": "float",
    "group": "fade",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "volume_fade_initial_input_min": {
    "kind": "float",
    "group": "fade",
    "options": {
      "slider_range": [
        0,
        100
      ],
      "only_positive": true
    }
  },
  "volume_fade_initial_input_max": {
    "kind": "float",
    "group": "fade",
    "options": {
      "slider_range": [
        0,
        100
      ],
      "only_positive": true
    }
  },
  "volume_fade_initial_input_map_min": {
    "kind": "float",
    "group": "fade",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "volume_fade_initial_input_map_max": {
    "kind": "float",
    "group": "fade",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "position": {
    "kind": "vector3",
    "group": "position",
    "options": {
      "slider_range": [
        -1000,
        1000
      ]
    }
  },
  "position_offset": {
    "kind": "vector3",
    "group": "position",
    "options": {
      "slider_range": [
        -1000,
        1000
      ]
    }
  },
  "position_offset_relative": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "use_world_position": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "use_uiposition": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "position_relative_to_player": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "use_entity_position_if_local_player": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "set_child_position": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "randomize_position_min_radius": {
    "kind": "float",
    "group": "position",
    "options": {
      "slider_range": [
        -5000.0,
        5000.0
      ],
      "only_positive": false
    }
  },
  "randomize_position_max_radius": {
    "kind": "float",
    "group": "position",
    "options": {
      "slider_range": [
        -5000.0,
        5000.0
      ],
      "only_positive": false
    }
  },
  "randomize_position_hemisphere": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "distance_multiplier": {
    "kind": "float",
    "group": "position",
    "options": {
      "slider_range": [
        0,
        50
      ],
      "only_positive": true
    }
  },
  "broadcast_distance_override": {
    "kind": "float",
    "group": "position",
    "options": {
      "slider_range": [
        0,
        10000
      ],
      "only_positive": true
    }
  },
  "display_broadcast": {
    "kind": "bool",
    "group": "position",
    "options": {}
  },
  "use_distance_volume_mapping_curve": {
    "kind": "bool",
    "group": "distance_curves",
    "options": {}
  },
  "distance_volume_mapping_curve": {
    "kind": "curve",
    "group": "distance_curves",
    "options": {
      "labels": [
        "Distance",
        "Volume"
      ]
    }
  },
  "use_distance_unfiltered_stereo_mapping_curve": {
    "kind": "bool",
    "group": "distance_curves",
    "options": {}
  },
  "distance_unfiltered_stereo_mapping_curve": {
    "kind": "curve",
    "group": "distance_curves",
    "options": {
      "labels": [
        "Distance",
        "Unfiltered Stereo"
      ]
    }
  },
  "use_time_volume_mapping_curve": {
    "kind": "bool",
    "group": "time_curves",
    "options": {}
  },
  "time_volume_mapping_curve": {
    "kind": "curve",
    "group": "time_curves",
    "options": {
      "labels": [
        "Time",
        "Volume"
      ]
    }
  },
  "use_time_unfiltered_stereo_mapping_curve": {
    "kind": "bool",
    "group": "time_curves",
    "options": {}
  },
  "time_unfiltered_stereo_mapping_curve": {
    "kind": "curve",
    "group": "time_curves",
    "options": {
      "labels": [
        "Time",
        "Unfiltered Stereo"
      ]
    }
  },
  "use_doppler": {
    "kind": "bool",
    "group": "velocity",
    "options": {}
  },
  "use_velocity_volume_curve": {
    "kind": "bool",
    "group": "velocity",
    "options": {}
  },
  "velocity_volume_curve": {
    "kind": "curve",
    "group": "velocity",
    "options": {
      "labels": [
        "Velocity",
        "Volume"
      ]
    }
  },
  "velocity_volume_seek_speed": {
    "kind": "float",
    "group": "velocity",
    "options": {
      "slider_range": [
        0,
        5000
      ],
      "only_positive": true
    }
  },
  "use_velocity_eq": {
    "kind": "bool",
    "group": "velocity",
    "options": {}
  },
  "use_impact_speed_input_volume_mapping_curve": {
    "kind": "bool",
    "group": "velocity",
    "options": {}
  },
  "impact_speed_input_volume_mapping_curve": {
    "kind": "curve",
    "group": "velocity",
    "options": {
      "labels": [
        "Impact Speed",
        "Volume"
      ]
    }
  },
  "occlusion": {
    "kind": "bool",
    "group": "occlusion",
    "options": {}
  },
  "occlusion_intensity": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "occlusion_frequency_scale": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "occlusion_interval": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "use_baked_occlusion": {
    "kind": "bool",
    "group": "occlusion",
    "options": {}
  },
  "distance_effect_mix": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "reverb_wet": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "reverb_source_wet": {
    "kind": "float",
    "group": "occlusion",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "restrict_source_reverb": {
    "kind": "bool",
    "group": "occlusion",
    "options": {}
  },
  "dsp_preset": {
    "kind": "combobox",
    "group": "dsp",
    "options": {
      "objects": [
        "reverb_2_crawlSpace",
        "reverb_3_smallTunnels",
        "reverb_4_smallCarpetRoom",
        "reverb_5_smallRoom",
        "reverb_6_largeRoom",
        "reverb_7_mediumHall",
        "reverb_8_mediumCarpetRoom",
        "reverb_9_mediumChamber",
        "reverb_10_warehouse",
        "reverb_11_smallBright9",
        "reverb_12_mediumBright",
        "reverb_13_largeBright",
        "reverb_14_brightHallway",
        "reverb_15_largeCarpetRoom",
        "reverb_16_carpetCorridor",
        "reverb_17_smallConcrete",
        "reverb_18_mediumConcrete",
        "reverb_19_largeConcrete",
        "reverb_20_outsideAlley",
        "reverb_21_outsideStreet",
        "reverb_22_outsideOpen",
        "reverb_23_smallBathroom",
        "reverb_24_largeBathroom"
      ]
    }
  },
  "override_dsp_preset": {
    "kind": "bool",
    "group": "dsp",
    "options": {}
  },
  "dsp_blend": {
    "kind": "float",
    "group": "dsp",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "dsp_bypass": {
    "kind": "float",
    "group": "dsp",
    "options": {
      "slider_range": [
        0,
        1
      ],
      "only_positive": true
    }
  },
  "enable_child_events": {
    "kind": "bool",
    "group": "children",
    "options": {}
  },
  "soundevent_01": {
    "kind": "soundevent",
    "group": "children",
    "options": {}
  },
  "enable_retrigger": {
    "kind": "bool",
    "group": "retrigger",
    "options": {}
  },
  "retrigger_interval_min": {
    "kind": "float",
    "group": "retrigger",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "retrigger_interval_max": {
    "kind": "float",
    "group": "retrigger",
    "options": {
      "slider_range": [
        0.0,
        60.0
      ],
      "only_positive": true
    }
  },
  "retrigger_radius": {
    "kind": "float",
    "group": "retrigger",
    "options": {
      "slider_range": [
        0.0,
        20000.0
      ],
      "only_positive": true
    }
  },
  "retrigger_count": {
    "kind": "float",
    "group": "retrigger",
    "options": {
      "slider_range": [
        -1,
        100
      ],
      "only_positive": false
    }
  },
  "instance_limit": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        100
      ],
      "only_positive": true
    }
  },
  "self_destruct_time": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        600
      ],
      "only_positive": true
    }
  },
  "stop_at_time": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        600
      ],
      "only_positive": true
    }
  },
  "block_matching_events": {
    "kind": "bool",
    "group": "limits",
    "options": {}
  },
  "block_match_entity": {
    "kind": "bool",
    "group": "limits",
    "options": {}
  },
  "block_duration": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "block_distance": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        10000
      ],
      "only_positive": true
    }
  },
  "block_other": {
    "kind": "bool",
    "group": "limits",
    "options": {}
  },
  "block_other_name": {
    "kind": "legacy",
    "group": "limits",
    "options": {}
  },
  "block_other_duration": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "block_other_distance": {
    "kind": "float",
    "group": "limits",
    "options": {
      "slider_range": [
        0,
        10000
      ],
      "only_positive": true
    }
  },
  "mixgroup": {
    "kind": "combobox",
    "group": "mixer",
    "options": {
      "objects": [
        "ArmsRace",
        "Weapons",
        "UI",
        "voip",
        "World",
        "Music",
        "BuyMusic",
        "DuckingMusic",
        "SelectedMusic",
        "All",
        "Footsteps",
        "Foley",
        "Physics",
        "BulletImpacts",
        "Explosions",
        "ExplosionsDistant",
        "Ambient",
        "WeaponsDistant",
        "Exceptions",
        "Amb_Common",
        "Aztec",
        "Assault",
        "Baggage",
        "Bank",
        "Boathouse",
        "Canals",
        "Cbble",
        "Chateau",
        "Compound",
        "Coop",
        "Dust",
        "Dust2",
        "Havana",
        "House",
        "Inferno",
        "Italy",
        "Lunacy",
        "Militia",
        "Mill",
        "Mirage",
        "Monastery",
        "Nuke",
        "Office",
        "Overpass",
        "Piranesi",
        "Port",
        "Prodigy",
        "Shacks",
        "Shoots",
        "Train",
        "Training",
        "Vertigo",
        "PlayerDamage",
        "KillCard",
        "PlayerVictim",
        "Anubis",
        "VO"
      ]
    }
  },
  "mixlayer_name": {
    "kind": "legacy",
    "group": "mixer",
    "options": {}
  },
  "set_mixlayer_layer": {
    "kind": "legacy",
    "group": "mixer",
    "options": {}
  },
  "set_mixlayer_amount_enable": {
    "kind": "bool",
    "group": "mixer",
    "options": {}
  },
  "time_mixlayer_amount_curve": {
    "kind": "curve",
    "group": "mixer",
    "options": {
      "labels": [
        "Time",
        "Mixlayer Amount"
      ]
    }
  },
  "use_volume_convar": {
    "kind": "bool",
    "group": "mixer",
    "options": {}
  },
  "volume_convar": {
    "kind": "legacy",
    "group": "mixer",
    "options": {}
  },
  "loop_track": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "should_queue_track": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "update_track_syncpoint_index": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "sync_action_to_startround": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "startpoint_01": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "startpoint_02": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "startpoint_03": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "endpoint_01": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "endpoint_02": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "endpoint_03": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "restart_startpoint_01": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "restart_startpoint_02": {
    "kind": "float",
    "group": "music",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "syncpoints_01": {
    "kind": "legacy",
    "group": "music",
    "options": {}
  },
  "syncpoints_02": {
    "kind": "legacy",
    "group": "music",
    "options": {}
  },
  "syncpoints_03": {
    "kind": "legacy",
    "group": "music",
    "options": {}
  },
  "stop_selection_music": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_all_non_music": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_music": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_match_end": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_loading": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "join_non_mvp_group": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "priority_override": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_start_round": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_tensec_count": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_bomb_planted": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_got_hostage": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_music_except_mvp": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "skip_if_muted": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "test_mvp_block": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "check_for_classic_deathcam": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "stop_won_mvp": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "block_won_lost": {
    "kind": "string_bool",
    "group": "music",
    "options": {}
  },
  "vsnd_files": {
    "kind": "files",
    "group": "files",
    "options": {}
  },
  "vsnd_files_track_01": {
    "kind": "files",
    "group": "files",
    "options": {}
  },
  "source_soundscape": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        100
      ],
      "only_positive": true
    }
  },
  "uiposition": {
    "kind": "vector3",
    "group": "advanced",
    "options": {
      "slider_range": [
        -1000,
        1000
      ]
    }
  },
  "use_distance_pitch_mapping_curve": {
    "kind": "bool",
    "group": "advanced",
    "options": {}
  },
  "distance_pitch_mapping_curve": {
    "kind": "curve",
    "group": "advanced",
    "options": {
      "labels": [
        "Distance",
        "Pitch"
      ]
    }
  },
  "occlusion_path_curve": {
    "kind": "curve",
    "group": "advanced",
    "options": {
      "labels": [
        "Distance",
        "Occlusion"
      ]
    }
  },
  "doppler_factor": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "doppler_factor_receding": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        10
      ],
      "only_positive": true
    }
  },
  "impact_speed_input": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        5000
      ],
      "only_positive": true
    }
  },
  "velocity_magnitude": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        5000
      ],
      "only_positive": true
    }
  },
  "voice_fade_out_time": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "voice_looped_culling_update_time": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  },
  "randomize_start_time": {
    "kind": "bool",
    "group": "advanced",
    "options": {}
  },
  "restart_startpoint_03": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        1000
      ],
      "only_positive": true
    }
  },
  "retrigger_keepalive_override": {
    "kind": "float",
    "group": "advanced",
    "options": {
      "slider_range": [
        0,
        60
      ],
      "only_positive": true
    }
  }
};

export const DEFAULTS = {
  "volume": 1,
  "delay": 1,
  "pitch": 1,
  "volume_random_min": -0.5,
  "volume_random_max": 0.5,
  "pitch_random_min": -0.5,
  "pitch_random_max": -0.5,
  "randomize_position_min_radius": 2000,
  "randomize_position_max_radius": 3000,
  "retrigger_interval_min": 10,
  "retrigger_interval_max": 30,
  "occlusion_intensity": 0.0,
  "distance_effect_mix": 0.0,
  "reverb_wet": 1.0,
  "occlusion_frequency_scale": 1.0,
  "vsnd_duration": 10,
  "source_soundscape": 1,
  "block_duration": 0.0,
  "block_distance": 0.0,
  "instance_limit": 0.0,
  "reverb_source_wet": 0.0,
  "distance_multiplier": 1.5,
  "broadcast_distance_override": 98.0,
  "block_other_duration": 0.3,
  "block_other_distance": 30.0,
  "velocity_volume_seek_speed": 700.0,
  "ducking_bypass": 1.0,
  "retrigger_radius": 10000.0,
  "self_destruct_time": 20.0,
  "value": 1.0,
  "dsp_bypass": 0.0,
  "occlusion_interval": 0.25,
  "retrigger_count": -1.0,
  "dsp_blend": 0.0,
  "voice_culling_threshold": 0.01,
  "volume_fade_out_input_max": 1.0,
  "priority": 2.0,
  "volume_fade_initial_input_min": 4.0,
  "volume_fade_initial_input_max": 12.0,
  "volume_fade_initial_input_map_min": 1.0,
  "volume_fade_initial_input_map_max": 0.5,
  "startpoint_01": 0.0,
  "startpoint_02": 0.0,
  "startpoint_03": 1.174,
  "endpoint_01": 53.992,
  "endpoint_02": 38.308,
  "endpoint_03": 55.851,
  "sync_action_to_startround": 1,
  "stop_at_time": 10.0,
  "restart_startpoint_01": 2.05,
  "restart_startpoint_02": 2.05,
  "vsnd_files_track_01": [],
  "vsnd_files": "sounds/music/survival_review_victory.vsnd",
  "position": [
    0,
    0,
    0
  ],
  "position_offset": [
    0.0,
    0.0,
    0.0
  ],
  "enable_child_events": true,
  "enable_retrigger": true,
  "restrict_source_reverb": true,
  "randomize_position_hemisphere": false,
  "use_distance_unfiltered_stereo_mapping_curve": true,
  "use_distance_volume_mapping_curve": true,
  "use_time_volume_mapping_curve": true,
  "override_dsp_preset": true,
  "set_child_position": true,
  "position_relative_to_player": false,
  "use_world_position": false,
  "block_matching_events": false,
  "block_match_entity": false,
  "use_fadetime_volume_mapping_curve": false,
  "use_entity_position_if_local_player": true,
  "display_broadcast": true,
  "use_baked_occlusion": true,
  "preload_vsnds": true,
  "use_impact_speed_input_volume_mapping_curve": true,
  "set_mixlayer_amount_enable": true,
  "block_other": true,
  "use_velocity_volume_curve": true,
  "use_velocity_eq": true,
  "use_volume_convar": true,
  "stop_selection_music": "true",
  "stop_all_non_music": "true",
  "stop_music": "true",
  "vsnd_pause_with_game": false,
  "is_ui_sound": false,
  "use_uiposition": true,
  "position_offset_relative": false,
  "use_time_unfiltered_stereo_mapping_curve": true,
  "use_doppler": true,
  "stop_match_end": "true",
  "stop_loading": "true",
  "join_non_mvp_group": "true",
  "priority_override": "true",
  "loop_track": "true",
  "should_queue_track": "true",
  "update_track_syncpoint_index": "true",
  "stop_start_round": "true",
  "stop_tensec_count": "true",
  "stop_bomb_planted": "true",
  "stop_got_hostage": "true",
  "stop_music_except_mvp": "true",
  "skip_if_muted": "true",
  "test_mvp_block": "true",
  "check_for_classic_deathcam": "true",
  "stop_won_mvp": "true",
  "block_won_lost": "true",
  "occlusion": true,
  "dsp_preset": "reverb_9_mediumChamber",
  "soundevent_01": "",
  "mixgroup": "Amb_Common",
  "type": "csgo_mega",
  "base": "amb.base",
  "set_mixlayer_layer": "PlayerAttackerFeedbackLayer",
  "block_other_name": "DeathHeadShotArmor",
  "volume_convar": "snd_surf_volume_slide",
  "mixlayer_name": "VideoClipMixLayer",
  "distance_volume_mapping_curve": [
    [
      97.14286,
      1.0,
      -0.001763,
      -0.001763,
      2.0,
      3.0
    ],
    [
      2000.0,
      0.0,
      -0.000526,
      -0.000526,
      1.0,
      1.0
    ]
  ],
  "fadetime_volume_mapping_curve": [
    [
      0.0,
      1.0,
      -1.223776,
      -1.223776,
      2.0,
      3.0
    ],
    [
      0.691429,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "distance_unfiltered_stereo_mapping_curve": [
    [
      0.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      300.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "time_volume_mapping_curve": [
    [
      0.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      1.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "impact_speed_input_volume_mapping_curve": [
    [
      6.857143,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      92.571426,
      0.426471,
      0.002544,
      0.002544,
      3.0,
      1.0
    ],
    [
      400.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "time_mixlayer_amount_curve": [
    [
      0.0,
      1.0,
      -0.045188,
      -0.045188,
      2.0,
      3.0
    ],
    [
      0.137795,
      1.0,
      -3.242553,
      -3.242553,
      3.0,
      1.0
    ],
    [
      0.308399,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "velocity_volume_curve": [
    [
      0.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      2300.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      2600.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "time_unfiltered_stereo_mapping_curve": [
    [
      0.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      0.542857,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      1.928571,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "syncpoints_01": [
    0.0,
    1.996,
    3.989,
    5.993,
    7.992,
    9.985,
    12.002,
    14.007,
    15.982,
    17.993,
    19.98,
    21.991,
    23.99,
    25.995,
    27.999,
    29.993,
    32.003,
    33.996,
    36.001,
    37.988,
    39.999,
    42.01,
    43.991,
    45.99,
    47.989,
    49.994,
    51.999,
    53.992
  ],
  "syncpoints_02": [
    0.0,
    2.002,
    4.012,
    6.035,
    8.07,
    10.085,
    12.104,
    14.122,
    16.138,
    18.152,
    20.166,
    22.188,
    24.196,
    26.214,
    28.226,
    30.235,
    32.256,
    34.27,
    36.288,
    38.306
  ],
  "syncpoints_03": [
    3.075,
    4.951,
    4.798,
    6.838,
    8.72,
    10.608,
    12.485,
    14.38,
    16.269,
    18.153,
    20.036,
    21.921,
    23.81,
    25.697,
    27.576,
    29.467,
    31.349,
    33.219,
    35.115,
    37.0,
    38.882,
    40.764,
    42.652,
    44.539,
    46.421,
    48.306,
    50.191,
    52.076,
    53.978,
    55.851
  ],
  "uiposition": [
    0.0,
    0.0,
    0.0
  ],
  "use_distance_pitch_mapping_curve": true,
  "distance_pitch_mapping_curve": [
    [
      0.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      1000.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "occlusion_path_curve": [
    [
      0.0,
      0.0,
      0.0,
      0.0,
      2.0,
      3.0
    ],
    [
      1.0,
      1.0,
      0.0,
      0.0,
      2.0,
      3.0
    ]
  ],
  "doppler_factor": 1.0,
  "doppler_factor_receding": 1.0,
  "impact_speed_input": 0.0,
  "velocity_magnitude": 0.0,
  "voice_fade_out_time": 0.0,
  "voice_looped_culling_update_time": 0.25,
  "randomize_start_time": false,
  "restart_startpoint_03": 2.05,
  "source_soundscape": 0,
  "retrigger_keepalive_override": 0.0
};

export const TOGGLE_DEPENDENTS = {
  "use_distance_volume_mapping_curve": [
    "distance_volume_mapping_curve"
  ],
  "use_distance_unfiltered_stereo_mapping_curve": [
    "distance_unfiltered_stereo_mapping_curve"
  ],
  "use_distance_pitch_mapping_curve": [
    "distance_pitch_mapping_curve"
  ],
  "use_time_volume_mapping_curve": [
    "time_volume_mapping_curve"
  ],
  "use_time_unfiltered_stereo_mapping_curve": [
    "time_unfiltered_stereo_mapping_curve"
  ],
  "use_fadetime_volume_mapping_curve": [
    "fadetime_volume_mapping_curve"
  ],
  "use_velocity_volume_curve": [
    "velocity_volume_curve",
    "velocity_volume_seek_speed"
  ],
  "use_impact_speed_input_volume_mapping_curve": [
    "impact_speed_input_volume_mapping_curve",
    "impact_speed_input"
  ],
  "use_baked_occlusion": [
    "occlusion_path_curve"
  ],
  "use_doppler": [
    "doppler_factor",
    "doppler_factor_receding"
  ],
  "use_volume_convar": [
    "volume_convar"
  ],
  "use_uiposition": [
    "uiposition"
  ],
  "override_dsp_preset": [
    "dsp_preset",
    "dsp_blend"
  ],
  "enable_child_events": [
    "soundevent_01"
  ],
  "enable_retrigger": [
    "retrigger_interval_min",
    "retrigger_interval_max",
    "retrigger_radius",
    "retrigger_count",
    "retrigger_keepalive_override"
  ],
  "block_other": [
    "block_other_name",
    "block_other_duration",
    "block_other_distance"
  ],
  "block_matching_events": [
    "block_match_entity",
    "block_duration",
    "block_distance"
  ],
  "set_mixlayer_amount_enable": [
    "set_mixlayer_layer",
    "time_mixlayer_amount_curve"
  ]
};

export const PAIRED = [
  [
    "volume_random_min",
    "volume_random_max",
    "Volume Random"
  ],
  [
    "pitch_random_min",
    "pitch_random_max",
    "Pitch Random"
  ],
  [
    "retrigger_interval_min",
    "retrigger_interval_max",
    "Retrigger Interval"
  ],
  [
    "randomize_position_min_radius",
    "randomize_position_max_radius",
    "Randomize Position Radius"
  ],
  [
    "volume_fade_initial_input_min",
    "volume_fade_initial_input_max",
    "Volume Fade Initial Input"
  ],
  [
    "volume_fade_initial_input_map_min",
    "volume_fade_initial_input_map_max",
    "Volume Fade Initial Input Map"
  ]
];

export const DSP_PRESETS = [
  "reverb_2_crawlSpace",
  "reverb_3_smallTunnels",
  "reverb_4_smallCarpetRoom",
  "reverb_5_smallRoom",
  "reverb_6_largeRoom",
  "reverb_7_mediumHall",
  "reverb_8_mediumCarpetRoom",
  "reverb_9_mediumChamber",
  "reverb_10_warehouse",
  "reverb_11_smallBright9",
  "reverb_12_mediumBright",
  "reverb_13_largeBright",
  "reverb_14_brightHallway",
  "reverb_15_largeCarpetRoom",
  "reverb_16_carpetCorridor",
  "reverb_17_smallConcrete",
  "reverb_18_mediumConcrete",
  "reverb_19_largeConcrete",
  "reverb_20_outsideAlley",
  "reverb_21_outsideStreet",
  "reverb_22_outsideOpen",
  "reverb_23_smallBathroom",
  "reverb_24_largeBathroom"
];

export const TYPE_OBJECTS = [
  "csgo_mega",
  "csgo_music",
  "csgo_set_volume",
  "hlvr_set_soundevent_volume"
];

/**
 * Checks whether a SoundEvent Type requires the 'value' (通用数值参数) property
 */
export function typeNeedsValue(typeName) {
  if (!typeName || typeof typeName !== "string") return false;
  const t = typeName.toLowerCase().trim();
  return t.includes("set_") || t.includes("setter") || t.startsWith("set") || t.includes("_set");
}

export const MIXGROUPS = [
  "ArmsRace",
  "Weapons",
  "UI",
  "voip",
  "World",
  "Music",
  "BuyMusic",
  "DuckingMusic",
  "SelectedMusic",
  "All",
  "Footsteps",
  "Foley",
  "Physics",
  "BulletImpacts",
  "Explosions",
  "ExplosionsDistant",
  "Ambient",
  "WeaponsDistant",
  "Exceptions",
  "Amb_Common",
  "Aztec",
  "Assault",
  "Baggage",
  "Bank",
  "Boathouse",
  "Canals",
  "Cbble",
  "Chateau",
  "Compound",
  "Coop",
  "Dust",
  "Dust2",
  "Havana",
  "House",
  "Inferno",
  "Italy",
  "Lunacy",
  "Militia",
  "Mill",
  "Mirage",
  "Monastery",
  "Nuke",
  "Office",
  "Overpass",
  "Piranesi",
  "Port",
  "Prodigy",
  "Shacks",
  "Shoots",
  "Train",
  "Training",
  "Vertigo",
  "PlayerDamage",
  "KillCard",
  "PlayerVictim",
  "Anubis",
  "VO"
];

export const COMMON_BASE_EVENTS = [
  { value: 'amb.base', desc_zh: '通用环境音效基类', desc_en: 'Base for ambient sounds' },
  { value: 'Base.Weapon', desc_zh: '武器音效基类', desc_en: 'Base for weapon audio' },
  { value: 'Base.Footsteps', desc_zh: '脚步音效基类', desc_en: 'Base for footstep audio' },
  { value: 'UI.Base', desc_zh: 'UI/菜单音效基类', desc_en: 'Base for UI sounds' },
  { value: 'Physics.Base', desc_zh: '物理碰撞基类', desc_en: 'Base for physics sounds' },
  { value: 'Damage.Base', desc_zh: '受击伤害音效基类', desc_en: 'Base for damage sounds' }
];

export const PRESETS = {
  generic_3d: {
    id: 'generic_3d',
    name_zh: '3D 空间音效 (csgo_mega)',
    name_en: '3D Spatial Sound (csgo_mega)',
    eventName: 'SoundEvent_Custom.3D',
    properties: {
      type: 'csgo_mega',
      mixgroup: 'Amb_Common',
      vsnd_files_track_01: ['sounds/ambient/nature/wind_loop.vsnd'],
      volume: 1.0,
      pitch: 1.0,
      use_world_position: true,
      position: [0.0, 0.0, 0.0],
      distance_effect_mix: 0.0,
      use_distance_volume_mapping_curve: true,
      distance_volume_mapping_curve: [
        [97.14, 1.0, -0.00176, -0.00176, 2, 3],
        [2000.0, 0.0, -0.00052, -0.00052, 1, 1]
      ]
    }
  },
  debug_sound: {
    id: 'debug_sound',
    name_zh: '调试测试音效 (SoundDebug)',
    name_en: 'Debug Pink Noise (SoundDebug)',
    eventName: 'SoundEvent_Debug.Test',
    properties: {
      base: 'amb.base',
      vsnd_files_track_01: ['sounds/common/pink_noise_mono_loop.vsnd'],
      position_relative_to_player: true,
      volume: 1.0
    }
  },
  ui_sound: {
    id: 'ui_sound',
    name_zh: 'UI 界面音效 (2D)',
    name_en: 'UI Menu Sound (2D)',
    eventName: 'UI.CustomClick',
    properties: {
      type: 'csgo_mega',
      mixgroup: 'UI',
      is_ui_sound: true,
      vsnd_files_track_01: ['sounds/ui/menu_click.vsnd'],
      volume: 1.0,
      pitch: 1.0
    }
  },
  music_track: {
    id: 'music_track',
    name_zh: '音乐事件 (csgo_music)',
    name_en: 'Music Track (csgo_music)',
    eventName: 'Music.CustomTrack',
    properties: {
      type: 'csgo_music',
      mixgroup: 'Music',
      vsnd_files: 'sounds/music/custom_music_track.vsnd',
      volume: 1.0,
      loop_track: 'true',
      should_queue_track: 'true',
      stop_all_non_music: 'true'
    }
  },
  ambient_retrigger: {
    id: 'ambient_retrigger',
    name_zh: '随机周期重触发音效',
    name_en: 'Periodic Retrigger Ambient',
    eventName: 'Ambient_Custom.RandomBirds',
    properties: {
      type: 'csgo_mega',
      mixgroup: 'Ambient',
      vsnd_files_track_01: ['sounds/ambient/creatures/bird_call_01.vsnd'],
      volume: 0.8,
      volume_random_min: -0.2,
      volume_random_max: 0.2,
      pitch_random_min: -0.1,
      pitch_random_max: 0.1,
      enable_retrigger: true,
      retrigger_interval_min: 8.0,
      retrigger_interval_max: 20.0,
      retrigger_radius: 2000.0,
      use_world_position: true,
      position: [0.0, 0.0, 0.0]
    }
  },
  empty: {
    id: 'empty',
    name_zh: '空白事件',
    name_en: 'Blank SoundEvent',
    eventName: 'SoundEvent_Blank.Default',
    properties: {
      type: 'csgo_mega',
      volume: 1.0,
      vsnd_files_track_01: ['sounds/custom/sound.vsnd']
    }
  }
};

export { CURVE_PRESETS, generateCurveFromEndpoints } from "./curve.js";
