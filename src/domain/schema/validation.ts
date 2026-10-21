import { z } from 'zod';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const SafeKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_]+$/, 'Property key can only contain alphanumeric characters and underscores')
  .refine((key) => !DANGEROUS_KEYS.has(key), {
    message: 'Illegal or dangerous prototype property key detected',
  });

export const SafeEventNameSchema = z
  .string()
  .trim()
  .min(1, 'Event name cannot be empty')
  .max(128, 'Event name cannot exceed 128 characters')
  .refine((name) => !/[\r\n\x00-\x1f]/.test(name), {
    message: 'Event name cannot contain line breaks or control characters',
  })
  .default('SoundEvent_Custom.3D');

export const Kv3PrimitiveOrArraySchema = z.union([
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
  n: SafeEventNameSchema,
  p: z.record(SafeKeySchema, Kv3PrimitiveOrArraySchema).default({}),
});

export type SoundEventSharePayload = z.infer<typeof SoundEventSharePayloadSchema>;
