import chalk from 'chalk';

export function json(data) {
  console.log(JSON.stringify(data, null, 2));
}

export function table(rows, columns) {
  if (!rows || rows.length === 0) {
    console.log(chalk.yellow('No results.'));
    return;
  }
  const arr = Array.isArray(rows) ? rows : [rows];
  if (columns) {
    const filtered = arr.map(r => {
      const obj = {};
      for (const c of columns) obj[c] = r[c] ?? '';
      return obj;
    });
    console.table(filtered);
  } else {
    console.table(arr);
  }
}

export function printChat(chat) {
  console.log(chalk.bold('Chat ID: ') + chat.id);
  if (chat.demo) console.log(chalk.bold('Demo:    ') + chalk.cyan(chat.demo));
  if (chat.files && chat.files.length > 0) {
    console.log(chalk.bold('\nFiles:'));
    for (const f of chat.files) {
      console.log(chalk.green(`  ${f.name}`));
    }
  }
}

export function printFiles(files) {
  if (!files || files.length === 0) {
    console.log(chalk.yellow('No files.'));
    return;
  }
  for (const f of files) {
    console.log(chalk.bold.cyan(`\n--- ${f.name} ---`));
    console.log(f.content);
  }
}

export function error(msg) {
  console.error(chalk.red('Error: ') + msg);
}

export async function streamResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    const err = parsed?.error || parsed;
    throw new Error(err?.userMessage || err?.message || JSON.stringify(err));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;

      try {
        const chunk = JSON.parse(payload);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
          fullText += content;
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }

  console.log(); // final newline
  return fullText;
}
