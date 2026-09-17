import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: avatarFiles } = await supabaseAdmin.storage.from("avatars").list(context.userId);
    if (avatarFiles?.length) {
      const paths = avatarFiles.map((file) => `${context.userId}/${file.name}`);
      await supabaseAdmin.storage.from("avatars").remove(paths);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Impossible de supprimer le compte pour le moment.");

    return { ok: true };
  });