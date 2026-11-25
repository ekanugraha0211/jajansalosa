import { describe, expect, it, vi } from 'vitest';
import { signInAdmin } from '../services/authService';
import * as supabaseLib from '../lib/supabase';

describe('authService error messages', () => {
  it('returns clear Indonesian guidance on invalid login credentials', async () => {
    const mockClient = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials' },
        }),
        signOut: vi.fn(),
      },
    };

    vi.spyOn(supabaseLib, 'requireSupabase').mockReturnValue(
      mockClient as unknown as ReturnType<typeof supabaseLib.requireSupabase>
    );

    await expect(
      signInAdmin('admin@jajansalosa.com', 'salah')
    ).rejects.toThrow(/Supabase Authentication -> Users/i);
  });
});
