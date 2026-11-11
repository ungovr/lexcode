import { describe, expect, it } from 'vitest';
import { readRuby } from '../../src/manifests/ruby.js';
import { tree } from './helpers.js';

function lock(parts: { specs?: string[]; deps?: string[] }): string {
  return [
    'GEM',
    '  remote: https://rubygems.org/',
    '  specs:',
    ...(parts.specs ?? []).map((s) => `    ${s}`),
    '',
    'PLATFORMS',
    '  ruby',
    '',
    'DEPENDENCIES',
    ...(parts.deps ?? []).map((d) => `  ${d}`),
    '',
    'BUNDLED WITH',
    '   2.5.6',
    '',
  ].join('\n');
}

describe('readRuby', () => {
  it('reads gems with versions from Gemfile.lock', () => {
    const root = tree({
      Gemfile: ['source "https://rubygems.org"', '', 'gem "rails", "~> 7.1"', ''].join('\n'),
      'Gemfile.lock': lock({ specs: ['rails (7.1.3)', '  actionpack (= 7.1.3)'], deps: ['rails (~> 7.1)'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'rails', version: '7.1.3', manifest: 'Gemfile:3' }]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('skips development and test groups', () => {
    const root = tree({
      Gemfile: [
        'group :development, :test do',
        '  gem "rspec-rails"',
        'end',
        'gem "pry", group: :development',
        'gem "x", groups: [:development, :test]',
        'group :test, :production do',
        '  gem "y"',
        'end',
        '',
      ].join('\n'),
      'Gemfile.lock': lock({ specs: ['rspec-rails (6.0.0)', 'pry (0.14.2)', 'x (1.0.0)', 'y (2.0.0)'], deps: ['pry', 'rspec-rails', 'x', 'y'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'y', version: '2.0.0', manifest: 'Gemfile:7' }]);
    expect(r.devSkipped).toBe(3);
  });

  it('reads the other spellings of a gem group option and a group block', () => {
    const root = tree({
      Gemfile: [
        'gem "a", :group => :test',
        "gem 'b', group: %i[development test]",
        'gem("c", groups: ["test"])',
        'gem "d", group: [:test, :staging]',
        'group(:development) do',
        '  gem "e"',
        'end',
        'gem "f",',
        '  require: false,',
        '  group: :test',
        'gem "g"',
        '',
      ].join('\n'),
    });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps.map((d) => `${d.name}@${d.manifest}`)).toEqual(['d@Gemfile:4', 'g@Gemfile:11']);
    expect(r.devSkipped).toBe(5);
  });

  it('nested blocks do not end a group early', () => {
    const root = tree({
      Gemfile: [
        'group :test do',
        '  if ENV["X"]',
        '    gem "one"',
        '  end',
        '  platforms :jruby do',
        '    gem "two"',
        '  end',
        '  gem "three"',
        'end',
        'gem "four"',
        '',
      ].join('\n'),
    });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps.map((d) => d.name)).toEqual(['four']);
    expect(r.devSkipped).toBe(3);
  });

  it('does not open a block for a modifier, a one-line form or an endless def', () => {
    const root = tree({
      Gemfile: [
        'group :test do',
        '  gem "one" if RUBY_VERSION > "3"',
        '  def helper = 1',
        '  if true then puts 1 end',
        'end',
        'gem "after"',
        '',
      ].join('\n'),
    });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps.map((d) => d.name)).toEqual(['after']);
    expect(r.devSkipped).toBe(1);
  });

  it('lockfile-only gems are recorded at their lockfile line', () => {
    const lf = lock({ specs: ['nokogiri (1.16.0)'], deps: ['nokogiri (~> 1.16)'] });
    const root = tree({
      Gemfile: 'eval_gemfile File.join(__dir__, "x.rb")\n',
      'x.rb': 'gem "never_read"\n',
      'Gemfile.lock': lf,
    });
    const line = lf.split('\n').findIndex((l) => l.startsWith('  nokogiri (~>')) + 1;
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'x.rb']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'nokogiri', version: '1.16.0', manifest: `Gemfile.lock:${line}` }]);
    expect(r.notices).toEqual([]);
  });

  it('strips the bang and constraint from DEPENDENCIES entries', () => {
    const root = tree({
      Gemfile: 'eval_gemfile File.join(__dir__, "x.rb")\n',
      'Gemfile.lock': lock({ specs: ['local (0.1.0)', 'plain (3.0)'], deps: ['local!', 'plain (>= 3.0)!'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps.map((d) => `${d.name}@${d.version}`)).toEqual(['local@0.1.0', 'plain@3.0']);
  });

  it('reads Gemfile.d when the Gemfile names it', () => {
    const root = tree({
      Gemfile: 'Dir.glob(File.join(__dir__, "Gemfile.d", "*.rb")).each { |f| eval(File.read(f)) }\n',
      'Gemfile.d/app.rb': 'gem "pundit"\n',
      'Gemfile.d/nested/skip.rb': 'gem "not_beside"\n',
      'Gemfile.lock': lock({ specs: ['pundit (2.3.1)'], deps: ['pundit'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.d/app.rb', 'Gemfile.d/nested/skip.rb', 'Gemfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'pundit', version: '2.3.1', manifest: 'Gemfile.d/app.rb:1' }]);
  });

  it('does not read Gemfile.d when the Gemfile never names it', () => {
    const root = tree({ Gemfile: 'gem "a"\n', 'Gemfile.d/app.rb': 'gem "b"\n' });
    const r = readRuby(root, ['Gemfile', 'Gemfile.d/app.rb']);
    expect(r.deps.map((d) => d.name)).toEqual(['a']);
  });

  it('follows a literal eval_gemfile', () => {
    const root = tree({
      Gemfile: 'eval_gemfile "gemfiles/shared.rb"\ngem "own"\n',
      'gemfiles/shared.rb': 'gem "shared"\neval_gemfile "../Gemfile"\n',
      'Gemfile.lock': lock({ specs: ['own (1.0.0)', 'shared (2.0.0)'], deps: ['own', 'shared'] }),
    });
    const r = readRuby(root, ['Gemfile', 'gemfiles/shared.rb', 'Gemfile.lock']);
    expect(r.deps.map((d) => `${d.name}@${d.manifest}`)).toEqual(['own@Gemfile:2', 'shared@gemfiles/shared.rb:1']);
    expect(r.notices).toEqual([]);
  });

  it('flags Gemfile gems absent from the lockfile', () => {
    const root = tree({
      Gemfile: 'gem "known"\ngem "fresh"\n',
      'Gemfile.lock': lock({ specs: ['known (1.0.0)'], deps: ['known'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'gem', name: 'known', version: '1.0.0', manifest: 'Gemfile:1' },
      { ecosystem: 'gem', name: 'fresh', manifest: 'Gemfile:2' },
    ]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toContain('fresh');
    expect(r.notices[0]).toContain('Gemfile');
  });

  it('names at most ten absent gems in the notice, then counts the rest', () => {
    const names = Array.from({ length: 13 }, (_, i) => `g${String(i).padStart(2, '0')}`);
    const root = tree({
      Gemfile: names.map((n) => `gem "${n}"`).join('\n') + '\n',
      'Gemfile.lock': lock({ specs: ['other (1.0.0)'], deps: ['other'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toContain('g09');
    expect(r.notices[0]).not.toContain('g10');
    expect(r.notices[0]).toContain('and 3 more');
  });

  it('one notice when there is no lockfile', () => {
    const root = tree({ Gemfile: 'gem "a"\ngem "b"\ngem "c"\n' });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps).toHaveLength(3);
    expect(r.deps.every((d) => d.version === undefined)).toBe(true);
    expect(r.notices).toEqual(['Gemfile: no Gemfile.lock beside it; 3 gems recorded without a version']);
  });

  it('says nothing about a missing lockfile when every gem is in a dev group', () => {
    const root = tree({ Gemfile: 'group :test do\n  gem "a"\nend\n' });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toEqual([]);
    expect(r.devSkipped).toBe(1);
  });

  it('reads gems.rb and gems.locked', () => {
    const root = tree({
      'gems.rb': 'gem "a"\n',
      'gems.locked': lock({ specs: ['a (4.0.0)'], deps: ['a'] }),
    });
    const r = readRuby(root, ['gems.rb', 'gems.locked']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'a', version: '4.0.0', manifest: 'gems.rb:1' }]);
  });

  it('drops the platform suffix and collapses duplicates', () => {
    const root = tree({
      Gemfile: 'gem "nokogiri"\n',
      'Gemfile.lock': lock({
        specs: ['nokogiri (1.16.0-x86_64-linux)', 'nokogiri (1.16.0-arm64-darwin)', 'nokogiri (1.16.0)'],
        deps: ['nokogiri'],
      }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'nokogiri', version: '1.16.0', manifest: 'Gemfile:1' }]);
  });

  it('collapses a gem named in two files of one Gemfile, keeping the first production line', () => {
    const root = tree({
      Gemfile: 'group :test do\n  gem "dup"\nend\neval_gemfile "more.rb"\n',
      'more.rb': 'gem "dup"\n',
    });
    const r = readRuby(root, ['Gemfile', 'more.rb']);
    expect(r.deps.map((d) => `${d.name}@${d.manifest}`)).toEqual(['dup@more.rb:1']);
    expect(r.devSkipped).toBe(0);
  });

  it('reads gemspec runtime dependencies', () => {
    const root = tree({
      'lib.gemspec': [
        'Gem::Specification.new do |spec|',
        '  spec.name = "lib"',
        '  spec.add_dependency "faraday", "~> 2.0"',
        "  spec.add_runtime_dependency 'zeitwerk'",
        '  spec.add_dependency "shared"',
        '  spec.add_development_dependency "rake"',
        '  spec.add_development_dependency "shared"',
        'end',
        '',
      ].join('\n'),
      Gemfile: 'source "https://rubygems.org"\ngemspec\ngem "shared"\n',
      'Gemfile.lock': lock({
        specs: ['faraday (2.9.0)', 'shared (1.1.0)', 'zeitwerk (2.6.13)'],
        deps: ['lib!', 'shared'],
      }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'lib.gemspec']);
    expect(r.deps).toEqual([
      { ecosystem: 'gem', name: 'shared', version: '1.1.0', manifest: 'Gemfile:3' },
      { ecosystem: 'gem', name: 'faraday', version: '2.9.0', manifest: 'lib.gemspec:3' },
      { ecosystem: 'gem', name: 'zeitwerk', version: '2.6.13', manifest: 'lib.gemspec:4' },
    ]);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([]);
  });

  it('skips a gemspec development gem that Bundler also lists in DEPENDENCIES', () => {
    const root = tree({
      'foo.gemspec': [
        'Gem::Specification.new do |spec|',
        '  spec.name = "foo"',
        '  spec.add_dependency "faraday", "~> 2.0"',
        '  spec.add_development_dependency "rake", "~> 13.0"',
        '  spec.add_development_dependency "rspec", "~> 3.0"',
        'end',
        '',
      ].join('\n'),
      Gemfile: 'source "https://rubygems.org"\ngemspec\n',
      'Gemfile.lock': lock({
        specs: ['faraday (2.9.0)', 'rake (13.1.0)', 'rspec (3.12.0)'],
        deps: ['foo!', 'rake (~> 13.0)', 'rspec (~> 3.0)'],
      }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'foo.gemspec']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'faraday', version: '2.9.0', manifest: 'foo.gemspec:3' }]);
    expect(r.devSkipped).toBe(2);
    expect(r.notices).toEqual([]);
  });

  it('still records a lockfile gem that a gemspec names as a runtime dependency as well as a development one', () => {
    const root = tree({
      'foo.gemspec': 'Gem::Specification.new do |s|\n  s.add_dependency "both"\n  s.add_development_dependency "both"\nend\n',
      Gemfile: 'gemspec\n',
      'Gemfile.lock': lock({ specs: ['both (1.0.0)'], deps: ['foo!', 'both'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'foo.gemspec']);
    expect(r.deps.map((d) => d.name)).toEqual(['both']);
    expect(r.devSkipped).toBe(0);
  });

  it('follows the path a gemspec line points at', () => {
    const root = tree({
      'sub/foo.gemspec': 'Gem::Specification.new do |s|\n  s.add_dependency "faraday"\n  s.add_development_dependency "rake"\nend\n',
      Gemfile: 'gemspec path: "sub"\n',
      'Gemfile.lock': lock({ specs: ['faraday (2.9.0)', 'rake (13.1.0)'], deps: ['foo!', 'rake'] }),
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'sub/foo.gemspec']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'faraday', version: '2.9.0', manifest: 'sub/foo.gemspec:2' }]);
    expect(r.devSkipped).toBe(1);
  });

  it('reads a gemspec with no Gemfile beside it, taking versions from the nearest lockfile', () => {
    const root = tree({
      'gems/inner/inner.gemspec': 'Gem::Specification.new do |s|\n  s.add_dependency "faraday"\n  s.add_dependency "unlocked"\nend\n',
      'Gemfile.lock': lock({ specs: ['faraday (2.9.0)'], deps: [] }),
    });
    const r = readRuby(root, ['gems/inner/inner.gemspec', 'Gemfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'gem', name: 'faraday', version: '2.9.0', manifest: 'gems/inner/inner.gemspec:2' },
      { ecosystem: 'gem', name: 'unlocked', manifest: 'gems/inner/inner.gemspec:3' },
    ]);
    expect(r.notices).toEqual([]);
  });

  it('keeps a Gemfile in a subdirectory apart from the root one', () => {
    const root = tree({
      Gemfile: 'gem "top"\n',
      'Gemfile.lock': lock({ specs: ['top (1.0.0)'], deps: ['top'] }),
      'sub/Gemfile': 'gem "inner"\n',
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock', 'sub/Gemfile']);
    expect(r.deps.map((d) => `${d.name}@${d.version ?? '-'}@${d.manifest}`)).toEqual(['top@1.0.0@Gemfile:1', 'inner@-@sub/Gemfile:1']);
    expect(r.notices).toEqual(['sub/Gemfile: no Gemfile.lock beside it; 1 gem recorded without a version']);
  });

  it('a lockfile that does not parse is a notice, not a throw', () => {
    const root = tree({
      Gemfile: 'gem "a"\n',
      'Gemfile.lock': '<<<<<<< HEAD\nGEM\n  specs:\n    a (1.0.0)\n=======\n>>>>>>> main\n',
    });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'gem', name: 'a', manifest: 'Gemfile:1' }]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^Gemfile\.lock: did not parse/);
  });

  it('a lockfile with no recognizable section is a notice too', () => {
    const root = tree({ Gemfile: 'gem "a"\n', 'Gemfile.lock': 'not a lockfile\n' });
    const r = readRuby(root, ['Gemfile', 'Gemfile.lock']);
    expect(r.deps).toHaveLength(1);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^Gemfile\.lock: did not parse/);
  });

  it('a file in the list that cannot be read is a notice', () => {
    const root = tree({});
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toEqual(['Gemfile: could not be read; skipped']);
  });

  it('ignores comments, block comments and heredocs when finding gems and ends', () => {
    const root = tree({
      Gemfile: [
        '# gem "commented"',
        '=begin',
        'gem "blocked"',
        '=end',
        'group :test do',
        '  note = <<~TXT',
        '    end',
        '  TXT',
        '  gem "inside" # end',
        'end',
        'gem "out"',
        '',
      ].join('\n'),
    });
    const r = readRuby(root, ['Gemfile']);
    expect(r.deps.map((d) => d.name)).toEqual(['out']);
    expect(r.devSkipped).toBe(1);
  });
});
