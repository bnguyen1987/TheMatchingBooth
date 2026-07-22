const { getStore } = require('@netlify/blobs');

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

  const { op, key, value, prefix } = body;
  const store = getStore('matchbooth');

  try {
    if (op === 'set') {
      if (!key) return bad('key required');
      await store.set(key, value);
      return ok({ key, value });
    }

    if (op === 'get') {
      if (!key) return bad('key required');
      const val = await store.get(key);
      if (val === null) return { statusCode: 404, body: JSON.stringify({ error: 'not found' }) };
      return ok({ key, value: val });
    }

    if (op === 'delete') {
      if (!key) return bad('key required');
      await store.delete(key);
      return ok({ key, deleted: true });
    }

    if (op === 'list') {
      const { blobs } = await store.list({ prefix: prefix || '' });
      return ok({ keys: blobs.map(b => b.key) });
    }

    return bad('unknown op');
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function ok(obj) {
  return { statusCode: 200, body: JSON.stringify(obj), headers: { 'Content-Type': 'application/json' } };
}
function bad(msg) {
  return { statusCode: 400, body: JSON.stringify({ error: msg }) };
}
