import { describe, expect, it } from 'vitest';
import { isNugetManifest, readNuget } from '../../src/manifests/nuget.js';
import { lineOf, tree } from './helpers.js';

function project(items: string, props = ''): string {
  return [
    '<Project Sdk="Microsoft.NET.Sdk">',
    '  <PropertyGroup>',
    '    <TargetFramework>net8.0</TargetFramework>',
    ...(props ? [props] : []),
    '  </PropertyGroup>',
    '  <ItemGroup>',
    items,
    '  </ItemGroup>',
    '</Project>',
    '',
  ].join('\n');
}

function lock(frameworks: Record<string, Record<string, { type: string; resolved: string }>>): string {
  const dependencies: Record<string, Record<string, unknown>> = {};
  for (const [fw, deps] of Object.entries(frameworks)) {
    dependencies[fw] = {};
    for (const [id, d] of Object.entries(deps)) dependencies[fw][id] = { ...d, requested: `[${d.resolved}, )`, contentHash: 'abc=' };
  }
  return JSON.stringify({ version: 1, dependencies }, null, 2) + '\n';
}

const UNRESOLVED = (n: number): string =>
  `${n} NuGet ${n === 1 ? 'dependency has' : 'dependencies have'} no resolved version (no packages.lock.json, a floating or range version, or an MSBuild property lexcode could not resolve); recorded without a version`;

describe('readNuget', () => {
  it('reads a PackageReference with an attribute version', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="7.4.0" />');
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: `App.csproj:${lineOf(csproj, 'Twilio')}` }]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('reads a child Version element', () => {
    const csproj = project(['    <PackageReference Include="SendGrid">', '      <Version>9.29.3</Version>', '    </PackageReference>'].join('\n'));
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'SendGrid', version: '9.29.3', manifest: `App.csproj:${lineOf(csproj, '"SendGrid"')}` }]);
    expect(r.notices).toEqual([]);
  });

  it('reads a VersionOverride, attribute or child', () => {
    const csproj = project(
      [
        '    <PackageReference Include="Twilio" VersionOverride="7.4.0" />',
        '    <PackageReference Include="SendGrid">',
        '      <VersionOverride>9.29.3</VersionOverride>',
        '    </PackageReference>',
      ].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['Twilio', '7.4.0'],
      ['SendGrid', '9.29.3'],
    ]);
  });

  it('the lock wins', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="7.4.0" />');
    const root = tree({
      'App.csproj': csproj,
      'packages.lock.json': lock({ 'net8.0': { twilio: { type: 'Direct', resolved: '7.4.2' } } }),
    });
    const r = readNuget(root, ['App.csproj', 'packages.lock.json']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.2', manifest: `App.csproj:${lineOf(csproj, 'Twilio')}` }]);
    expect(r.notices).toEqual([]);
  });

  it('the lock gives the first framework in file order that lists the Id as Direct', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="7.0.0" />');
    const root = tree({
      'App.csproj': csproj,
      'packages.lock.json': lock({
        'net6.0': { Twilio: { type: 'Transitive', resolved: '6.0.0' } },
        'net7.0': { TWILIO: { type: 'Direct', resolved: '7.4.1' } },
        'net8.0': { twilio: { type: 'Direct', resolved: '7.4.2' } },
      }),
    });
    expect(readNuget(root, ['App.csproj']).deps[0]?.version).toBe('7.4.1');
  });

  it('a lock that does not list the Id falls through to the reference', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="7.4.0" />');
    const root = tree({ 'App.csproj': csproj, 'packages.lock.json': lock({ 'net8.0': { Other: { type: 'Direct', resolved: '1.0.0' } } }) });
    expect(readNuget(root, ['App.csproj']).deps[0]?.version).toBe('7.4.0');
  });

  it('Central Package Management through a property', () => {
    const web = project('    <PackageReference Include="OpenAI" />');
    const props = [
      '<Project>',
      '  <PropertyGroup>',
      '    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>',
      '    <OpenAIVersion>2.1.0</OpenAIVersion>',
      '  </PropertyGroup>',
      '  <ItemGroup>',
      '    <PackageVersion Include="OpenAI" Version="$(OpenAIVersion)" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\n');
    const root = tree({ 'src/Web/Web.csproj': web, 'Directory.Packages.props': props });
    const r = readNuget(root, ['Directory.Packages.props', 'src/Web/Web.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'OpenAI', version: '2.1.0', manifest: `src/Web/Web.csproj:${lineOf(web, 'OpenAI')}` }]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('the nearest Directory.Packages.props wins, and its property may come from Directory.Build.props', () => {
    const web = project('    <PackageReference Include="openai" />');
    const outer = '<Project><ItemGroup><PackageVersion Include="OpenAI" Version="1.0.0" /></ItemGroup></Project>\n';
    const inner = '<Project><ItemGroup><PackageVersion Include="OpenAI" Version="$(AiVersion)" /></ItemGroup></Project>\n';
    const build = '<Project><PropertyGroup><AiVersion>2.2.0-beta.4</AiVersion></PropertyGroup></Project>\n';
    const root = tree({
      'Directory.Packages.props': outer,
      'src/Directory.Packages.props': inner,
      'src/Directory.Build.props': build,
      'src/Web/Web.csproj': web,
    });
    const r = readNuget(root, ['Directory.Packages.props', 'src/Directory.Packages.props', 'src/Directory.Build.props', 'src/Web/Web.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'openai', version: '2.2.0-beta.4', manifest: `src/Web/Web.csproj:${lineOf(web, 'openai')}` }]);
    expect(r.notices).toEqual([]);
  });

  it('the reference\'s own version wins over the central one, and an empty one does not', () => {
    const props = '<Project><ItemGroup><PackageVersion Include="Twilio" Version="7.0.0" /><PackageVersion Include="Serilog" Version="4.0.0" /></ItemGroup></Project>\n';
    const app = project(['    <PackageReference Include="Twilio" VersionOverride="7.4.0" />', '    <PackageReference Include="Serilog" Version="" />'].join('\n'));
    const root = tree({ 'Directory.Packages.props': props, 'App.csproj': app });
    expect(readNuget(root, ['App.csproj']).deps.map((d) => [d.name, d.version])).toEqual([
      ['Twilio', '7.4.0'],
      ['Serilog', '4.0.0'],
    ]);
  });

  it('a property in the project file resolves its own version', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="$(TwilioVersion)" />', '    <TwilioVersion>7.4.0</TwilioVersion>');
    const root = tree({ 'App.csproj': csproj });
    expect(readNuget(root, ['App.csproj']).deps[0]?.version).toBe('7.4.0');
  });

  it('a property resolves one level only', () => {
    const csproj = project(
      '    <PackageReference Include="Twilio" Version="$(TwilioVersion)" />',
      '    <Base>7.4.0</Base>\n    <TwilioVersion>$(Base)</TwilioVersion>',
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps[0]?.version).toBeUndefined();
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('floating, range and unresolved values are not versions, one notice', () => {
    const csproj = project(
      [
        '    <PackageReference Include="A.Floating" Version="2.*" />',
        '    <PackageReference Include="B.Range" Version="[1.0,2.0)" />',
        '    <PackageReference Include="C.Property" Version="$(Missing)" />',
      ].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps).toEqual([
      { ecosystem: 'nuget', name: 'A.Floating', manifest: `App.csproj:${lineOf(csproj, 'A.Floating')}` },
      { ecosystem: 'nuget', name: 'B.Range', manifest: `App.csproj:${lineOf(csproj, 'B.Range')}` },
      { ecosystem: 'nuget', name: 'C.Property', manifest: `App.csproj:${lineOf(csproj, 'C.Property')}` },
    ]);
    expect(r.notices).toEqual([
      '3 NuGet dependencies have no resolved version (no packages.lock.json, a floating or range version, or an MSBuild property lexcode could not resolve); recorded without a version',
    ]);
  });

  it('plain versions count: three and four parts, and a prerelease', () => {
    const csproj = project(
      [
        '    <PackageReference Include="A" Version="1.2.3" />',
        '    <PackageReference Include="B" Version="1.2.3.4" />',
        '    <PackageReference Include="C" Version="1.2.3-beta.1" />',
      ].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps.map((d) => d.version)).toEqual(['1.2.3', '1.2.3.4', '1.2.3-beta.1']);
    expect(r.notices).toEqual([]);
  });

  it('PrivateAssets all is development', () => {
    const csproj = project(
      [
        '    <PackageReference Include="StyleCop.Analyzers" Version="1.1.118" PrivateAssets="All" />',
        '    <PackageReference Include="Microsoft.SourceLink.GitHub" Version="8.0.0">',
        '      <PrivateAssets>all</PrivateAssets>',
        '    </PackageReference>',
        '    <PackageReference Include="Serilog" Version="4.0.0" PrivateAssets="compile" />',
      ].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps.map((d) => d.name)).toEqual(['Serilog']);
    expect(r.devSkipped).toBe(2);
  });

  it('a test project is development', () => {
    const tests = project(['    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.1" />', '    <PackageReference Include="xunit" Version="2.9.2" />'].join('\n'));
    const root = tree({ 'src/MyApp.Tests/MyApp.Tests.csproj': tests });
    const r = readNuget(root, ['src/MyApp.Tests/MyApp.Tests.csproj']);
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(2);
    expect(r.notices).toEqual([]);
  });

  it('a project with IsTestProject true is development', () => {
    const tests = project(
      ['    <PackageReference Include="xunit" Version="2.9.2" />', '    <PackageReference Include="Moq" Version="4.20.72" />'].join('\n'),
      '    <IsTestProject>true</IsTestProject>',
    );
    const root = tree({ 'src/MyApp.Specs/MyApp.Specs.csproj': tests });
    const r = readNuget(root, ['src/MyApp.Specs/MyApp.Specs.csproj']);
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(2);
  });

  it('IsTestProject false is not a test project', () => {
    const app = project('    <PackageReference Include="Twilio" Version="7.4.0" />', '    <IsTestProject>false</IsTestProject>');
    const root = tree({ 'App.csproj': app });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps.map((d) => d.name)).toEqual(['Twilio']);
    expect(r.devSkipped).toBe(0);
  });

  it('GlobalPackageReference is development', () => {
    const props = [
      '<Project>',
      '  <ItemGroup>',
      '    <GlobalPackageReference Include="Nerdbank.GitVersioning" Version="3.6.143" />',
      '    <PackageVersion Include="Twilio" Version="7.4.0" />',
      '  </ItemGroup>',
      '</Project>',
      '',
    ].join('\n');
    const app = project('    <PackageReference Include="Twilio" />');
    const root = tree({ 'Directory.Packages.props': props, 'src/App/App.csproj': app });
    const r = readNuget(root, ['Directory.Packages.props', 'src/App/App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: `src/App/App.csproj:${lineOf(app, 'Twilio')}` }]);
    expect(r.devSkipped).toBe(1);
  });

  it('Update and Remove are not dependencies', () => {
    const csproj = project(
      [
        '    <PackageReference Include="Twilio" Version="7.4.0" />',
        '    <PackageReference Update="Twilio" Version="7.5.0" />',
        '    <PackageReference Remove="Serilog" />',
      ].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: `App.csproj:${lineOf(csproj, 'Include="Twilio"')}` }]);
    expect(r.devSkipped).toBe(0);
  });

  it('Directory.Build.props references are recorded once, at that file', () => {
    const build = ['<Project>', '  <ItemGroup>', '    <PackageReference Include="Sentry" Version="4.12.1" />', '  </ItemGroup>', '</Project>', ''].join('\n');
    const targets = ['<Project>', '  <ItemGroup>', '    <PackageReference Include="Serilog" Version="4.0.0" />', '  </ItemGroup>', '</Project>', ''].join('\n');
    const root = tree({
      'Directory.Build.props': build,
      'Directory.Build.targets': targets,
      'src/A/A.csproj': project('    <PackageReference Include="Twilio" Version="7.4.0" />'),
      'src/B/B.csproj': project(''),
    });
    const r = readNuget(root, ['Directory.Build.props', 'Directory.Build.targets', 'src/A/A.csproj', 'src/B/B.csproj']);
    expect(r.deps).toEqual([
      { ecosystem: 'nuget', name: 'Sentry', version: '4.12.1', manifest: `Directory.Build.props:${lineOf(build, 'Sentry')}` },
      { ecosystem: 'nuget', name: 'Serilog', version: '4.0.0', manifest: `Directory.Build.targets:${lineOf(targets, 'Serilog')}` },
      { ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: 'src/A/A.csproj:6' },
    ]);
  });

  it('an Id written twice in one file is one row, at the first', () => {
    const csproj = project(
      ['    <PackageReference Include="Twilio" Version="7.4.0" Condition="\'$(TargetFramework)\' == \'net8.0\'" />', '    <PackageReference Include="twilio" Version="7.4.0" />'].join('\n'),
    );
    const root = tree({ 'App.csproj': csproj });
    const r = readNuget(root, ['App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: `App.csproj:${lineOf(csproj, 'Twilio')}` }]);
  });

  it('packages.config', () => {
    const config = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<packages>',
      '  <package id="Newtonsoft.Json" version="13.0.3" targetFramework="net48" />',
      '  <package id="StyleCop.Analyzers" version="1.1.118" targetFramework="net48" developmentDependency="true" />',
      '  <package id="Twilio" version="[7.0,8.0)" targetFramework="net48" />',
      '</packages>',
      '',
    ].join('\n');
    const root = tree({ 'Legacy/packages.config': config });
    const r = readNuget(root, ['Legacy/packages.config']);
    expect(r.deps).toEqual([
      { ecosystem: 'nuget', name: 'Newtonsoft.Json', version: '13.0.3', manifest: `Legacy/packages.config:${lineOf(config, 'Newtonsoft.Json')}` },
      { ecosystem: 'nuget', name: 'Twilio', manifest: `Legacy/packages.config:${lineOf(config, 'Twilio')}` },
    ]);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('reads fsproj and vbproj too', () => {
    const fs = project('    <PackageReference Include="FSharp.Data" Version="6.4.0" />');
    const vb = project('    <PackageReference Include="Twilio" Version="7.4.0" />');
    const root = tree({ 'Lib/Lib.fsproj': fs, 'Old/Old.vbproj': vb });
    const r = readNuget(root, ['Lib/Lib.fsproj', 'Old/Old.vbproj']);
    expect(r.deps.map((d) => [d.name, d.version, d.manifest])).toEqual([
      ['FSharp.Data', '6.4.0', 'Lib/Lib.fsproj:6'],
      ['Twilio', '7.4.0', 'Old/Old.vbproj:6'],
    ]);
  });

  it('a project file that does not parse is a notice, not a throw', () => {
    const root = tree({ 'Bad.csproj': '<Project>\n  <ItemGroup>\n    <PackageReference Include="Twilio" Version="7.4.0">\n  </ItemGroup>\n</Project>\n' });
    const r = readNuget(root, ['Bad.csproj']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^Bad\.csproj: did not parse \(.*line \d+.*\); skipped$/);
    expect(r.notices[0]).not.toContain('Twilio');
  });

  it('a lock that does not parse is a notice, and its rows fall through to the next source', () => {
    const csproj = project('    <PackageReference Include="Twilio" Version="7.4.0" />');
    const root = tree({ 'src/App/App.csproj': csproj, 'src/App/packages.lock.json': '{ "version": 1, "dependencies": { "net8.0": { "secret-token-xyz" ' });
    const r = readNuget(root, ['src/App/App.csproj']);
    expect(r.deps).toEqual([{ ecosystem: 'nuget', name: 'Twilio', version: '7.4.0', manifest: `src/App/App.csproj:${lineOf(csproj, 'Twilio')}` }]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^src\/App\/packages\.lock\.json: did not parse \(invalid JSON.*\); versions from it are unavailable$/);
    expect(r.notices[0]).not.toContain('secret-token-xyz');
  });

  it('a Directory.Packages.props that does not parse is one notice, however many projects read it', () => {
    const root = tree({
      'Directory.Packages.props': '<Project><ItemGroup>\n',
      'src/A/A.csproj': project('    <PackageReference Include="Twilio" />'),
      'src/B/B.csproj': project('    <PackageReference Include="Serilog" />'),
    });
    const r = readNuget(root, ['Directory.Packages.props', 'src/A/A.csproj', 'src/B/B.csproj']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['Twilio', undefined],
      ['Serilog', undefined],
    ]);
    expect(r.notices).toEqual([expect.stringMatching(/^Directory\.Packages\.props: did not parse \(.*\); skipped$/), UNRESOLVED(2)]);
  });

  it('files outside the list are not read as manifests, and other XML is ignored', () => {
    const root = tree({ 'App.csproj': project('    <PackageReference Include="Twilio" Version="7.4.0" />'), 'nuget.config': '<configuration />\n' });
    expect(readNuget(root, ['nuget.config']).deps).toEqual([]);
  });
});

describe('isNugetManifest', () => {
  it('names the files that make a scan report the nuget ecosystem', () => {
    for (const f of ['App.csproj', 'src/Lib/Lib.fsproj', 'Old.vbproj', 'Directory.Build.props', 'src/Directory.Build.targets', 'Directory.Packages.props', 'Legacy/packages.config']) {
      expect(isNugetManifest(f)).toBe(true);
    }
    for (const f of ['packages.lock.json', 'nuget.config', 'App.cs', 'app.csproj.user', 'global.json']) expect(isNugetManifest(f)).toBe(false);
  });
});
