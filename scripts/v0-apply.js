#!/usr/bin/env node

/**
 * Reads v0.md, sends its content to the v0 Platform API,
 * and writes the generated files to the repo.
 *
 * Usage: node scripts/v0-apply.js
 *
 * Env vars:
 *   V0_API_KEY   - v0 API key (required)
 *   V0_PROJECT_ID - v0 project ID (optional, uses first project if not set)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE_URL = 'https://api.v0.dev';
const REQUEST_TIMEOUT_MS = parseInt(process.env.V0_TIMEOUT_MS || '600000', 10); // 10 minutes

async function request(method, path, body = null) {
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) {
    console.error('V0_API_KEY is not set');
    process.exit(1);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, opts);
  } finally {
    clearTimeout(timeout);
  }
  const data = await res.json();

  if (!res.ok) {
    const err = data.error || data;
    throw new Error(err.userMessage || err.message || JSON.stringify(err));
  }
  return data;
}

async function main() {
  // 1. Read v0.md
  const prompt = readFileSync('v0.md', 'utf-8').trim();
  if (!prompt) {
    console.error('v0.md is empty');
    process.exit(1);
  }
  console.log(`Prompt (${prompt.length} chars):\n${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}\n`);

  // 2. Resolve project ID
  let projectId = process.env.V0_PROJECT_ID;
  if (!projectId) {
    console.log('No V0_PROJECT_ID set, fetching first project...');
    const projects = await request('GET', '/v1/projects');
    const list = Array.isArray(projects) ? projects : projects.projects || projects.data || [];
    if (list.length === 0) {
      console.log('No existing project, creating one...');
      const p = await request('POST', '/v1/projects', { name: 'v0-auto' });
      projectId = p.id;
    } else {
      projectId = list[0].id;
    }
  }
  console.log(`Project ID: ${projectId}`);

  // 3. Create chat with the prompt
  console.log('Sending prompt to v0...');
  const chat = await request('POST', '/v1/chats', {
    message: prompt,
    projectId,
  });

  console.log(`Chat ID: ${chat.id}`);
  if (chat.demo) console.log(`Demo: ${chat.demo}`);

  // 4. Extract files
  const versionFiles = chat.latestVersion?.files || [];
  const chatFiles = chat.files || [];
  // latestVersion.files have .name/.content, chat.files have .meta.file/.source
  const files = [];

  for (const f of versionFiles) {
    if (f.name && f.content) files.push({ name: f.name, content: f.content });
  }
  // Fallback to chat.files if version files are empty
  if (files.length === 0) {
    for (const f of chatFiles) {
      const name = f.name || f.meta?.file;
      const content = f.content || f.source;
      if (name && content) files.push({ name, content });
    }
  }

  if (files.length === 0) {
    console.error('v0 returned no files');
    process.exit(1);
  }

  // 5. Write files
  console.log(`\nWriting ${files.length} file(s):`);
  const written = [];
  for (const f of files) {
    const filePath = join('.', f.name);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, f.content);
    console.log(`  ${f.name}`);
    written.push(f.name);
  }

  // 6. Output summary for the workflow
  const summary = [
    `## v0 Generation Summary`,
    ``,
    `**Prompt:** ${prompt.slice(0, 200)}${prompt.length > 200 ? '...' : ''}`,
    ``,
    `**Chat:** [${chat.id}](https://v0.app/chat/${chat.id})`,
    chat.demo ? `**Preview:** ${chat.demo}` : '',
    ``,
    `**Files changed:**`,
    ...written.map(f => `- \`${f}\``),
  ].filter(Boolean).join('\n');

  // Write to GITHUB_OUTPUT if in CI
  if (process.env.GITHUB_OUTPUT) {
    const eof = 'EOF_' + Math.random().toString(36).slice(2);
    const outputLines = [
      `chat_id=${chat.id}`,
      `project_id=${projectId}`,
      `demo_url=${chat.demo || ''}`,
      `file_count=${files.length}`,
      `pr_body<<${eof}`,
      summary,
      eof,
    ].join('\n');
    writeFileSync(process.env.GITHUB_OUTPUT, outputLines + '\n', { flag: 'a' });
  }

  // Write to GITHUB_STEP_SUMMARY if in CI
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n', { flag: 'a' });
  }

  console.log('\nDone!');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
