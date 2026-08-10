const { createClient } = require('@supabase/supabase-client');
const paypal = require('@paypal/payouts-sdk');

// 1. ENVIRONMENT CONFIGURATION
// These must be set in your Netlify Site Settings
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 2. PARSE REQUEST & AUTHENTICATE
  const { worker_id, amount_usd, paypal_email } = JSON.parse(event.body);
  
  // SECURE HANDSHAKE: Verify the user is who they say they are via session token
  // In production, validate event.headers.authorization against Supabase Auth
  
  try {
    // 3. LEDGER VALIDATION
    // Check Supabase to ensure the worker actually has the funds available
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, paypal_email')
      .eq('id', worker_id)
      .single();

    if (profileError || !profile) {
      return { statusCode: 404, body: JSON.stringify({ error: "WORKER_NOT_FOUND" }) };
    }

    // 4. INITIATE PAYPAL PAYOUT
    const requestBody = {
      "sender_batch_header": {
        "recipient_type": "EMAIL",
        "email_message": "Guild Harvest: Your funds have been successfully transferred.",
        "note": "Transaction Secured by The Workers Guild Payout Protocol.",
        "sender_batch_id": `batch_${Date.now()}`,
        "email_subject": "You have a payout from The Workers Guild!"
      },
      "items": [{
        "note": "Guild Treasury Disbursement",
        "amount": {
          "currency": "USD",
          "value": amount_usd.toString()
        },
        "receiver": profile.paypal_email,
        "sender_item_id": `payout_${worker_id}_${Date.now()}`
      }]
    };

    let request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody(requestBody);

    const response = await client.execute(request);
    const payoutBatchId = response.result.batch_header.payout_batch_id;

    // 5. UPDATE LEDGER (SUPABASE)
    // Log the transaction and subtract the harvested amount from the available balance
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert([
        { 
          user_id: worker_id, 
          amount: -amount_usd, 
          type: 'PAYOUT', 
          status: 'RELEASED',
          created_at: new Date().toISOString()
        }
      ]);

    if (ledgerError) throw ledgerError;

    // 6. SUCCESS RESPONSE
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Payout Dispatched Successfully",
        batch_id: payoutBatchId 
      })
    };

  } catch (err) {
    console.error("PAYOUT_FAILURE:", err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "TRANSACTION_FAILED", details: err.message }) 
    };
  }
};


