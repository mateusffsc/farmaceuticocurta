import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Pharmacy, Client, UserRole } from '../lib/types';
import { supabase } from '../lib/supabase';

type AuthState = {
  user: Pharmacy | Client | null;
  userRole: UserRole | null;
  session: any;
  isAuthenticated: boolean;

  loginPharmacy: (email: string, password: string) => Promise<void>;
  registerPharmacy: (data: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<void>;

  loginClient: (email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userRole: null,
      session: null,
      isAuthenticated: false,

      loginPharmacy: async (email: string, password: string) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (authData.user) {
          const { data: pharmacyData, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('auth_id', authData.user.id)
            .maybeSingle();

          if (pharmacyError) throw pharmacyError;

          if (!pharmacyData) {
            throw new Error('Farmácia não encontrada');
          }

          set({
            user: pharmacyData,
            userRole: 'pharmacy',
            session: authData.session,
            isAuthenticated: true,
          });
        }
      },

      registerPharmacy: async (data) => {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { data: pharmacyData, error: insertError } = await supabase
            .from('pharmacies')
            .insert([{
              auth_id: authData.user.id,
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
            }])
            .select()
            .single();

          if (insertError) throw insertError;

          const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });

          if (signInError) throw signInError;

          set({
            user: pharmacyData,
            userRole: 'pharmacy',
            session: sessionData.session,
            isAuthenticated: true,
          });
        }
      },

      loginClient: async (email: string, password: string) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (authData.user) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('auth_id', authData.user.id)
            .maybeSingle();

          if (clientError) throw clientError;

          if (!clientData) {
            throw new Error('Cliente não encontrado');
          }

          set({
            user: clientData,
            userRole: 'client',
            session: authData.session,
            isAuthenticated: true,
          });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          userRole: null,
          session: null,
          isAuthenticated: false
        });
      },

      checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: pharmacyData } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          if (pharmacyData) {
            set({
              user: pharmacyData,
              userRole: 'pharmacy',
              session,
              isAuthenticated: true,
            });
            return;
          }

          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('auth_id', session.user.id)
            .maybeSingle();

          if (clientData) {
            set({
              user: clientData,
              userRole: 'client',
              session,
              isAuthenticated: true,
            });
            return;
          }
        }

        set({
          user: null,
          userRole: null,
          session: null,
          isAuthenticated: false
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
