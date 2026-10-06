import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pledgeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  honoree: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(160).optional(),
  schedule: z.string().trim().max(120).optional(),
  intention: z.string().trim().max(1000).optional(),
});

export type PledgeInput = z.infer<typeof pledgeSchema>;

export const submitPledge = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pledgeSchema.parse(data))
  .handler(async ({ data }) => {
    if (!data.phone && !data.email) {
      return { ok: false as const, error: "Merci d'indiquer un téléphone ou un e-mail." };
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("promise_pledges").insert({
        name: data.name,
        honoree: data.honoree || null,
        phone: data.phone || null,
        email: data.email || null,
        schedule: data.schedule || null,
        intention: data.intention || null,
      });
      if (error) {
        console.error("[promesses] insert failed:", error.message);
        return { ok: false as const, error: "Enregistrement impossible pour le moment, merci de réessayer." };
      }
      return { ok: true as const };
    } catch (err) {
      console.error("[promesses] unexpected error:", err);
      return { ok: false as const, error: "Enregistrement impossible pour le moment, merci de réessayer." };
    }
  });
