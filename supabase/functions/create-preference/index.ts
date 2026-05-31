import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado' }), { status: 500 });
  }

  let email = '';
  try {
    const body = await req.json();
    email = body.email ?? '';
  } catch (_) {}

  const preference = {
    items: [{
      id: 'metricora-pro-v1',
      title: 'Licença Vitalícia Metricora PRO v1.0.8',
      quantity: 1,
      unit_price: 1.00, // TESTE: trocar para 97.90 após validar
      currency_id: 'BRL',
    }],
    notification_url: 'https://hxwjseeuwetmfodpjbhc.supabase.co/functions/v1/mp-webhook',
    back_urls: {
      success: 'https://metricora.com.br/ativacao',
      failure: 'https://metricora.com.br/checkout',
      pending: 'https://metricora.com.br/checkout',
    },
    auto_return: 'approved',
    ...(email ? { payer: { email } } : {}),
  };

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });

  const data = await mpRes.json();
  if (!mpRes.ok) {
    return new Response(JSON.stringify({ error: 'Falha ao criar preferência', detail: data }), { status: 502 });
  }

  return new Response(
    JSON.stringify({ init_point: data.init_point, id: data.id }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } }
  );
});
