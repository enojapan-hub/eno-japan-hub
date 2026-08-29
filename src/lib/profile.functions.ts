import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const settingsSchema = z.object({
  display_name: z.string().trim().min(2).max(60),
  target_level: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  ui_language: z.enum(["id", "en", "ja"]),
  daily_kanji_target: z.number().int().min(0).max(100),
  daily_vocab_target: z.number().int().min(0).max(200),
  daily_grammar_target: z.number().int().min(0).max(100),
  furigana_enabled: z.boolean(),
  daily_reminder: z.boolean(),
});

export type ProfileSettingsInput = z.infer<typeof settingsSchema>;

/** Ambil profil + pengaturan pengguna yang sedang masuk. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, settingsRes, rolesRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, display_name, avatar_url, ui_language, target_level, created_at")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("user_settings")
        .select(
          "daily_kanji_target, daily_vocab_target, daily_grammar_target, furigana_enabled, daily_reminder",
        )
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (settingsRes.error) throw new Error(settingsRes.error.message);
    if (rolesRes.error) throw new Error(rolesRes.error.message);

    return {
      profile: profileRes.data,
      settings: settingsRes.data,
      roles: (rolesRes.data ?? []).map((r) => r.role),
    };
  });

/** Simpan profil + target harian. */
export const updateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { error: profileError } = await context.supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        target_level: data.target_level,
        ui_language: data.ui_language,
      })
      .eq("id", context.userId);
    if (profileError) throw new Error(profileError.message);

    const { error: settingsError } = await context.supabase
      .from("user_settings")
      .update({
        daily_kanji_target: data.daily_kanji_target,
        daily_vocab_target: data.daily_vocab_target,
        daily_grammar_target: data.daily_grammar_target,
        furigana_enabled: data.furigana_enabled,
        daily_reminder: data.daily_reminder,
      })
      .eq("user_id", context.userId);
    if (settingsError) throw new Error(settingsError.message);

    return { ok: true };
  });
