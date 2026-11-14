import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/main.js';
import { cacheDir } from '../src/engine/cache.js';
import { pinnedEnginePath } from '../src/engine/fetch.js';
import { ENGINE_PIN } from '../src/engine/pin.js';
import { platformKey } from '../src/engine/platform.js';
import type { EvidenceRecord } from '../src/types.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engineAvailable = Boolean(process.env.LEXCODE_ENGINE ?? cachedEngine());

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'repos', 'basic');
const RULES = join(FIXTURE, '.rules');

let work: string;
let repo: string;
let out: string[];
let err: string[];
const io = () => ({ stdout: (s: string) => void out.push(s), stderr: (s: string) => void err.push(s) });

// The bundled rules and component map keep growing; these tests run against a minimal rules home.
const RULES_HOME = resolve(dirname(fileURLToPath(import.meta.url)), 'repos', 'rules-home');

beforeEach(() => {
  vi.stubEnv('LEXCODE_RULES_HOME', RULES_HOME);
  work = mkdtempSync(join(tmpdir(), 'lexcode-e2e-'));
  repo = join(work, 'basic');
  cpSync(FIXTURE, repo, { recursive: true });
  out = [];
  err = [];
});
afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(work, { recursive: true, force: true });
});

describe.skipIf(!engineAvailable)('lexcode scan over test/repos/basic with the real engine', () => {
  // A dangling link makes the engine exit 2 with no message if it is ever handed one
  // (Canvas Android has buildSrc/build.gradle.kts as one).
  it.skipIf(process.platform === 'win32')('a dangling symbolic link in the repository does not reach the engine', async () => {
    mkdirSync(join(repo, 'buildSrc'), { recursive: true });
    symlinkSync('../nowhere/build.gradle.kts', join(repo, 'buildSrc', 'build.gradle.kts'));
    symlinkSync('../nowhere/Gone.py', join(repo, 'gone.py'));
    const code = await main(['scan', repo, '--rules', join(repo, '.rules')], io());
    expect(code).toBe(0);
    const rec = JSON.parse(readFileSync(join(repo, 'lexcode.json'), 'utf8')) as EvidenceRecord;
    expect(JSON.stringify(rec)).not.toContain('gone.py');
    expect(rec.notices.join('\n')).not.toMatch(/could not read/);
  });

  it('writes lexcode.json and reports the original .vue path and line', async () => {
    const code = await main(['scan', repo, '--rules', join(repo, '.rules')], io());
    expect(code).toBe(0);
    const file = join(repo, 'lexcode.json');
    expect(existsSync(file)).toBe(true);
    const rec = JSON.parse(readFileSync(file, 'utf8')) as EvidenceRecord;

    const voice = rec.activities.find((a) => a.id === 'processes_voice' && a.mentioned === 'performs');
    expect(voice?.evidence.map((e) => `${e.rule} ${e.where}`)).toEqual([
      'lexcode.voice.whisper-load app.py:4',
      'lexcode.voice.whisper-load src/voice.py:5',
      'lexcode.voice.browser-microphone web/App.vue:7',
    ]);
    expect(rec.scope.extracted).toBe(1);
    expect(rec.scope.dev_dependencies_skipped).toBe(1);
    expect(rec.engine).toEqual({ name: 'opengrep', version: '1.33.1' });
    expect(err.join('')).toMatch(/lexcode scan: \d+ files read; 1 activity with performs evidence, 0 with enables evidence, 0 signals; record written to .*lexcode\.json/);
    // The engine's matched text never reaches the record without --snippets.
    expect(readFileSync(file, 'utf8')).not.toContain('load_model("base")');
  });

  it('prints the record to stdout and writes no file under --json', async () => {
    const code = await main(['scan', repo, '--rules', RULES, '--json'], io());
    expect(code).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    expect(rec.activities.some((a) => a.id === 'processes_voice')).toBe(true);
    expect(existsSync(join(repo, 'lexcode.json'))).toBe(false);
  });

  it('writes SARIF that parses as 2.1.0 and carries the snippet only with --snippets', async () => {
    const sarifPath = join(work, 'out.sarif');
    expect(await main(['scan', repo, '--rules', RULES, '--json', '--sarif', sarifPath], io())).toBe(0);
    const sarif = JSON.parse(readFileSync(sarifPath, 'utf8')) as { version: string; runs: { results: unknown[] }[] };
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0]?.results.length).toBeGreaterThanOrEqual(2);
    expect(readFileSync(sarifPath, 'utf8')).not.toContain('load_model');

    expect(await main(['scan', repo, '--rules', RULES, '--json', '--snippets', '--sarif', sarifPath], io())).toBe(0);
    expect(readFileSync(sarifPath, 'utf8')).toContain('load_model');
  });

  it('does not read the record it wrote last time', async () => {
    expect(await main(['scan', repo, '--rules', RULES], io())).toBe(0);
    out.length = 0;
    expect(await main(['scan', repo, '--rules', RULES, '--json'], io())).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    // package.json, package-lock.json, app.py, src/voice.py, web/App.vue and the two rule files; never lexcode.json.
    expect(rec.scope.files).toBe(7);
  });
});

describe.skipIf(!engineAvailable)('lexcode scan over Ruby files and ERB views with the real engine', () => {
  function put(rel: string, body: string): void {
    const full = join(repo, ...rel.split('/'));
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('reaches a Fastfile, a Rakefile, .rake and .gemspec files, and the script in an html.erb view, reporting the original path and line', async () => {
    rmSync(join(repo, 'app.py'));
    rmSync(join(repo, 'src'), { recursive: true });
    rmSync(join(repo, 'web'), { recursive: true });
    put('fastlane/Fastfile', 'default_platform(:ios)\n\nlane :talk do\n  Whisper.transcribe("a.wav")\nend\n');
    put('Rakefile', 'task :talk do\n  Whisper.transcribe("b.wav")\nend\n');
    put('lib/tasks/talk.rake', 'task :t do\n  Whisper.transcribe("c.wav")\nend\n');
    put('talk.gemspec', 'Gem::Specification.new do |s|\n  Whisper.transcribe("d.wav")\nend\n');
    put('lib/plain.rb', '\nWhisper.transcribe("e.wav")\n');
    put(
      'app/views/layouts/_head.html.erb',
      '<head>\n<script>\n  var ga = "<%= ga_id %>";\n  <% if flag %>\n  navigator.mediaDevices.getUserMedia({audio: true});\n  <% end %>\n</script>\n</head>\n',
    );
    put(
      '.rules/processes_voice/rb-whisper.yml',
      [
        'rules:',
        '  - id: lexcode.voice.rb-whisper',
        '    languages: [ruby]',
        '    severity: INFO',
        '    message: transcribes audio',
        '    pattern: Whisper.transcribe(...)',
        '    metadata:',
        '      activity: processes_voice',
        '      mentioned: performs',
        '      definition: https://lexlint.io/activities/processes_voice',
        '      provenance: ungovr-original',
        '      license: MIT',
        '',
      ].join('\n'),
    );
    const code = await main(['scan', repo, '--rules', join(repo, '.rules'), '--json'], io());
    expect(code).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    const voice = rec.activities.find((a) => a.id === 'processes_voice' && a.mentioned === 'performs');
    expect(voice?.evidence.map((e) => `${e.rule} ${e.where}`).sort()).toEqual([
      'lexcode.voice.browser-microphone app/views/layouts/_head.html.erb:5',
      'lexcode.voice.rb-whisper Rakefile:2',
      'lexcode.voice.rb-whisper fastlane/Fastfile:4',
      'lexcode.voice.rb-whisper lib/plain.rb:2',
      'lexcode.voice.rb-whisper lib/tasks/talk.rake:2',
      'lexcode.voice.rb-whisper talk.gemspec:2',
    ]);
    expect(rec.scope.extracted).toBe(5); // the ERB view, the Fastfile, the Rakefile, the .rake and the .gemspec; lib/plain.rb is read as it is
  });
});

describe.skipIf(!engineAvailable)('lexcode scan over PHP files the engine will not take, with the real engine', () => {
  function put(rel: string, body: string): void {
    const full = join(repo, ...rel.split('/'));
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('reaches .module, .inc, .theme and .install files that start with <?php, reporting the original path and line', async () => {
    rmSync(join(repo, 'app.py'));
    rmSync(join(repo, 'src'), { recursive: true });
    rmSync(join(repo, 'web'), { recursive: true });
    const call = 'Whisper::transcribe("a.wav");';
    put('modules/talk/talk.module', `<?php\n\nfunction talk_cron() {\n  ${call}\n}\n`);
    put('includes/talk.inc', `﻿\n<?php\nfunction talk_inc() {\n  ${call}\n}\n`);
    put('themes/t/t.theme', `<?php\n${call}\n`);
    put('modules/talk/talk.install', `<?php\n\n\n${call}\n`);
    put('src/Plain.php', `<?php\nnamespace App;\n\n${call}\n`);
    put('pascal/defs.inc', `{ not PHP }\n${call}\n`);
    put(
      '.rules/processes_voice/php-whisper.yml',
      [
        'rules:',
        '  - id: lexcode.voice.php-whisper',
        '    languages: [php]',
        '    severity: INFO',
        '    message: transcribes audio',
        '    pattern: Whisper::transcribe(...)',
        '    metadata:',
        '      activity: processes_voice',
        '      mentioned: performs',
        '      definition: https://lexlint.io/activities/processes_voice',
        '      provenance: ungovr-original',
        '      license: MIT',
        '',
      ].join('\n'),
    );
    const code = await main(['scan', repo, '--rules', join(repo, '.rules'), '--json'], io());
    expect(code).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    const voice = rec.activities.find((a) => a.id === 'processes_voice' && a.mentioned === 'performs');
    expect(voice?.evidence.map((e) => `${e.rule} ${e.where}`).sort()).toEqual([
      'lexcode.voice.php-whisper includes/talk.inc:4',
      'lexcode.voice.php-whisper modules/talk/talk.install:4',
      'lexcode.voice.php-whisper modules/talk/talk.module:4',
      'lexcode.voice.php-whisper src/Plain.php:4',
      'lexcode.voice.php-whisper themes/t/t.theme:2',
    ]);
    expect(rec.scope.extracted).toBe(4); // the four copies; src/Plain.php is read as it is, pascal/defs.inc is not PHP
    // The originals reach the engine too, which takes 0 of them without an error.
    expect(rec.notices.join('\n')).not.toMatch(/could not read|not read:/);
  });
});

describe.skipIf(!engineAvailable)('lexcode scan over Razor files, with the real engine', () => {
  function put(rel: string, body: string): void {
    const full = join(repo, ...rel.split('/'));
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('a finding in a Razor code block is reported against the .razor file', async () => {
    rmSync(join(repo, 'app.py'));
    rmSync(join(repo, 'src'), { recursive: true });
    rmSync(join(repo, 'web'), { recursive: true });
    put(
      'Components/Pages/Chat.razor',
      [
        '@using Microsoft.Extensions.AI',
        '@page "/chat"',
        '@inject IChatClient Chat',
        '',
        '<h3>Chat</h3>',
        '<input @bind="prompt" />',
        '<button @onclick="Send">Send</button>',
        '<p>@reply</p>',
        '',
        '@code {',
        '    private string prompt = "";',
        '    private string reply = "";',
        '    private async Task Send() {',
        '        var r = await Chat.GetResponseAsync(prompt);',
        '        reply = r.Text;',
        '    }',
        '}',
        '',
      ].join('\n'),
    );
    // A view whose script holds Razor expressions and a control block: its JavaScript copy must parse.
    put(
      'Views/Shared/_Talk.cshtml',
      [
        '@model TalkModel',
        '<script>',
        "  const to = 'support@example.com';",
        '  var d = @Html.Raw(Json.Serialize(Model.Config));',
        '  @if (Model.On) {',
        "    <text>fbq('init', '@Model.Pixel');</text>",
        '  } else {',
        "    @:gtag('a');",
        '  }',
        '  navigator.mediaDevices.getUserMedia({audio: true});',
        '</script>',
        '',
      ].join('\n'),
    );
    put(
      '.rules/generates_content/cs-chat-client.yml',
      [
        'rules:',
        '  - id: lexcode.gen.cs-chat-client',
        '    languages: [csharp]',
        '    severity: INFO',
        '    message: asks a chat model for a response',
        '    pattern: (Microsoft.Extensions.AI.IChatClient $C).GetResponseAsync(...)',
        '    metadata:',
        '      activity: generates_content',
        '      mentioned: performs',
        '      definition: https://lexlint.io/activities/generates_content',
        '      provenance: ungovr-original',
        '      license: MIT',
        '',
      ].join('\n'),
    );
    const code = await main(['scan', repo, '--rules', join(repo, '.rules'), '--json'], io());
    expect(code).toBe(0);
    const rec = JSON.parse(out.join('')) as EvidenceRecord;
    const gen = rec.activities.find((a) => a.id === 'generates_content' && a.mentioned === 'performs');
    expect(gen?.evidence.map((e) => `${e.rule} ${e.where}`)).toEqual(['lexcode.gen.cs-chat-client Components/Pages/Chat.razor:14']);
    const voice = rec.activities.find((a) => a.id === 'processes_voice' && a.mentioned === 'performs');
    expect(voice?.evidence.map((e) => `${e.rule} ${e.where}`)).toEqual(['lexcode.voice.browser-microphone Views/Shared/_Talk.cshtml:10']);
    expect(rec.scope.extracted).toBe(2); // the component's C# copy and the view's JavaScript copy
    // The engine read both copies without a parse error.
    expect(rec.notices.join('\n')).not.toMatch(/could not read|not read:/);
  });
});

describe.skipIf(!engineAvailable)('lexcode scan over a Gemfile with the real engine', () => {
  it('counts the gem component map toward the rules that ran, only when a Gemfile is in scope', async () => {
    const scan = async (): Promise<EvidenceRecord> => {
      out = [];
      expect(await main(['scan', repo, '--rules', join(repo, '.rules'), '--json'], io())).toBe(0);
      return JSON.parse(out.join('')) as EvidenceRecord;
    };
    const notFound = (rec: EvidenceRecord): unknown => rec.searched_not_found.find((r) => r.id === 'tracks_devices');
    // The shared rules home holds no gem map; this copy adds one entry. It matches no gem a repository declares,
    // so it can only count toward rulesRun through the `gem` branch of ecosystemsFound (src/commands/scan.ts).
    const home = join(work, 'rules-home');
    cpSync(RULES_HOME, home, { recursive: true });
    writeFileSync(
      join(home, 'components', 'gem.yml'),
      [
        'ecosystem: gem',
        'entries:',
        '  - match: "lexcode-fixture-gem"',
        '    enables: [tracks_devices]',
        '    says: "A gem that exists only in lexcode\'s test fixtures"',
        '    source: https://rubygems.org/gems/lexcode-fixture-gem',
        '',
      ].join('\n'),
    );
    vi.stubEnv('LEXCODE_RULES_HOME', home);
    expect(notFound(await scan())).toBeUndefined();
    writeFileSync(join(repo, 'Gemfile'), 'source "https://rubygems.org"\ngem "rails"\n');
    // The copy's one gem entry enables tracks_devices, and no Gemfile gem matches it: searched, not found.
    expect(notFound(await scan())).toEqual({ id: 'tracks_devices', rules: 1 });
  });
});

describe('lexcode scan failures', () => {
  it('exits 2 with a next step when no file is in scope', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'lexcode-empty-'));
    try {
      expect(await main(['scan', empty], io())).toBe(2);
      expect(err.join('')).toContain('no files in scope');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('exits 2 for a path that does not exist', async () => {
    expect(await main(['scan', join(work, 'missing')], io())).toBe(2);
    expect(err.join('')).toMatch(/cannot read the repository/);
  });

  it('exits 2 with the usage for an unknown flag', async () => {
    expect(await main(['scan', repo, '--bogus'], io())).toBe(2);
    expect(err.join('')).toContain('lexcode scan');
  });
});
