// supabase/functions/mercado-pago-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADO_PAGO_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? ''

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

        console.log(`✅ Licença ${chaveGerada} gerada com sucesso para ${emailCliente}`)
        
        // (Opcional) Aqui você poderia chamar uma API de disparo de e-mail (Resend, SendGrid) 
        // para enviar a chave direto para a caixa de entrada do cliente.
      }
    }

    // Retorna 200 OK para o Mercado Pago parar de tentar enviar o webhook
    return new Response(JSON.stringify({ message: 'Webhook processado' }), { status: 200 })

  } catch (error) {
    console.error("Erro fatal no processamento do webhook:", error)
    return new Response("Erro interno do servidor", { status: 500 })
  }
})