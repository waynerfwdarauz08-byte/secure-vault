import { z } from "zod";
export const password = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "Incluí minúscula")
  .regex(/[A-Z]/, "Incluí mayúscula")
  .regex(/[0-9]/, "Incluí número")
  .regex(/[^\p{L}\p{N}\s]/u, "Incluí símbolo");
export const email = z.string().trim().toLowerCase().email().max(254);
export const registration = z.strictObject({
  name: z.string().trim().min(1).max(100),
  email,
  password,
});
export const login = z.strictObject({
  email,
  password: z.string().min(1).max(128),
});
export const note = z.strictObject({
  title: z.string().trim().min(1).max(120),
  body: z.string().max(10000),
  entryDate: z.iso.date(),
  mood: z.enum(["", "sereno", "feliz", "cansado", "reflexivo"]).default(""),
  tags: z.array(z.string().trim().min(1).max(24)).max(5).default([]),
  isFavorite: z.boolean().default(false),
  cardColor: z.enum(["sage", "clay", "lavender", "paper"]).default("sage"),
  coverId: z
    .enum(["botanical", "sunrise", "waves", "none"])
    .default("botanical"),
});
export const phone = z.string().regex(/^\+?[0-9 ()-]{7,25}$/);
export const profile = z.strictObject({
  name: z.string().trim().min(1).max(100).optional(),
  phone: phone.nullable().optional(),
});
export const page = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const uuid = z.uuid();
