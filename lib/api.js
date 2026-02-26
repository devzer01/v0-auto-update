const BASE_URL = 'https://api.v0.dev';

export function getApiKey() {
  const key = process.env.V0_API_KEY;
  if (!key) {
    console.error('Error: V0_API_KEY environment variable is not set.');
    console.error('Set it with: export V0_API_KEY=your_key_here');
    process.exit(1);
  }
  return key;
}

async function request(method, path, body = null, { stream = false } = {}) {
  const apiKey = getApiKey();
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);

  if (stream) return res;

  const data = await res.json();
  if (!res.ok) {
    const err = data.error || data;
    throw new Error(err.userMessage || err.message || JSON.stringify(err));
  }
  return data;
}

// --- Projects ---

export async function listProjects() {
  return request('GET', '/v1/projects');
}

export async function createProject(name) {
  return request('POST', '/v1/projects', { name });
}

export async function getProject(id) {
  return request('GET', `/v1/projects/${encodeURIComponent(id)}`);
}

export async function updateProject(id, updates) {
  return request('PUT', `/v1/projects/${encodeURIComponent(id)}`, updates);
}

export async function deleteProject(id) {
  return request('DELETE', `/v1/projects/${encodeURIComponent(id)}`);
}

// --- Chats ---

export async function createChat(opts) {
  return request('POST', '/v1/chats', opts);
}

export async function getChat(chatId) {
  return request('GET', `/v1/chats/${encodeURIComponent(chatId)}`);
}

export async function getMessages(chatId) {
  return request('GET', `/v1/chats/${encodeURIComponent(chatId)}/messages`);
}

export async function sendMessage(chatId, message) {
  return request('POST', `/v1/chats/${encodeURIComponent(chatId)}/messages`, { message });
}

// --- Deployments ---

export async function createDeployment(opts) {
  return request('POST', '/v1/deployments', opts);
}

// --- Model API (chat completions) ---

export async function chatCompletions(body, { stream = false } = {}) {
  const res = await request('POST', '/v1/chat/completions', body, { stream });
  if (stream) return res;
  return res;
}
