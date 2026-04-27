import { supabase } from '../config/supabase';

// ─────────────────────────────────────────────
// EMAIL / PASSWORD
// ─────────────────────────────────────────────

/**
 * Sign up with email + password.
 * Supabase sends a confirmation email automatically.
 * Returns { success, needsConfirmation, user }
 */
export const signUpWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) throw handleAuthError(error);

  // data.session is null until the email is confirmed
  const needsConfirmation = !data.session;

  return {
    success: true,
    needsConfirmation,
    token: data.session?.access_token || null,
    user: data.user
      ? {
          uid: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || null,
          displayName: data.user.user_metadata?.full_name || null,
          photoURL: data.user.user_metadata?.avatar_url || null,
          is_profile_complete: false,
        }
      : null,
  };
};

/**
 * Sign in with email + password.
 * Returns { success, user, token, isNewUser }
 */
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw handleAuthError(error);

  const session = data.session;
  const supaUser = data.user;

  // Fetch profile from public.profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supaUser.id)
    .single();

  return {
    success: true,
    user: {
      uid: supaUser.id,
      email: supaUser.email,
      name: profile?.name || supaUser.user_metadata?.full_name || null,
      displayName: profile?.name || supaUser.user_metadata?.full_name || null,
      photoURL: profile?.photo_url || supaUser.user_metadata?.avatar_url || null,
      ...profile,
      is_profile_complete: profile?.is_profile_complete || false,
    },
    token: session.access_token,
    isNewUser: !profile?.is_profile_complete,
  };
};



// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

/**
 * Create / update the user profile in public.profiles.
 * Called after sign-up to complete the profile setup step.
 */
export const updateUserProfile = async (uid, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: uid,
      name: profileData.name,
      phone_number: profileData.phoneNumber,
      city: profileData.city,
      district: profileData.district,
      village: profileData.village,
      total_land: profileData.totalLand,
      crops_grown: profileData.cropsGrown,
      email: profileData.email,
      photo_url: profileData.photoURL || '',
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw handleAuthError(error);

  return {
    success: true,
    user: {
      uid: data.id,
      email: data.email,
      name: data.name,
      displayName: data.name,
      phoneNumber: data.phone_number,
      city: data.city,
      district: data.district,
      village: data.village,
      totalLand: data.total_land,
      cropsGrown: data.crops_grown,
      photoURL: data.photo_url,
      is_profile_complete: data.is_profile_complete,
      isProfileComplete: data.is_profile_complete,
    },
  };
};

// ─────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────

export const sendPasswordResetEmail = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw handleAuthError(error);
  return { success: true };
};

// ─────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw handleAuthError(error);
  return { success: true };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Subscribe to Supabase auth state changes.
 * Returns the unsubscribe function (matches the Firebase onAuthStateChanged API shape).
 */
export const onAuthStateChanged = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null, session);
  });
  return () => subscription.unsubscribe();
};

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────

const handleAuthError = (error) => {
  const msg = error?.message || '';

  if (msg.includes('already registered') || msg.includes('User already registered')) {
    return new Error('This email is already registered. Please sign in instead.');
  }
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return new Error('Incorrect email or password.');
  }
  if (msg.includes('Email not confirmed')) {
    return new Error('Please confirm your email before signing in. Check your inbox.');
  }
  if (msg.includes('Password should be')) {
    return new Error('Password should be at least 6 characters.');
  }
  if (msg.includes('Network request failed') || msg.includes('fetch')) {
    return new Error('Network error. Please check your connection.');
  }
  if (msg.includes('Too many requests')) {
    return new Error('Too many attempts. Please try again later.');
  }

  return new Error(msg || 'An error occurred. Please try again.');
};
