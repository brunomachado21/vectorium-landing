// supabase/functions/mp-webhook/index.ts
// Vectorium Systems - Pipeline de Licenciamento E2E

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

serve(async (req) => {
  try {
    const body = await req.json()

    // ROTA DE TESTE - simula pagamento aprovado sem consultar o MP
    if (body.type === 'test') {
      const emailCliente = body.email ?? 'brunomachadorocha@outlook.com'
      const chaveGerada = `PRO-${crypto.randomUUID().split('-')[0].toUpperCase()}`

      console.log(`[TEST] Iniciando... email: ${emailCliente}, chave: ${chaveGerada}`)
      console.log(`[TEST] SUPABASE_URL: ${Deno.env.get('SUPABASE_URL') ? 'OK' : 'MISSING'}`)
      console.log(`[TEST] SUPABASE_SERVICE_ROLE_KEY: ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'OK' : 'MISSING'}`)
      console.log(`[TEST] RESEND_API_KEY: ${RESEND_API_KEY ? 'OK' : 'MISSING'}`)

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: dbError } = await supabase
        .from('licencas')
        .insert({
          chave_ativacao: chaveGerada,
          email_cliente: emailCliente,
          status: 'ATIVO',
          device_id: null
        })

      if (dbError) {
        console.error('[TEST][ERRO] DB Error:', JSON.stringify(dbError))
        throw new Error(`DB Error: ${JSON.stringify(dbError)}`)
      }

      console.log(`[TEST][OK] Licenca inserida: ${chaveGerada} -> ${emailCliente}`)

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Metricora <onboarding@resend.dev>',
          to: [emailCliente],
          subject: 'Sua chave PRO do Metricora chegou!',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
              <h2 style="color: #1a1a1a;">Bem-vindo ao Metricora PRO!</h2>
              <p style="color: #444;">Obrigado pela sua compra. Aqui esta sua chave de ativacao:</p>
              <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">${chaveGerada}</span>
              </div>
              <p style="color: #444;"><strong>Como ativar:</strong></p>
              <ol style="color: #444; line-height: 1.8;">
                <li>Abra o app Metricora</li>
                <li>Va em <strong>Configuracoes &rarr; Ativar PRO</strong></li>
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
      console.log(`[TEST] Resend status: ${resendResponse.status}, body: ${JSON.stringify(resendData)}`)

      if (!resendResponse.ok) {
        throw new Error(`Resend falhou: ${JSON.stringify(resendData)}`)
      }

      console.log(`[TEST][OK] E-mail enviado para ${emailCliente} | Resend ID: ${resendData.id}`)

      return new Response(JSON.stringify({ message: 'Teste OK', chave: chaveGerada, email: emailCliente }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // FLUXO REAL - webhook do Mercado Pago
    if (body.type === 'payment' || body.action === 'payment.created') {
      const paymentId = body.data.id

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const emailCliente = paymentData.payer.email
        const chaveGerada = `PRO-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: dbError } = await supabase
          .from('licencas')
          .insert({
            chave_ativacao: chaveGerada,
            email_cliente: emailCliente,
            status: 'ATIVO',
            device_id: null
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
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Metricora <onboarding@resend.dev>',
            to: [emailCliente],
            subject: 'Sua chave PRO do Metricora chegou!',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                <h2 style="color: #1a1a1a;">Bem-vindo ao Metricora PRO!</h2>
                <p style="color: #444;">Obrigado pela sua compra. Aqui esta sua chave de ativacao:</p>
                <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">${chaveGerada}</span>
                </div>
                <p style="color: #444;"><strong>Como ativar:</strong></p>
                <ol style="color: #444; line-height: 1.8;">
                  <li>Abra o app Metricora</li>
                  <li>Va em <strong>Configuracoes &rarr; Ativar PRO</strong></li>
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
