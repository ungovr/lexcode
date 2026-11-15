import { describe, expect, it } from 'vitest';
import { ecosystemsFound } from '../../src/commands/scan.js';

describe('ecosystemsFound', () => {
  it('finds cargo from any Cargo.toml', () => {
    expect([...ecosystemsFound(['Cargo.toml'])]).toEqual(['cargo']);
    expect([...ecosystemsFound(['crates/app/Cargo.toml', 'crates/app/src/main.rs'])]).toEqual(['cargo']);
    expect([...ecosystemsFound(['Cargo.lock'])]).toEqual([]);
  });

  it('finds swift from Package.swift, Package.resolved or project.pbxproj', () => {
    expect([...ecosystemsFound(['Package.swift'])]).toEqual(['swift']);
    expect([...ecosystemsFound(['App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'])]).toEqual(['swift']);
    expect([...ecosystemsFound(['App.xcodeproj/project.pbxproj'])]).toEqual(['swift']);
    expect([...ecosystemsFound(['Sources/App/App.swift'])]).toEqual([]);
  });

  it('finds cocoapods from a Podfile or Podfile.lock', () => {
    expect([...ecosystemsFound(['Podfile'])]).toEqual(['cocoapods']);
    expect([...ecosystemsFound(['ios/Podfile.lock'])]).toEqual(['cocoapods']);
  });

  it('keeps the ecosystems found before', () => {
    expect([...ecosystemsFound(['package.json', 'go.mod', 'App.csproj', 'pyproject.toml'])].sort()).toEqual(['golang', 'npm', 'nuget', 'pypi']);
  });
});
