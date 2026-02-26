#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as api from '../lib/api.js';
import * as out from '../lib/output.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const program = new Command();

program
  .name('v0')
  .description('CLI for the v0.dev Platform and Model APIs')
  .version('1.0.0');

// ─── Projects ──────────────────────────────────────────

const projects = program.command('projects').description('Manage v0 projects');

projects
  .command('list')
  .description('List all projects')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const data = await api.listProjects();
      const items = data.projects || data.data || data;
      if (opts.json) return out.json(items);
      out.table(Array.isArray(items) ? items : [items], ['id', 'name', 'createdAt']);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

projects
  .command('create <name>')
  .description('Create a new project')
  .option('--json', 'Output raw JSON')
  .action(async (name, opts) => {
    try {
      const data = await api.createProject(name);
      if (opts.json) return out.json(data);
      console.log(chalk.green('Project created!'));
      out.json(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

projects
  .command('get <id>')
  .description('Get project details')
  .action(async (id) => {
    try {
      out.json(await api.getProject(id));
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

projects
  .command('update <id>')
  .description('Update a project')
  .requiredOption('--name <name>', 'New project name')
  .action(async (id, opts) => {
    try {
      const data = await api.updateProject(id, { name: opts.name });
      console.log(chalk.green('Project updated!'));
      out.json(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

projects
  .command('delete <id>')
  .description('Delete a project')
  .action(async (id) => {
    try {
      await api.deleteProject(id);
      console.log(chalk.green(`Project ${id} deleted.`));
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

// ─── Chats ─────────────────────────────────────────────

const chats = program.command('chats').description('Manage v0 chats');

chats
  .command('create')
  .description('Create a new chat with an initial message')
  .requiredOption('-m, --message <message>', 'Initial message / prompt')
  .option('-p, --project <projectId>', 'Attach to a project')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const body = { message: opts.message };
      if (opts.project) body.projectId = opts.project;
      console.log(chalk.dim('Creating chat...'));
      const data = await api.createChat(body);
      if (opts.json) return out.json(data);
      out.printChat(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

chats
  .command('init')
  .description('Initialize a chat with existing files')
  .requiredOption('-f, --files <paths...>', 'File paths to include')
  .option('-p, --project <projectId>', 'Attach to a project')
  .option('-c, --context <message>', 'Initial context message')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const files = opts.files.map(fp => ({
        name: fp,
        content: readFileSync(fp, 'utf-8'),
      }));
      const body = { type: 'files', files };
      if (opts.project) body.projectId = opts.project;
      if (opts.context) body.initialContext = opts.context;
      console.log(chalk.dim('Initializing chat with files...'));
      const data = await api.createChat(body);
      if (opts.json) return out.json(data);
      out.printChat(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

chats
  .command('messages <chatId>')
  .description('Get messages from a chat')
  .option('--json', 'Output raw JSON')
  .action(async (chatId, opts) => {
    try {
      const data = await api.getMessages(chatId);
      if (opts.json) return out.json(data);
      const msgs = data.messages || data.data || data;
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          const role = m.role || 'unknown';
          const color = role === 'assistant' ? chalk.cyan : chalk.green;
          console.log(color.bold(`[${role}]`) + ' ' + (m.content || ''));
          console.log();
        }
      } else {
        out.json(msgs);
      }
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

chats
  .command('send <chatId>')
  .description('Send a message to a chat')
  .requiredOption('-m, --message <message>', 'Message to send')
  .option('--json', 'Output raw JSON')
  .action(async (chatId, opts) => {
    try {
      console.log(chalk.dim('Sending message...'));
      const data = await api.sendMessage(chatId, opts.message);
      if (opts.json) return out.json(data);
      out.printChat(data);
      if (data.files) out.printFiles(data.files);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

chats
  .command('init-repo')
  .description('Initialize a chat from a GitHub repo')
  .requiredOption('-r, --repo <url>', 'GitHub repo URL')
  .option('-p, --project <projectId>', 'Attach to a project')
  .option('-c, --context <message>', 'Initial context message')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const body = { type: 'repo', repo: { url: opts.repo } };
      if (opts.project) body.projectId = opts.project;
      if (opts.context) body.initialContext = opts.context;
      console.log(chalk.dim('Initializing chat from repo...'));
      const data = await api.createChat(body);
      if (opts.json) return out.json(data);
      out.printChat(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

chats
  .command('apply <chatId>')
  .description('Download files from a chat and write them to the local directory')
  .option('-d, --dir <path>', 'Target directory', '.')
  .option('--json', 'Output raw JSON of files')
  .action(async (chatId, opts) => {
    try {
      console.log(chalk.dim('Fetching chat...'));
      const data = await api.getChat(chatId);
      const files = data.latestVersion?.files || data.files || [];
      if (files.length === 0) {
        out.error('No files found in this chat.');
        process.exit(1);
      }
      if (opts.json) return out.json(files);
      for (const f of files) {
        const name = f.name || f.meta?.file;
        const content = f.content || f.source;
        if (!name || !content) continue;
        const filePath = join(opts.dir, name);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
        console.log(chalk.green('  wrote ') + filePath);
      }
      console.log(chalk.green(`\n${files.length} file(s) written.`));
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

// ─── PR Workflow ───────────────────────────────────────

program
  .command('pr')
  .description('Send a prompt to a project chat, apply changes, create & merge a PR')
  .requiredOption('-p, --project <projectId>', 'Project ID')
  .requiredOption('-m, --message <message>', 'Prompt message for v0')
  .option('-b, --branch <name>', 'Branch name', 'v0/update-' + Date.now())
  .option('--base <branch>', 'Base branch', 'main')
  .option('--title <title>', 'PR title')
  .option('--no-merge', 'Create PR but do not auto-merge')
  .option('--dir <path>', 'Local repo directory', '.')
  .action(async (opts) => {
    const run = (cmd) => execSync(cmd, { cwd: opts.dir, stdio: 'pipe' }).toString().trim();

    try {
      // 1. Create chat attached to the project
      console.log(chalk.bold('\n1. Sending prompt to v0...'));
      const chat = await api.createChat({
        message: opts.message,
        projectId: opts.project,
      });
      console.log(chalk.green('   Chat created: ') + chat.id);
      if (chat.demo) console.log(chalk.dim('   Demo: ') + chat.demo);

      // 2. Get the generated files
      const files = chat.latestVersion?.files || chat.files || [];
      if (files.length === 0) {
        out.error('v0 returned no files.');
        process.exit(1);
      }
      console.log(chalk.dim(`   ${files.length} file(s) generated`));

      // 3. Create a branch
      console.log(chalk.bold('\n2. Creating branch...'));
      run(`git checkout ${opts.base}`);
      run(`git pull origin ${opts.base}`);
      run(`git checkout -b ${opts.branch}`);
      console.log(chalk.green(`   Branch: ${opts.branch}`));

      // 4. Apply files
      console.log(chalk.bold('\n3. Applying files...'));
      for (const f of files) {
        const name = f.name || f.meta?.file;
        const content = f.content || f.source;
        if (!name || !content) continue;
        const filePath = join(opts.dir, name);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, content);
        console.log(chalk.green('   wrote ') + name);
      }

      // 5. Commit & push
      console.log(chalk.bold('\n4. Committing & pushing...'));
      run('git add -A');
      const commitMsg = opts.title || `v0: ${opts.message.slice(0, 72)}`;
      run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      run(`git push -u origin ${opts.branch}`);
      console.log(chalk.green('   Pushed to origin'));

      // 6. Create PR
      console.log(chalk.bold('\n5. Creating pull request...'));
      const prTitle = opts.title || `v0: ${opts.message.slice(0, 72)}`;
      const prBody = [
        '## Summary',
        '',
        `Prompt: "${opts.message}"`,
        '',
        `Generated by [v0.dev](https://v0.app/chat/${chat.id})`,
        chat.demo ? `\nPreview: ${chat.demo}` : '',
        '',
        `Chat ID: \`${chat.id}\``,
        `Project ID: \`${opts.project}\``,
      ].join('\n');

      const prUrl = run(
        `gh pr create --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base ${opts.base}`
      );
      console.log(chalk.green('   PR created: ') + prUrl);

      // 7. Merge (unless --no-merge)
      if (opts.merge !== false) {
        console.log(chalk.bold('\n6. Merging pull request...'));
        run('gh pr merge --squash --delete-branch');
        console.log(chalk.green('   Merged & branch deleted!'));
        run(`git checkout ${opts.base}`);
        run(`git pull origin ${opts.base}`);
      }

      console.log(chalk.bold.green('\nDone!'));
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

// ─── Deployments ───────────────────────────────────────

const deploy = program.command('deploy').description('Deploy a project');

deploy
  .command('create')
  .description('Create a new deployment')
  .requiredOption('--project <projectId>', 'Project ID')
  .requiredOption('--chat <chatId>', 'Chat ID')
  .requiredOption('--version <versionId>', 'Version ID')
  .action(async (opts) => {
    try {
      console.log(chalk.dim('Deploying...'));
      const data = await api.createDeployment({
        projectId: opts.project,
        chatId: opts.chat,
        versionId: opts.version,
      });
      console.log(chalk.green('Deployed!'));
      out.json(data);
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

// ─── Generate (Model API) ──────────────────────────────

program
  .command('generate')
  .description('Generate code/text using the v0 Model API')
  .requiredOption('-m, --message <message>', 'Prompt message')
  .option('--model <model>', 'Model to use', 'v0-1.5-md')
  .option('--system <system>', 'System prompt')
  .option('--max-tokens <n>', 'Max output tokens', parseInt)
  .option('--stream', 'Stream the response')
  .option('--json', 'Output raw JSON')
  .action(async (opts) => {
    try {
      const messages = [];
      if (opts.system) messages.push({ role: 'system', content: opts.system });
      messages.push({ role: 'user', content: opts.message });

      const body = {
        model: opts.model,
        messages,
        stream: !!opts.stream,
      };
      if (opts.maxTokens) body.max_completion_tokens = opts.maxTokens;

      if (opts.stream) {
        const res = await api.chatCompletions(body, { stream: true });
        await out.streamResponse(res);
      } else {
        const data = await api.chatCompletions(body);
        if (opts.json) return out.json(data);
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(content);
        } else {
          out.json(data);
        }
      }
    } catch (e) {
      out.error(e.message);
      process.exit(1);
    }
  });

// ─── Interactive Chat (Model API) ──────────────────────

program
  .command('chat')
  .description('Interactive chat session with v0 Model API')
  .option('--model <model>', 'Model to use', 'v0-1.5-md')
  .option('--system <system>', 'System prompt')
  .action(async (opts) => {
    const readline = await import('node:readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const messages = [];
    if (opts.system) messages.push({ role: 'system', content: opts.system });

    console.log(chalk.bold(`v0 Chat (${opts.model})`));
    console.log(chalk.dim('Type your message. Press Ctrl+C to exit.\n'));

    const ask = () => {
      rl.question(chalk.green('you> '), async (input) => {
        if (!input.trim()) return ask();

        messages.push({ role: 'user', content: input });

        try {
          process.stdout.write(chalk.cyan('v0> '));
          const res = await api.chatCompletions(
            { model: opts.model, messages, stream: true },
            { stream: true }
          );
          const text = await out.streamResponse(res);
          messages.push({ role: 'assistant', content: text });
        } catch (e) {
          out.error(e.message);
        }

        ask();
      });
    };

    rl.on('close', () => {
      console.log(chalk.dim('\nGoodbye!'));
      process.exit(0);
    });

    ask();
  });

program.parse();
