import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Pharmacy, Client, UserRole } from '../lib/types';
import { supabase } from '../lib/supabase';
import { isValidPhone, formatPhone, getAuthEmail } from '../lib/authUtils';

type AuthState = {
  user: Pharmacy | Client | null;
  userRole: UserRole | null;
  session: any;
  isAuthenticated: boolean;

  loginPharmacy: (identifier: string, password: string) => Promise<void>;
  registerPharmacy: (data: { name: string; identifier: string; password: string; phone?: string; address?: string }) => Promise<void>;

  loginClient: (identifier: string, password: string) => Promise<void>;

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

      loginPharmacy: async (identifier: string, password: string) => {
        const authEmail = getAuthEmail(identifier);
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) throw error;

        if (authData.user) {
          // Buscar farmácia por telefone ou email
          let pharmacyData;
          let pharmacyError;

          if (isValidPhone(identifier)) {
            const formattedPhone = formatPhone(identifier);
            const { data, error } = await supabase
              .from('pharmacies')
              .select('*')
              .eq('phone', formattedPhone)
              .maybeSingle();
            pharmacyData = data;
            pharmacyError = error;
          } else {
            const { data, error } = await supabase
              .from('pharmacies')
              .select('*')
              .eq('auth_id', authData.user.id)
              .maybeSingle();
            pharmacyData = data;
            pharmacyError = error;
          }

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

      registerPharmacy: async (data: { name: string; identifier: string; password: string; phone?: string; address?: string }) => {
        const authEmail = getAuthEmail(data.identifier);
        const phone = isValidPhone(data.identifier) ? formatPhone(data.identifier) : data.phone;
        
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: data.password,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Verificar se já existe farmácia com esse telefone
          if (phone) {
            const { data: existing } = await supabase
              .from('pharmacies')
              .select('id')
              .eq('phone', phone)
              .maybeSingle();
            
            if (existing) {
              throw new Error('Já existe uma farmácia cadastrada com este telefone');
            }
          }
          
          const { data: pharmacyData, error: insertError } = await supabase
            .from('pharmacies')
            .insert([{
              auth_id: authData.user.id,
              name: data.name,
              email: isValidPhone(data.identifier) ? null : data.identifier,
              phone: phone,
              address: data.address,
            }])
            .select()
            .single();

          if (insertError) throw insertError;

          const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authEmail,
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

      loginClient: async (identifier: string, password: string) => {
        console.log('🔍 loginClient iniciado:', { identifier, isPhone: isValidPhone(identifier) });
        const authEmail = getAuthEmail(identifier);
        console.log('📧 Email gerado para auth:', authEmail);
        
        // Tentar login normal
        let { data: authData, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        // Se falhar com credenciais inválidas, tentar criar usuário auth baseado no cliente existente
        if (error && error.message === 'Invalid login credentials') {
          console.log('🔄 Tentando criar usuário auth baseado em cliente existente...');
          
          try {
            // Buscar cliente por telefone ou email
            let clientData;
            if (isValidPhone(identifier)) {
              const formattedPhone = formatPhone(identifier);
              const { data, error: phoneError } = await supabase
                .from('clients')
                .select('*')
                .eq('phone', formattedPhone)
                .maybeSingle();
              
              if (phoneError) throw phoneError;
              clientData = data;
            } else {
              const { data, error: emailError } = await supabase
                .from('clients')
                .select('*')
                .eq('email', identifier)
                .maybeSingle();
              
              if (emailError) throw emailError;
              clientData = data;
            }
            
            if (clientData) {
              console.log('📋 Cliente encontrado no banco:', clientData.id);
              
              // Criar usuário no Supabase Auth
              const { data: newAuthData, error: signUpError } = await supabase.auth.signUp({
                email: authEmail,
                password: password,
              });
              
              if (signUpError) {
                console.error('❌ Erro ao criar usuário auth:', signUpError);
                throw signUpError;
              }
              
              if (newAuthData.user) {
                console.log('✅ Usuário auth criado, ID:', newAuthData.user.id);
                
                // Atualizar cliente com novo auth_id
                const { error: updateError } = await supabase
                  .from('clients')
                  .update({ auth_id: newAuthData.user.id })
                  .eq('id', clientData.id);
                
                if (updateError) {
                  console.error('❌ Erro ao atualizar auth_id do cliente:', updateError);
                  throw updateError;
                }
                
                console.log('✅ auth_id do cliente atualizado');
                
                // Fazer login com as novas credenciais
                const { data: retryAuthData, error: retryError } = await supabase.auth.signInWithPassword({
                  email: authEmail,
                  password,
                });
                
                if (retryError) {
                  console.error('❌ Erro no login após criar usuário:', retryError);
                  throw retryError;
                }
                
                authData = retryAuthData;
                error = null;
              }
            } else {
              console.error('❌ Cliente não encontrado no banco para:', identifier);
              throw new Error('Cliente não encontrado');
            }
          } catch (fallbackError: any) {
            console.error('❌ Erro no fallback:', fallbackError);
            throw error; // Lançar erro original
          }
        }

        if (error) {
          console.error('❌ Erro na autenticação Supabase:', error);
          throw error;
        }

        if (authData.user) {
          console.log('✅ Autenticação bem-sucedida, user ID:', authData.user.id);
          // Buscar cliente pelo auth_id (sempre, pois é o que identifica no Supabase Auth)
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('auth_id', authData.user.id)
            .maybeSingle();

          console.log('📋 Dados do cliente encontrado:', clientData);
          if (clientError) {
            console.error('❌ Erro ao buscar cliente:', clientError);
            throw clientError;
          }

          if (!clientData) {
            console.error('❌ Cliente não encontrado no banco para auth_id:', authData.user.id);
            throw new Error('Cliente não encontrado');
          }
          
          // Se foi login por telefone, validar que o telefone bate
          if (isValidPhone(identifier)) {
            const formattedPhone = formatPhone(identifier);
            console.log('📱 Validação de telefone:', { 
              telefoneLogin: identifier, 
              formattedPhone, 
              telefoneCliente: clientData.phone 
            });
            
            // Comparar ambos no mesmo formato (sem prefixo +55)
            const cleanLoginPhone = formattedPhone.replace('+55', '');
            const cleanClientPhone = clientData.phone ? clientData.phone.replace('+55', '') : '';
            
            if (cleanLoginPhone !== cleanClientPhone) {
              console.error('❌ Telefone não corresponde ao cadastro');
              throw new Error('Telefone não corresponde ao cadastro');
            } else {
              console.log('✅ Telefone válido!');
            }
          }

          set({
            user: clientData,
            userRole: 'client',
            session: authData.session,
            isAuthenticated: true,
          });
          console.log('✅ Login completo com sucesso!');
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
