// supabase/functions/mp-webhook/index.ts
// Vectorium Systems - Pipeline de Licenciamento E2E

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')  ?? ''

Deno.serve(async (req) => {
  try {
    const body = await req.json()

    // FLUXO REAL - webhook do Mercado Pago
    if (body.type === 'payment' || body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id
      if (!paymentId) {
        return new Response(JSON.stringify({ message: 'Sem payment id, ignorado' }), { status: 200 })
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const emailCliente = paymentData.payer.email
        const chaveGerada  = `PRO-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Evita duplicata: verifica se payment_id já foi processado
        const { data: existing } = await supabase
          .from('licencas')
          .select('id')
          .eq('payment_id', paymentId)
          .maybeSingle()

        if (existing) {
          console.log(`[SKIP] payment_id ${paymentId} já processado`)
          return new Response(JSON.stringify({ message: 'Já processado' }), { status: 200 })
        }

        const { error: dbError } = await supabase
          .from('licencas')
          .insert({
            chave_ativacao: chaveGerada,
            email_cliente:  emailCliente,
            payment_id:     String(paymentId),
            status:         'ATIVO',
            device_id:      null
          })

        if (dbError) {
          console.error('[ERRO] DB Error:', JSON.stringify(dbError))
          throw new Error(`DB Error: ${JSON.stringify(dbError)}`)
        }

        console.log(`[OK] Licenca inserida: ${chaveGerada} -> ${emailCliente}`)

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({
            from:    'Vectorium <suporte@vectorium.tec.br>',
            to:      [emailCliente],
            subject: 'Sua chave PRO do Metricora chegou!',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                <h2 style="color: #1a1a1a;">Bem-vindo ao Metricora PRO!</h2>
                <p style="color: #444;">Obrigado pela sua compra. Aqui está sua chave de ativação:</p>
                <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">${chaveGerada}</span>
                </div>
                <p style="color: #444;"><strong>Como ativar:</strong></p>
                <ol style="color: #444; line-height: 1.8;">
                  <li>Abra o app Metricora</li>
                  <li>Vá em <strong>Configurações &rarr; Ativar PRO</strong></li>
                  <li>Digite seu e-mail e a chave acima</li>
                  <li>Pronto! Sua conta vira PRO imediatamente.</li>
                </ol>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">Vectorium Systems &middot; Metricora &middot; suporte via WhatsApp</p>
              </div>
            `
          })
        })

        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          console.error('[ERRO] Resend falhou:', JSON.stringify(resendData))
          throw new Error(`Resend falhou: ${JSON.stringify(resendData)}`)
        }

        console.log(`[OK] E-mail enviado para ${emailCliente} | Resend ID: ${resendData.id}`)
      } else {
        console.log(`[SKIP] Status do pagamento: ${paymentData.status} — nenhuma ação tomada`)
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : JSON.stringify(error)
    console.error('[ERRO FATAL] Webhook:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
