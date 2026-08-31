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

async function ensureMemberData(context: { supabase: any; userId: string; claims: any }) {
  const metadata = context.claims?.user_metadata ?? {};
  const displayName =
    metadata.full_name ?? metadata.name ?? context.claims?.email?.split("@")[0] ?? "ENO JAPAN Member";
  const avatarUrl = metadata.avatar_url ?? metadata.picture ?? null;

  const { error: profileError } = await context.supabase.from("profiles").upsert(
    {
      id: context.userId,
      display_name: displayName,
      avatar_url: avatarUrl,
      target_level: "N5",
      ui_language: "id",
      referral_code: context.userId.replace(/-/g, "").slice(0, 12).toUpperCase(),
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (profileError && profileError.code !== "23505") throw new Error(profileError.message);

  const { error: statsError } = await context.supabase.from("user_stats").upsert(
    { user_id: context.userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (statsError && statsError.code !== "23505") throw new Error(statsError.message);

  const { data: settings, error: settingsError } = await context.supabase
    .from("user_settings")
    .select("daily_kanji_target, daily_vocab_target, daily_grammar_target, furigana_enabled, daily_reminder")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (settingsError) throw new Error(settingsError.message);
  if (!settings) {
    const { data: createdSettings, error: createSettingsError } = await context.supabase
      .from("user_settings")
      .insert({
        user_id: context.userId,
        daily_kanji_target: 5,
        daily_vocab_target: 10,
        daily_grammar_target: 5,
        furigana_enabled: true,
        daily_reminder: false,
      })
      .select("daily_kanji_target, daily_vocab_target, daily_grammar_target, furigana_enabled, daily_reminder")
      .single();
    if (createSettingsError && createSettingsError.code !== "23505") throw new Error(createSettingsError.message);
    return createdSettings ?? {
      daily_kanji_target: 5,
      daily_vocab_target: 10,
      daily_grammar_target: 5,
      furigana_enabled: true,
      daily_reminder: false,
    };
  }

  return settings;
}

/** Ambil profil + pengaturan pengguna yang sedang masuk. */
export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const settings = await ensureMemberData(context);

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id, display_name, avatar_url, ui_language, target_level, created_at, role")
      .eq("id", context.userId)
      .single();
    if (profileError) throw new Error(profileError.message);

    return {
      profile,
      settings,
      roles: profile.role ? [profile.role] : ["student"],
    };
  });

/** Simpan profil + target harian. */
export const updateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => settingsSchema.parse(data))
  .handler(async ({ context, data }) => {
    await ensureMemberData(context);

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
      .upsert(
        {
          user_id: context.userId,
          daily_kanji_target: data.daily_kanji_target,
          daily_vocab_target: data.daily_vocab_target,
          daily_grammar_target: data.daily_grammar_target,
          furigana_enabled: data.furigana_enabled,
          daily_reminder: data.daily_reminder,
        },
        { onConflict: "user_id" },
      );
    if (settingsError) throw new Error(settingsError.message);

    return { ok: true };
  });
