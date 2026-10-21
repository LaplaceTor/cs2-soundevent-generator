import { z } from 'zod';

const Kv3PrimitiveOrArraySchema = z.union([
  z.string().max(1024),
  z.number().finite(),
  z.boolean(),
  z.array(
    z.union([
      z.string().max(512),
      z.number().finite(),
      z.array(z.number().finite()).max(8),
    ])
  ).max(128),
]);

export const SoundEventSharePayloadSchema = z.object({
  n: z.string().min(1).max(128).default('SoundEvent_Custom.3D'),
  p: z.record(
    z.string().regex(/^[a-zA-Z0-9_]+$/).max(64),
    Kv3PrimitiveOrArraySchema
  ).default({}),
});

export type SoundEventSharePayload = z.infer<typeof SoundEventSharePayloadSchema>;
