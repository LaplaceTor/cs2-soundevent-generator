import { z } from 'zod';

export const SoundEventSharePayloadSchema = z.object({
  n: z.string().min(1).default('SoundEvent_Custom.3D'),
  p: z.record(z.any()).default({}),
});

export type SoundEventSharePayload = z.infer<typeof SoundEventSharePayloadSchema>;
