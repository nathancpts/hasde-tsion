import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export type PledgeRow = {
  id: string;
  name: string;
  honoree: string | null;
  phone: string | null;
  email: string | null;
  schedule: string | null;
  intention: string | null;
  status: string;
  created_at: string;
};

export const getAdminPledges = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !data) throw new Response("Forbidden", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error: readError } = await supabaseAdmin
      .from("promise_pledges")
      .select("id, name, honoree, phone, email, schedule, intention, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (readError) {
      console.error("[promesses] admin read failed:", readError.message);
      return { pledges: [] as PledgeRow[] };
    }
    return { pledges: (rows ?? []) as PledgeRow[] };
  });

export const deletePledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !isAdmin) throw new Response("Forbidden", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delError } = await supabaseAdmin.from("promise_pledges").delete().eq("id", data.id);
    if (delError) {
      console.error("[promesses] delete failed:", delError.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
