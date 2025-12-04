// use native fetch against Supabase REST and Auth Admin to reduce cold-start

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

type Body = { phone?: string; newPassword?: string };

const toDigits11 = (phone: string) => phone.replace(/\D/g, '').slice(0, 11);

const isValidPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 && /^[1-9]/.test(digits);
};

async function handleRequest(req: Request): Promise<Response> {
  console.log(`${new Date().toISOString()} ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return new Response('Server Misconfigured', { status: 500, headers: corsHeaders });

  const headers = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  } as const;

  let body: Body | null = null;
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      try {
        body = await req.json();
      } catch {
        const raw = await req.text();
        body = JSON.parse(raw);
      }
    } else {
      const raw = await req.text();
      body = JSON.parse(raw);
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }

  const phoneRaw = (body?.phone || '').trim();
  const newPassword = (body?.newPassword || '').trim();
  console.log('payload', { phoneRawLength: phoneRaw.length, hasPassword: !!newPassword });

  if (!phoneRaw || !isValidPhone(phoneRaw)) {
    return new Response(JSON.stringify({ error: 'Telefone inválido' }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  if (!newPassword || newPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'Senha muito curta' }), { status: 400, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }

  const phoneDigits = toDigits11(phoneRaw);
  console.log('phoneDigits', phoneDigits);

  const restUrl = `${url}/rest/v1/clients?select=id,auth_id,email&phone=eq.${phoneDigits}&limit=1`;
  const clientController = new AbortController();
  const clientTimeout = setTimeout(() => clientController.abort(), 15000);
  let clientResp: Response;
  try {
    clientResp = await fetch(restUrl, { headers, signal: clientController.signal });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'REST fetch failed';
    return new Response(JSON.stringify({ error: msg }), { status: 504, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  clearTimeout(clientTimeout);
  if (!clientResp.ok) {
    const msg = await clientResp.text();
    return new Response(JSON.stringify({ error: msg || `REST ${clientResp.status}` }), { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  const list = await clientResp.json() as Array<{ id: string; auth_id: string | null; email: string | null }>;
  const client = list?.[0] ?? null;
  console.log('clientLookup', { found: !!client, auth_id_present: !!client?.auth_id, hasEmail: !!client?.email });

  if (!client) {
    return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  const authId = client.auth_id;
  if (!authId) {
    return new Response(JSON.stringify({ error: 'Cliente sem auth_id' }), { status: 404, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }

  const authUrl = `${url}/auth/v1/admin/users/${authId}`;
  const authController = new AbortController();
  const authTimeout = setTimeout(() => authController.abort(), 15000);
  let upd: Response;
  try {
    upd = await fetch(authUrl, { method: 'PATCH', headers, body: JSON.stringify({ password: newPassword }), signal: authController.signal });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Auth fetch failed';
    return new Response(JSON.stringify({ error: msg }), { status: 504, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }
  clearTimeout(authTimeout);
  const updText = await upd.text();
  console.log('updateResult', { ok: upd.ok, status: upd.status, body: updText?.slice(0, 120) });
  if (!upd.ok) {
    return new Response(JSON.stringify({ error: updText || `Auth ${upd.status}` }), { status: upd.status, headers: { ...corsHeaders, 'content-type': 'application/json' } });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } });
}

Deno.serve(handleRequest);
