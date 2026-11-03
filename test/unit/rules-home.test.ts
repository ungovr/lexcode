import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bundledRulesDir, loadRuleSet } from '../../src/rules/load.js';
import { tree } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const PACKAGE_RULES = resolve(here, '..', '..', 'rules');
const RULES_HOME = resolve(here, '..', 'repos', 'rules-home');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('LEXCODE_RULES_HOME', () => {
  it("is the package's rules/ directory when unset or empty", () => {
    vi.stubEnv('LEXCODE_RULES_HOME', '');
    expect(bundledRulesDir()).toBe(PACKAGE_RULES);
    vi.unstubAllEnvs();
    delete process.env.LEXCODE_RULES_HOME;
    expect(bundledRulesDir()).toBe(PACKAGE_RULES);
  });

  it('replaces the rules directory when set', () => {
    vi.stubEnv('LEXCODE_RULES_HOME', RULES_HOME);
    expect(bundledRulesDir()).toBe(RULES_HOME);
    const rs = loadRuleSet();
    expect(rs.rules).toEqual([]);
    expect(rs.components).toEqual([]);
    expect(rs.registry.has('crawls_web')).toBe(true);
    expect(rs.classes.get('crawls_web')).toBe('evidence');
  });

  it('resolves a relative path against the working directory', () => {
    vi.stubEnv('LEXCODE_RULES_HOME', 'test/repos/rules-home');
    expect(bundledRulesDir()).toBe(resolve('test/repos/rules-home'));
  });

  it('is an error that names the missing file when the directory is not a rules home', () => {
    vi.stubEnv('LEXCODE_RULES_HOME', tree({ 'readme.txt': 'nothing here' }));
    expect(() => loadRuleSet()).toThrow(/ruleset\.yml/);
  });
});
