import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Accès réservé aux administrateurs");
}

/** Crée une annonce et l'envoie immédiatement à tous les appareils abonnés. */
export const sendAnnouncementNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string; body: string; url?: string; id?: string }) => {
    const title = input.title?.trim();
    const body = input.body?.trim();
    if (!title || !body) throw new Error("Titre et message requis");
    return { title, body, url: input.url?.trim() || undefined, id: input.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendPushToAll } = await import("@/lib/webpush.server");

    let id = data.id;
    if (!id) {
      const { data: row, error } = await supabaseAdmin
        .from("announcements")
        .insert({
          title: data.title,
          body: data.body,
          url: data.url ?? null,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error || !row) throw new Error(error?.message ?? "Impossible d'enregistrer l'annonce");
      id = row.id;
    }

    const sent = await sendPushToAll(
      { title: data.title, body: data.body, url: data.url ?? "/", tag: `annonce-${id}` },
      supabaseAdmin,
    );

    await supabaseAdmin
      .from("announcements")
      .update({ sent_at: new Date().toISOString(), sent_count: sent })
      .eq("id", id!);

    return { ok: true, sent };
  });

/** Statistiques de l'espace admin : membres inscrits et appareils abonnés. */
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: members }, { count: devices }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("push_subscriptions").select("id", { count: "exact", head: true }),
    ]);

    const { data: list } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    return {
      members: members ?? 0,
      devices: devices ?? 0,
      list: (list ?? []) as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        created_at: string;
      }[],
    };
  });
