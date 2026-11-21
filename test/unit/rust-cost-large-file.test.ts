import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cacheDir } from '../../src/engine/cache.js';
import { pinnedEnginePath } from '../../src/engine/fetch.js';
import { ENGINE_PIN } from '../../src/engine/pin.js';
import { platformKey } from '../../src/engine/platform.js';
import { runEngine } from '../../src/engine/run.js';
import { loadRuleSet, writeMergedConfig } from '../../src/rules/load.js';

function cachedEngine(): string | undefined {
  try {
    const p = pinnedEnginePath(ENGINE_PIN, platformKey(), cacheDir());
    return existsSync(p) ? p : undefined;
  } catch {
    return undefined;
  }
}
const engine = process.env.LEXCODE_ENGINE ?? cachedEngine();

/**
 * Two Rust cost shapes that `scripts/rule-cost.mjs` cannot see, because its Rust filler is one-line functions
 * with no `const`, no method call and no handler (#13301). The scan gives a rule 30 s per file (`--timeout 30`),
 * and a rule that passes it loses the file's matches as a file error, so each case is a file just under 1 MB
 * of the shape, with the one construct the rule must still find at the top.
 *
 * - rs-client-ip-captured with 1,200 `const` SELECT statements, each queried in a function of method chains:
 *   a sanitizer branch that matched every method call and named the const afterwards paired every const with
 *   every call (40 consts: 11 s against 2 s; 1,200: past 30 s).
 * - The five Rust generation rules with 3,000 axum handlers that return a `String` and call no model: the
 *   handler tail sink read every return of every handler as a candidate (1,500 handlers: 28 s against 6 s;
 *   3,000: past 30 s), until it was kept to a handler whose body names one of the rule's model calls.
 */
interface Case {
  rule: string;
  head: string;
  unit: string;
  count: number;
  /** The text of the line the one match is reported on. */
  at: string;
}

const IP_HEAD = `use actix_web::{HttpRequest, HttpResponse};
use sqlx::PgPool;

pub async fn login(req: HttpRequest) -> HttpResponse {
    let ip = req.peer_addr();
    tracing::info!("login from {:?}", ip);
    HttpResponse::Ok().finish()
}
`;
const IP_UNIT = `
const SQL_%N: &str = "SELECT a, b, c FROM table_%N WHERE id = $1";
pub async fn handler_%N(pool: &PgPool, id: i64, items: Vec<Item>) -> Vec<String> {
    let rows = sqlx::query(SQL_%N).bind(id).fetch_all(pool).await.unwrap();
    let out = rows.iter().map(|r| r.get::<String, _>("a")).filter(|s| !s.is_empty()).collect::<Vec<_>>();
    let names = items.iter().map(|i| i.name().to_string()).collect::<Vec<_>>();
    out.into_iter().chain(names.into_iter()).map(|s| s.trim().to_owned()).collect()
}
`;
const HANDLER_UNIT = `
pub async fn item_%N(State(app): State<App>, Path(id): Path<i64>, Json(body): Json<B%N>) -> String {
    let row = app.rows.get(&id).cloned().unwrap_or_default();
    if row.is_empty() {
        return format!("missing {}", id);
    }
    let label = format!("{}:{}", row, body.name);
    label
}
`;

function handlerHead(use: string, state: string, param: string, ret: string, body: string): string {
  return `${use}
use axum::extract::{Json, Path, State};

pub async fn ask(State(client): State<${state}>, ${param}) -> ${ret} {
    ${body}
}
`;
}

const OPENAI = 'use async_openai::{config::OpenAIConfig, Client};';
const CASES: Case[] = [
  { rule: 'lexcode.personal.rs-client-ip-captured', head: IP_HEAD, unit: IP_UNIT, count: 1200, at: '    tracing::info!("login from {:?}", ip);' },
  {
    rule: 'lexcode.text.rs-chat-reply-to-response',
    head: handlerHead(OPENAI, 'Client<OpenAIConfig>', 'request: Req', 'String', 'let response = client.chat().create(request).await.unwrap();\n    response.choices[0].message.content.clone().unwrap_or_default()'),
    unit: HANDLER_UNIT,
    count: 3000,
    at: '    response.choices[0].message.content.clone().unwrap_or_default()',
  },
  {
    rule: 'lexcode.generate.rs-genai-to-response',
    head: handlerHead('use gemini_rust::Gemini;', 'Gemini', 'request: String', 'String', 'let response = client.generate_content().with_user_message(request).execute().await.unwrap();\n    response.text()'),
    unit: HANDLER_UNIT,
    count: 3000,
    at: '    response.text()',
  },
  {
    rule: 'lexcode.image.rs-image-reply-to-response',
    head: handlerHead(OPENAI, 'Client<OpenAIConfig>', 'request: Req', 'Vec<u8>', 'let response = client.images().generate(request).await.unwrap();\n    decode_first(&response)'),
    unit: HANDLER_UNIT,
    count: 3000,
    at: '    decode_first(&response)',
  },
  {
    rule: 'lexcode.audio.rs-speech-reply-to-response',
    head: handlerHead(OPENAI, 'Client<OpenAIConfig>', 'request: Req', 'Vec<u8>', 'let speech = client.audio().speech().create(request).await.unwrap();\n    speech.bytes.to_vec()'),
    unit: HANDLER_UNIT,
    count: 3000,
    at: '    speech.bytes.to_vec()',
  },
  {
    rule: 'lexcode.video.rs-video-reply-to-response',
    head: handlerHead(OPENAI, 'Client<OpenAIConfig>', 'request: String', 'Vec<u8>', 'let clip = client.videos().download_content(&request).await.unwrap();\n    clip.to_vec()'),
    unit: HANDLER_UNIT,
    count: 3000,
    at: '    clip.to_vec()',
  },
];

describe.skipIf(!engine)('Rust rules finish a large file of consts or handlers within the 30 s limit', () => {
  const rs = loadRuleSet();
  for (const c of CASES) {
    it(`${c.rule} keeps its match in a file of ${c.count.toLocaleString('en-US')} ${c.unit === IP_UNIT ? 'consts and queries' : 'handlers'}`, async () => {
      const rule = rs.rules.filter((r) => r.id === c.rule);
      expect(rule).toHaveLength(1);
      const dir = await mkdtemp(join(tmpdir(), 'lexcode-rust-cost-'));
      try {
        let text = c.head;
        for (let i = 0; i < c.count; i++) text += c.unit.split('%N').join(String(i));
        // Just under the size the scan notices (1,000,000 bytes).
        expect(text.length).toBeGreaterThan(400_000);
        expect(text.length).toBeLessThan(1_000_000);
        await writeFile(join(dir, 'large_unit.rs'), text);
        const cfg = join(dir, 'rule.yml');
        writeMergedConfig(rule, cfg);
        const r = await runEngine({ engine: engine!, configFile: cfg, targets: ['large_unit.rs'], root: dir });
        expect(r.fileErrors).toBe(0);
        const line = text.split('\n').indexOf(c.at) + 1;
        expect(line).toBeGreaterThan(0);
        expect(r.matches.map((m) => `${m.ruleId}:${m.line}`)).toEqual([`${c.rule}:${line}`]);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }, 120_000);
  }
});
