# Teste de Autenticação por Telefone

## Passo a Passo para Testar

### 1. Criar um Cliente de Teste
1. Acesse o painel da farmácia: http://localhost:5174
2. Faça login com sua farmácia (use email ou telefone)
3. Vá para a aba "Clientes"
4. Clique em "Adicionar"
5. Preencha os dados:
   - **Nome**: Cliente Teste
   - **Telefone**: (11) 99999-9999
   - **Email**: (deixe vazio)
   - **Senha**: 123456
   - **Data de Nascimento**: (qualquer data)
6. Clique em "Adicionar"

### 2. Testar Login com Telefone
1. Faça logout se estiver logado
2. Vá para a tela de login de cliente
3. Digite no campo "Email ou Telefone": `(11) 99999-9999`
4. Digite a senha: `123456`
5. Clique em "Entrar"

### 3. Verificar Logs
Abra o console do navegador (F12) e observe os logs:
- Deve aparecer: `🔍 loginClient iniciado`
- Deve aparecer: `📧 Email gerado para auth: phone_5511999999999@system.local`
- Deve aparecer: `✅ Autenticação bem-sucedida`
- Deve aparecer: `✅ Login completo com sucesso!`

### 4. Se der Erro
Se aparecer erro, anote:
- Qual mensagem de erro apareceu?
- O que apareceu no console?
- O cliente foi criado no banco?

## Possíveis Problemas e Soluções

### "Cliente não encontrado"
- O cliente foi criado corretamente?
- O auth_id do cliente bate com o ID do usuário Supabase?

### "Telefone não corresponde ao cadastro"
- O telefone foi formatado corretamente?
- O telefone salvo no banco está no formato +5511999999999?

### "Invalid login credentials"
- O email fake foi gerado corretamente?
- A senha está correta?
- O usuário foi criado no Supabase Auth?

## Formato Esperado dos Dados

**Telefone no banco**: `+5511999999999`
**Email fake gerado**: `phone_5511999999999@system.local`
**Telefone digitado**: `(11) 99999-9999`

## Teste também com Email

Para garantir retrocompatibilidade:
1. Crie um cliente com email
2. Tente fazer login com o email
3. Deve funcionar normalmente