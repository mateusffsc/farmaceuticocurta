/**
 * Utilitários para autenticação com telefone
 * Suporta autenticação por telefone ou email
 */

/**
 * Valida se o telefone é um número de celular brasileiro válido
 * Aceita formatos: (11) 99999-9999, 11999999999, +5511999999999
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Verifica se é um número de celular brasileiro válido
  // Deve ter 11 dígitos (incluindo o 9) e começar com 1-9
  if (cleanPhone.length === 11 && /^[1-9]/.test(cleanPhone)) {
    return true;
  }
  
  // Verifica se é um número com código do país +55
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    return true;
  }
  
  return false;
}

/**
 * Formata o telefone para o padrão +5511999999999
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se já tem 13 dígitos (com código do país), retorna como está
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    return '+' + cleanPhone;
  }
  
  // Se tem 11 dígitos, adiciona o código do país
  if (cleanPhone.length === 11) {
    return '+55' + cleanPhone;
  }
  
  // Se não for um formato válido, retorna o telefone limpo
  return cleanPhone;
}

/**
 * Gera um email fake a partir do telefone para uso no Supabase Auth
 * Formato: phone_{telefone}@system.local
 */
export function generateEmailFromPhone(phone: string): string {
  const formattedPhone = formatPhone(phone);
  return `phone_${formattedPhone.replace('+', '')}@system.local`;
}

/**
 * Detecta se o identificador é telefone ou email e retorna o email apropriado
 * Se for telefone, gera um email fake. Se for email, retorna o email original.
 */
export function getAuthEmail(identifier: string): string {
  if (isValidPhone(identifier)) {
    return generateEmailFromPhone(identifier);
  }
  
  // Se não for telefone, assume que é email e retorna como está
  return identifier;
}

/**
 * Valida se o email é válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Detecta o tipo do identificador (phone ou email)
 */
export function detectIdentifierType(identifier: string): 'phone' | 'email' {
  if (isValidPhone(identifier)) {
    return 'phone';
  }
  
  if (isValidEmail(identifier)) {
    return 'email';
  }
  
  // Padrão: assume que é email se não for telefone válido
  return 'email';
}

/**
 * Formata o identificador para exibição
 * Telefones: (11) 99999-9999
 * Emails: mantém o original
 */
export function formatIdentifier(identifier: string): string {
  if (isValidPhone(identifier)) {
    const cleanPhone = identifier.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    }
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      const localPhone = cleanPhone.slice(2);
      return `+55 (${localPhone.slice(0, 2)}) ${localPhone.slice(2, 7)}-${localPhone.slice(7)}`;
    }
  }
  
  return identifier;
}