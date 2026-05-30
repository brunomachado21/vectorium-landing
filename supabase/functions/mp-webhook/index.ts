// supabase/functions/mp-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Puxa as duas chaves do cofre de segurança do Supabase
const MERCADO_PAGO_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''

serve(async (req) => {
  try {
    // 1. Recebe o payload do Mercado Pago
    const url = new URL(req.url)
    const body = await req.json()

    // O Mercado Pago envia notificações de vários tipos. Queremos apenas as de "pagamento".
    if (body.type === 'payment' || body.action === 'payment.created') {
      const paymentId = body.data.id

      // 2. Consulta a API oficial do Mercado Pago para evitar fraudes
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MERCADO_PAGO_TOKEN}` }
      })
      const paymentData = await mpResponse.json()

      // 3. Verifica se o dinheiro realmente caiu na conta (PIX aprovado)
      if (paymentData.status === 'approved') {
        const emailCliente = paymentData.payer.email
        
        // Gera uma chave PRO limpa e aleatória
        const chaveGerada = `PRO-${crypto.randomUUID().split('-')[0].toUpperCase()}`

        // 4. Conecta no Supabase como Administrador (Ignora RLS)
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 5. Salva a licença no banco de dados vinculada ao e-mail
        const { error } = await supabase
          .from('licencas')
          .insert({
            chave_ativacao: chaveGerada,
            email_cliente: emailCliente,
            status: 'ATIVO',
            device_id: null // Fica nulo até o primeiro login no app
          })

        if (error) throw error

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
              </div>
            `
          })
        })

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

  } catch (error) {
    console.error("Erro fatal no processamento do webhook:", error)
    return new Response("Erro interno do servidor", { status: 500 })
  }
})