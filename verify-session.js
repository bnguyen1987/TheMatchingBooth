const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Price in cents. $10.00 by default — change this to adjust the price guests pay.
const PRICE_CENTS = 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { pendingId, eventId } = body;
  if (!pendingId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'pendingId required' }) };
  }
  const safeEventId = encodeURIComponent(eventId || 'default');

  const origin = event.headers.origin || `https://${event.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'The Matching Booth — Get Matched' },
            unit_amount: PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?mode=phone&event=${safeEventId}&paid=1&session_id={CHECKOUT_SESSION_ID}&pid=${encodeURIComponent(pendingId)}`,
      cancel_url: `${origin}/?mode=phone&event=${safeEventId}&paid=0&pid=${encodeURIComponent(pendingId)}`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
