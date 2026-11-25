import { requireSupabase } from '../lib/supabase';
import type { AdminProfile } from '../types';

export async function fetchAdminProfileForUser(
  userId: string
): Promise<AdminProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('admins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.message.toLowerCase().includes('permission denied')) {
      throw new Error(
        'Izin akses tabel admins belum diberikan. Jalankan skrip supabase/fix_permissions.sql di Supabase SQL Editor.'
      );
    }
    throw new Error(error.message);
  }
  return (data as AdminProfile | null) ?? null;
}

export async function signInAdmin(
  email: string,
  password: string
): Promise<AdminProfile> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    const rawMsg = error?.message?.toLowerCase() ?? '';
    if (rawMsg.includes('invalid login credentials')) {
      throw new Error(
        'Email atau kata sandi salah. Pastikan akun dan password admin sudah dibuat di Supabase Authentication -> Users.'
      );
    }
    if (rawMsg.includes('email not confirmed')) {
      throw new Error(
        'Email belum dikonfirmasi. Aktifkan "Auto Confirm User" di Supabase Authentication -> Users.'
      );
    }
    throw new Error(error?.message || 'Email atau kata sandi salah.');
  }

  const adminProfile = await fetchAdminProfileForUser(data.user.id);
  if (!adminProfile) {
    await client.auth.signOut();
    throw new Error(
      'Akun Anda tidak terdaftar sebagai administrator Jajan Salosa.'
    );
  }

  return adminProfile;
}

export async function signOutAdmin(): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}
