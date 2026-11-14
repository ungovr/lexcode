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
 * A whole-file `pattern-regex` pre-filter stops matching in a large file with no error recorded. On opengrep
 * 1.33.1 the lookahead gives up after about a million backtracking steps: with several alternatives in one
 * lookahead the JVM rules lost matches from 120 KB (analytics-calls) and 160 KB (post-model, direct-message),
 * and the converted one-literal greedy form `(?s)\A(?=.*LITERAL).*`, whose steps count from the end of the
 * file, loses an only occurrence near the top from about 1,050 KB. Each file below is filler that names none
 * of the rule's literals plus the only construct that matches: at the end of a 300 KB file, the case the
 * alternations failed, and near the top of a 900 KB file, the worst case just inside the reach. A regression,
 * or an engine that shortens the reach, shows as a lost match. A left boundary written before the literal
 * (`(?<![\w\\])\\?LITERAL`) costs steps at every position and lost the top case from 600 KB, so the PHP
 * namespace guards check it after the literal (`LITERAL(?<!\wLITERAL)`). The PHP filler is functions,
 * since some guards lead with `class`.
 *
 * The scan gives each rule 30 s per file (`--timeout 30`), so a rule whose cost grows faster than the file
 * loses the match here too, as a file error. The JVM social rules joined every field with every class before
 * they checked names, and java-direct-message passed 30 s on the 900 KB file on a CI runner (#13009); each
 * name check now sits in the block that binds its name (CONTRIBUTING.md, Cost). The Kotlin constructs are
 * class-body properties, so they go through the arms that pair properties with classes. This test sees
 * only a cost past 30 s; `scripts/rule-cost.mjs` measures how a rule's cost grows, before a release.
 */
const END_KB = 300;
const TOP_KB = 900;

interface Case {
  rule: string;
  file: string;
  head: string;
  construct: string;
  /** The text of the line the match is reported on. */
  at: string;
  /** A filler line of its own (%N numbers it), for a rule whose literal is common in real files. */
  unit?: string;
}

const CASES: Case[] = [
  {
    rule: 'lexcode.social.java-post-model',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class Post { private int likes; }\n',
    at: 'class Post { private int likes; }',
  },
  {
    rule: 'lexcode.social.java-direct-message',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class DirectMessage { private String recipient; private String sender; }\n',
    at: 'class DirectMessage { private String recipient; private String sender; }',
  },
  {
    rule: 'lexcode.social.java-follow-relation',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class Follow { private User follower; private User followed; }\n',
    at: 'class Follow { private User follower; private User followed; }',
  },
  {
    rule: 'lexcode.social.kt-direct-message',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'class DirectMessage(val id: Long) { val sender: String = ""; val recipient: String = "" }\n',
    at: 'class DirectMessage(val id: Long) { val sender: String = ""; val recipient: String = "" }',
  },
  {
    rule: 'lexcode.social.kt-follow-relation',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'class Follow(val id: Long) { val follower: String = ""; val followed: String = "" }\n',
    at: 'class Follow(val id: Long) { val follower: String = ""; val followed: String = "" }',
  },
  {
    rule: 'lexcode.social.kt-post-model',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'class Post(val id: Long) { val likes: Int = 0 }\n',
    at: 'class Post(val id: Long) { val likes: Int = 0 }',
  },
  {
    rule: 'lexcode.social.kt-home-feed',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'fun feed(posts: List<Post>, following: Set<Long>) = posts.filter { following.contains(it.authorId) }\n',
    at: 'fun feed(posts: List<Post>, following: Set<Long>) = posts.filter { following.contains(it.authorId) }',
  },
  {
    rule: 'lexcode.tracking.java-analytics-calls',
    file: 'Big.java',
    head: 'package demo;\n',
    construct: 'class Z { void m(Object c) { FirebaseAnalytics.getInstance(c); } }\n',
    at: 'class Z { void m(Object c) { FirebaseAnalytics.getInstance(c); } }',
  },
  {
    rule: 'lexcode.tracking.kt-analytics-calls',
    file: 'Big.kt',
    head: 'package demo\n',
    construct: 'fun z(c: Any) { FirebaseAnalytics.getInstance(c) }\n',
    at: 'fun z(c: Any) { FirebaseAnalytics.getInstance(c) }',
  },
  {
    rule: 'lexcode.crawl.rb-mechanize-fetch',
    file: 'big.rb',
    head: 'require "mechanize"\n',
    construct: 'class Reader\n  def read(url)\n    @agent = Mechanize.new\n    @agent.get(url)\n  end\nend\n',
    at: '    @agent.get(url)',
  },
  // PHP: every rule that carries a whole-file lookahead, each through a branch the lookahead guards.
  // The construct is one line (after an import line where the branch reads one), so the line the
  // match is reported on is the construct's own.
  ...(
    [
      ['lexcode.aggregate.php-feed-read', "function z() { $feed = new \\SimplePie(); $feed->set_feed_url('https://news.example.org/rss'); }"],
      ['lexcode.aggregate.php-news-api-call', "function z(\\jcobhams\\NewsApi $n) { return $n->getTopHeadlines('q'); }"],
      ['lexcode.esign.php-esign-envelope', "function z(\\DocuSign\\eSign\\Api\\EnvelopesApi $c) { $c->createEnvelope('a', 'b'); }"],
      ['lexcode.esign.php-pdf-signing', "function z(\\TCPDF $p) { $p->setSignature('cert', 'key'); }"],
      ['lexcode.esign.php-signature-record', 'class LeaseAgreement { private $tenantSignature; }'],
      ['lexcode.crawl.php-browser-fetch', "function z(\\Goutte\\Client $c) { $c->request('GET', 'https://shop.example.com/'); }"],
      ['lexcode.crawl.php-html-of-fetched-page', "function z(\\PHPHtmlParser\\Dom $d) { $d->loadFromUrl('https://news.example.org/'); }"],
      ['lexcode.distribute.php-phar-build', "function z() { $p = new Phar('app.phar'); $p->setStub('stub'); }", 'use Phar;'],
      ['lexcode.audio.php-speech-reply-to-response', "function z($client) { echo $client->audio()->speech(['model' => 'tts-1', 'input' => 'hi', 'voice' => 'alloy']); }"],
      ['lexcode.generate.php-genai-to-response', "function z($client) { echo $client->generativeModel('gemini-2.0-flash')->generateContent('hi')->text(); }"],
      ['lexcode.image.php-image-reply-to-response', "function z($openaiClient) { echo $openaiClient->images()->create(['model' => 'dall-e-3', 'prompt' => 'cat'])->data[0]->url; }"],
      ['lexcode.text.php-chat-reply-to-response', "function z($client) { echo $client->chat()->create(['model' => 'gpt-4o', 'messages' => []])->choices[0]->message->content; }"],
      ['lexcode.video.php-video-reply-to-response', "function z() { echo Http::post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => 'p'])->body(); }"],
      ['lexcode.social.php-direct-message', 'class DirectMessage { private $sender; private $recipient; }'],
      ['lexcode.social.php-follow-relation', 'class Subscription { private $follower; private $followed; }'],
      ['lexcode.social.php-home-feed', "function z($user) { return Post::whereIn('user_id', $user->following()->pluck('id'))->get(); }"],
      ['lexcode.social.php-post-model', 'class Post { private $likes; }'],
      ['lexcode.biometric.php-rekognition-faces', 'function z(\\Aws\\Rekognition\\RekognitionClient $c) { return $c->searchFacesByImage([]); }'],
      ['lexcode.biometric.php-voice-id', 'function z(\\Aws\\VoiceID\\VoiceIDClient $c) { return $c->evaluateSession([]); }'],
      ['lexcode.personal.php-client-ip-captured', "function z() { error_log($_SERVER['REMOTE_ADDR']); }"],
      ['lexcode.personal.php-third-party-person', "function z($stripe, $email) { $stripe->customers->create(['email' => $email]); }"],
      ['lexcode.voice.php-twilio-speech', "function z($response) { $response->gather(['input' => 'speech', 'action' => '/next']); }"],
      ['lexcode.calls.php-bigbluebutton-record', 'function z(\\BigBlueButton\\Parameters\\CreateMeetingParameters $p) { $p->setRecord(true); }'],
      ['lexcode.calls.php-twilio-record-call', "function z($twilio) { $twilio->calls->create('+15005550006', '+15005550001', ['record' => true]); }"],
      ['lexcode.identity.php-selfie-and-id-document', "function z($f, $d) { return ['selfie' => $f, 'id_card' => $d]; }"],
      ['lexcode.crypto.php-attribute-encryption', "class Note extends Model { protected $casts = ['body' => 'encrypted']; }"],
      ['lexcode.crypto.php-password-hashing', "function z(\\Symfony\\Component\\PasswordHasher\\Hasher\\UserPasswordHasherInterface $h, $u) { return $h->hashPassword($u, 'pw'); }"],
      ['lexcode.tracking.php-analytics-calls', "function z() { return Mixpanel::getInstance('token'); }", 'use Mixpanel;'],
    ] as [string, string, string?][]
  ).map(([rule, line, pre]) => ({
    rule,
    file: 'big.php',
    head: '<?php\nnamespace Demo;\n',
    construct: (pre ? pre + '\n' : '') + line + '\n',
    at: line,
  })),
  // The video rule again, in a file dense with addresses: its anchors lead with the endpoint's path, and
  // one that led with `https://` lost the call at the top from about 400 KB.
  {
    rule: 'lexcode.video.php-video-reply-to-response',
    file: 'big.php',
    head: '<?php\nnamespace Demo;\n',
    construct: "function z() { echo Http::post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => 'p'])->body(); }\n",
    at: "function z() { echo Http::post('https://api.openai.com/v1/videos', ['model' => 'sora-2', 'prompt' => 'p'])->body(); }",
    unit: "function f%N() { return ['https://cdn.example.org/a/%N.js', 'https://cdn.example.org/b/main.css']; }\n",
  },
];

function filler(file: string, kb: number, own?: string): string {
  const unit = own ?? (file.endsWith('.kt')
    ? 'class C%N { private val a: Int = 1; private val b: Int = 2; fun m() { val x = 1 } }\n'
    : file.endsWith('.rb')
      ? 'class C%N\n  def m(a, b)\n    x = a + b\n    x * 2\n  end\nend\n'
      : file.endsWith('.php')
        ? 'function f%N($a, $b) { $x = $a + $b; return $x * 2; }\n'
        : 'class C%N { private int a; private int b; void m() { int x = 1; } }\n');
  let s = '';
  let i = 0;
  while (s.length < kb * 1000) s += unit.replace('%N', String(i++));
  return s;
}

/** The 1-based line of the first line that reads exactly `at`. */
function lineOf(text: string, at: string): number {
  return text.split('\n').indexOf(at) + 1;
}

describe('the large-file cases', () => {
  it('cover every PHP rule that carries a whole-file pre-filter', () => {
    const php = loadRuleSet()
      .rules.filter((r) => r.wholeFilePrefilter && r.languages.includes('php'))
      .map((r) => r.id)
      .sort();
    expect(php.length).toBeGreaterThan(0);
    expect([...new Set(CASES.map((c) => c.rule))].filter((id) => php.includes(id)).sort()).toEqual(php);
  });
});

describe.skipIf(!engine)('whole-file pre-filters keep their matches in a large file', () => {
  const rs = loadRuleSet();
  const shapes: { where: 'end' | 'top'; kb: number }[] = [
    { where: 'end', kb: END_KB },
    { where: 'top', kb: TOP_KB },
  ];
  for (const c of CASES) {
    for (const { where, kb } of shapes) {
      it(`${c.rule} matches its only construct at the ${where} of a ${kb} KB file${c.unit ? ' of its own filler' : ''}`, async () => {
        const rule = rs.rules.filter((r) => r.id === c.rule);
        expect(rule).toHaveLength(1);
        const dir = await mkdtemp(join(tmpdir(), 'lexcode-large-'));
        try {
          const fill = filler(c.file, kb, c.unit);
          const text = where === 'end' ? c.head + fill + c.construct : c.head + c.construct + fill;
          expect(text.length).toBeGreaterThan(kb * 1000);
          // Just inside the reach: a file over 1,000,000 bytes is what the scan notices.
          expect(text.length).toBeLessThan(1_000_000);
          await writeFile(join(dir, c.file), text);
          const cfg = join(dir, 'rule.yml');
          writeMergedConfig(rule, cfg);
          const r = await runEngine({ engine: engine!, configFile: cfg, targets: [c.file], root: dir });
          expect(r.fileErrors).toBe(0);
          const line = lineOf(text, c.at);
          expect(line).toBeGreaterThan(0);
          expect(r.matches.map((m) => `${m.ruleId}:${m.line}`)).toEqual([`${c.rule}:${line}`]);
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      }, 120_000);
    }
  }
});
