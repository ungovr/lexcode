import { describe, expect, it } from 'vitest';
import { purlOf, normalizePypiName } from '../../src/manifests/purl.js';

describe('purlOf', () => {
  it('encodes an npm scope and keeps the version', () => {
    expect(purlOf({ ecosystem: 'npm', name: '@sentry/react-native', version: '7.2.0', manifest: 'package.json:1' })).toBe(
      'pkg:npm/%40sentry/react-native@7.2.0',
    );
  });
  it('omits the version when there is none', () => {
    expect(purlOf({ ecosystem: 'npm', name: '@sentry/react-native', manifest: 'package.json:1' })).toBe(
      'pkg:npm/%40sentry/react-native',
    );
    expect(purlOf({ ecosystem: 'npm', name: 'left-pad', manifest: 'package.json:1' })).toBe('pkg:npm/left-pad');
  });
  it('normalizes a PyPI name per PEP 503', () => {
    expect(
      purlOf({ ecosystem: 'pypi', name: 'Django_REST-framework', version: '3.15.2', manifest: 'requirements.txt:1' }),
    ).toBe('pkg:pypi/django-rest-framework@3.15.2');
    expect(normalizePypiName('A.b__c--D')).toBe('a-b-c-d');
  });
  it('keeps the module path of a Go module and its version', () => {
    expect(
      purlOf({ ecosystem: 'golang', name: 'github.com/gocolly/colly/v2', version: 'v2.1.0', manifest: 'go.mod:5' }),
    ).toBe('pkg:golang/github.com/gocolly/colly/v2@v2.1.0');
  });
  it('lowercases a Go module path, as the purl specification requires', () => {
    expect(
      purlOf({ ecosystem: 'golang', name: 'github.com/Azure/go-autorest', version: 'v0.11.0', manifest: 'go.mod:5' }),
    ).toBe('pkg:golang/github.com/azure/go-autorest@v0.11.0');
  });
  it('keeps a gem name as written, with its version', () => {
    expect(purlOf({ ecosystem: 'gem', name: 'aws-sdk-s3', version: '1.140.0', manifest: 'Gemfile:5' })).toBe('pkg:gem/aws-sdk-s3@1.140.0');
    expect(purlOf({ ecosystem: 'gem', name: 'Rails_Admin', manifest: 'Gemfile:5' })).toBe('pkg:gem/Rails_Admin');
  });
  it('writes a Maven coordinate as group, artifact and version', () => {
    expect(purlOf({ ecosystem: 'maven', name: 'software.amazon.awssdk:rekognition', version: '2.25.0', manifest: 'pom.xml:9' })).toBe(
      'pkg:maven/software.amazon.awssdk/rekognition@2.25.0',
    );
    expect(purlOf({ ecosystem: 'maven', name: 'com.twilio.sdk:twilio', manifest: 'pom.xml:9' })).toBe('pkg:maven/com.twilio.sdk/twilio');
  });
  it('writes a Composer package as vendor, name and version', () => {
    expect(purlOf({ ecosystem: 'composer', name: 'aws/aws-sdk-php', version: '3.300.0', manifest: 'composer.json:9' })).toBe(
      'pkg:composer/aws/aws-sdk-php@3.300.0',
    );
    expect(purlOf({ ecosystem: 'composer', name: 'symfony/http-kernel', version: 'v7.1.0', manifest: 'composer.json:9' })).toBe(
      'pkg:composer/symfony/http-kernel@v7.1.0',
    );
    expect(purlOf({ ecosystem: 'composer', name: 'twilio/sdk', manifest: 'composer.json:9' })).toBe('pkg:composer/twilio/sdk');
  });
  it('writes a NuGet package as its Id as written and version', () => {
    expect(purlOf({ ecosystem: 'nuget', name: 'AWSSDK.Rekognition', version: '3.7.400', manifest: 'App.csproj:9' })).toBe(
      'pkg:nuget/AWSSDK.Rekognition@3.7.400',
    );
    expect(purlOf({ ecosystem: 'nuget', name: 'Twilio', manifest: 'App.csproj:9' })).toBe('pkg:nuget/Twilio');
  });
  it('writes a crate as its name and version', () => {
    expect(purlOf({ ecosystem: 'cargo', name: 'async-openai', version: '0.25.0', manifest: 'Cargo.toml:9' })).toBe('pkg:cargo/async-openai@0.25.0');
    expect(purlOf({ ecosystem: 'cargo', name: 'serde_json', manifest: 'Cargo.toml:9' })).toBe('pkg:cargo/serde_json');
  });
  it('writes a Swift package as its host, owner and repository', () => {
    expect(purlOf({ ecosystem: 'swift', name: 'github.com/Alamofire/Alamofire', version: '5.10.2', manifest: 'Package.swift:9' })).toBe(
      'pkg:swift/github.com/Alamofire/Alamofire@5.10.2',
    );
    expect(purlOf({ ecosystem: 'swift', name: 'mona/LinkedList', manifest: 'Package.swift:9' })).toBe('pkg:swift/mona/LinkedList');
  });
  it('writes a CocoaPods subspec path as the purl subpath', () => {
    expect(purlOf({ ecosystem: 'cocoapods', name: 'Firebase/Analytics', version: '10.29.0', manifest: 'Podfile.lock:9' })).toBe(
      'pkg:cocoapods/Firebase@10.29.0#Analytics',
    );
    expect(purlOf({ ecosystem: 'cocoapods', name: 'GoogleUtilities/Environment', manifest: 'Podfile.lock:9' })).toBe(
      'pkg:cocoapods/GoogleUtilities#Environment',
    );
    expect(purlOf({ ecosystem: 'cocoapods', name: 'Alamofire', version: '5.9.1', manifest: 'Podfile.lock:9' })).toBe('pkg:cocoapods/Alamofire@5.9.1');
  });
  it('percent-encodes a plus sign in a version', () => {
    expect(
      purlOf({ ecosystem: 'golang', name: 'github.com/a/b', version: 'v2.0.0+incompatible', manifest: 'go.mod:5' }),
    ).toBe('pkg:golang/github.com/a/b@v2.0.0%2Bincompatible');
  });
});
