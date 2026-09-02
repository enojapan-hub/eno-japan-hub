-- Referral: claim a referral code (one time per user)
CREATE OR REPLACE FUNCTION public.award_referral_signup(p_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_referrer uuid;
  v_points integer := 100;
BEGIN
  IF v_user IS NULL OR p_code IS NULL OR btrim(p_code) = '' THEN
    RETURN 0;
  END IF;

  SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = btrim(p_code) LIMIT 1;
  IF v_referrer IS NULL OR v_referrer = v_user THEN
    RETURN 0;
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = v_user) THEN
    RETURN 0;
  END IF;

  INSERT INTO public.referrals (referrer_id, code, referred_user_id, status, points_awarded)
  VALUES (v_referrer, btrim(p_code), v_user, 'qualified', v_points);

  INSERT INTO public.user_stats (user_id, reward_points)
  VALUES (v_referrer, v_points)
  ON CONFLICT (user_id) DO UPDATE SET reward_points = public.user_stats.reward_points + v_points;

  RETURN v_points;
END;
$$;

REVOKE ALL ON FUNCTION public.award_referral_signup(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.award_referral_signup(text) TO authenticated;

-- Rewards: redeem points for premium days (1000 points = 7 days)
CREATE OR REPLACE FUNCTION public.redeem_referral_points(p_points integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_available integer := 0;
  v_days integer;
  v_expires timestamptz;
BEGIN
  IF v_user IS NULL OR p_points IS NULL OR p_points < 1000 THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(reward_points, 0) INTO v_available FROM public.user_stats WHERE user_id = v_user;
  IF v_available IS NULL OR v_available < p_points THEN
    RETURN 0;
  END IF;

  v_days := (p_points / 1000) * 7;

  UPDATE public.user_stats SET reward_points = reward_points - p_points WHERE user_id = v_user;

  INSERT INTO public.reward_grants (user_id, reward_kind, premium_days, points_spent, note)
  VALUES (v_user, 'premium_days', v_days, p_points, 'Penukaran poin referral');

  SELECT expires_at INTO v_expires
  FROM public.user_entitlements
  WHERE user_id = v_user AND status = 'active' AND plan <> 'free'
  ORDER BY expires_at DESC NULLS FIRST
  LIMIT 1;

  IF v_expires IS NULL OR v_expires < now() THEN
    v_expires := now();
  END IF;

  INSERT INTO public.user_entitlements (user_id, plan, status, source, started_at, expires_at)
  VALUES (v_user, 'premium_monthly', 'active', 'referral_reward', now(), v_expires + (v_days || ' days')::interval);

  RETURN v_days;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_referral_points(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral_points(integer) TO authenticated;