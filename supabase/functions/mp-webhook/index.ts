// supabase/functions/mp-webhook/index.ts
<<<<<<< HEAD
=======
// Vectorium Systems - Pipeline de Licenciamento E2E
>>>>>>> 582790fa85fd58e5ec27488521fa1ceb51d130a3

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

<<<<<<< HEAD
// Puxa as duas chaves do cofre de segurança do Supabase
const MERCADO_PAGO_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
=======
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
>>>>>>> 582790fa85fd58e5ec27488521fa1ceb51d130a3
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

serve(async (req) => {
  try {
    const body = await req.json()

    if (body.type === 'payment' || body.action === 'payment.created') {
      const paymentId = body.data.id

      // 1. Valida pagamento na API oficial do Mercado Pago (anti-fraude)
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const emailCliente = paymentData.payer.email

        // 2. Gera chave PRO aleatória
        const chaveGerada = `PRO-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        // 3. Conecta no Supabase como Admin (bypassa RLS)
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Salva a licença no banco
        const { error: dbError } = await supabase
          .from('licencas')
          .insert({
            chave_ativacao: chaveGerada,
            email_cliente: emailCliente,
            status: 'ATIVO',
            device_id: null
          })

        if (dbError) throw dbError

<<<<<<< HEAD
        console.log(`✅ Licença ${chaveGerada} gerada com sucesso no banco para ${emailCliente}`)
        
        // =======================================================
        // 6. NOVO MOTOR: DISPARO DE E-MAIL VIA RESEND API
        // =======================================================
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // ATENÇÃO: Enquanto não validar o domínio, use onboarding@resend.dev para testes.
            // Depois mude para contato@vectorium.tec.br
            from: 'Vectorium Systems <onboarding@resend.dev>', 
            to: [emailCliente],
            subject: 'Sua Licença PRO - Vectorium Systems',
            html: `
              <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
                <h2 style="color: #6200EA; text-align: center;">Bem-vindo à Vectorium Systems!</h2>
                <p>Seu pagamento foi aprovado com sucesso. Sua licença vitalícia está pronta e vinculada ao seu e-mail.</p>
                
                <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;">Sua Chave de Ativação:</p>
                  <h1 style="margin: 10px 0; color: #333; letter-spacing: 2px;">${chaveGerada}</h1>
                  <p style="margin: 0; color: #666; font-size: 14px;">E-mail de vínculo: <strong>${emailCliente}</strong></p>
                </div>
                
                <p><strong>Como acessar:</strong></p>
                <ol>
                  <li>Abra o aplicativo.</li>
                  <li>Acesse o menu Configurações > <b>Ativar Licença PRO</b>.</li>
                  <li>Insira o exato e-mail desta compra e a chave acima.</li>
                </ol>
                
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">Este é um e-mail automático. Em caso de dúvidas, acione nosso suporte.</p>
=======
        console.log(`✅ Licença inserida: ${chaveGerada} -> ${emailCliente}`)

        // 5. Envia a chave por e-mail via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Metricora <onboarding@resend.dev>',
            to: [emailCliente],
            subject: '🔑 Sua chave PRO do Metricora chegou!',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px;">
                <h2 style="color: #1a1a1a;">Bem-vindo ao Metricora PRO! 🎉</h2>
                <p style="color: #444;">Obrigado pela sua compra. Aqui está sua chave de ativação:</p>
                <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000;">${chaveGerada}</span>
                </div>
                <p style="color: #444;"><strong>Como ativar:</strong></p>
                <ol style="color: #444; line-height: 1.8;">
                  <li>Abra o app Metricora</li>
                  <li>Vá em <strong>Configurações → Ativar PRO</strong></li>
                  <li>Digite seu e-mail e a chave acima</li>
                  <li>Pronto! Sua conta vira PRO imediatamente ✨</li>
                </ol>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="color: #999; font-size: 12px;">Vectorium Systems · Metricora · suporte via WhatsApp</p>
>>>>>>> 582790fa85fd58e5ec27488521fa1ceb51d130a3
              </div>
            `
          })
        })

<<<<<<< HEAD
        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          console.error("❌ Falha crítica ao enviar e-mail:", errorText)
        } else {
          console.log(`✉️ E-mail com a chave enviado com sucesso para ${emailCliente}`)
        }
        // =======================================================
      }
    }

    // Retorna 200 OK para o Mercado Pago parar de tentar enviar o webhook
    return new Response(JSON.stringify({ message: 'Webhook e E-mail processados com sucesso' }), { status: 200 })
=======
        const resendData = await resendResponse.json()

        if (!resendResponse.ok) {
          console.error('❌ Resend erro:', resendData)
          throw new Error(`Resend falhou: ${JSON.stringify(resendData)}`)
        }

        console.log(`📧 E-mail enviado com sucesso para ${emailCliente} | Resend ID: ${resendData.id}`)
      }
    }

    return new Response(JSON.stringify({ message: 'Webhook processado' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
>>>>>>> 582790fa85fd58e5ec27488521fa1ceb51d130a3

  } catch (error) {
    console.error('Erro fatal no webhook:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
