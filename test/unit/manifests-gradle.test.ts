import { describe, expect, it } from 'vitest';
import { readGradle } from '../../src/manifests/gradle.js';
import { lineOf, tree } from './helpers.js';

function read(files: Record<string, string>) {
  return readGradle(tree(files), Object.keys(files));
}

const names = (r: { deps: { name: string }[] }): string[] => r.deps.map((d) => d.name);

describe('readGradle: Groovy', () => {
  it('reads Groovy string coordinates', () => {
    const text = [
      'ext {',
      "    sentryVersion = '7.3.0'",
      '}',
      'dependencies {',
      "    implementation 'com.squareup.okhttp3:okhttp:4.12.0'",
      '    api "io.sentry:sentry:${sentryVersion}"',
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(r.deps).toEqual([
      { ecosystem: 'maven', name: 'com.squareup.okhttp3:okhttp', version: '4.12.0', manifest: `build.gradle:${lineOf(text, 'okhttp')}` },
      { ecosystem: 'maven', name: 'io.sentry:sentry', version: '7.3.0', manifest: `build.gradle:${lineOf(text, 'io.sentry')}` },
    ]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('reads the map form', () => {
    const text = ['dependencies {', "    implementation group: 'com.stripe', name: 'stripe-java', version: '24.0.0'", '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(r.deps).toEqual([{ ecosystem: 'maven', name: 'com.stripe:stripe-java', version: '24.0.0', manifest: `build.gradle:${lineOf(text, 'stripe-java')}` }]);
  });

  it('reads a map form that continues on the next line', () => {
    const text = ['dependencies {', "    implementation group: 'com.stripe',", "        name: 'stripe-java',", "        version: '24.0.0'", '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(r.deps.map((d) => `${d.name}@${d.version}`)).toEqual(['com.stripe:stripe-java@24.0.0']);
  });

  it('a closure after a declaration does not end the block (Review Focus 4)', () => {
    const text = [
      'dependencies {',
      "    implementation('g:a:1') {",
      "        exclude group: 'x'",
      "        exclude group: 'y', module: 'z'",
      "        because 'g:no:1'",
      '    }',
      "    implementation 'g:b:2'",
      "    implementation('g:c:3') { transitive = false }",
      "    implementation 'g:d:4', {",
      "        exclude group: 'x'",
      "        because 'g:no2:1'",
      '    }',
      "    implementation 'g:e:5'",
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:a', 'g:b', 'g:c', 'g:d', 'g:e']);
    expect(r.deps.map((d) => d.manifest)).toEqual([2, 7, 8, 9, 13].map((n) => `build.gradle:${n}`));
  });

  it('reads a list of strings and several strings on one line', () => {
    const text = ['dependencies {', "    implementation 'g:a:1', 'g:b:2'", "    api(['g:c:3', 'g:d:4'])", '}', ''].join('\n');
    expect(names(read({ 'build.gradle': text }))).toEqual(['g:a', 'g:b', 'g:c', 'g:d']);
  });

  it('reads a declaration that spans lines', () => {
    const text = ['dependencies {', '    implementation(', '        "g:a:1",', '    )', "    implementation 'g:b:2'", '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(r.deps.map((d) => [d.name, d.manifest])).toEqual([
      ['g:a', 'build.gradle:3'],
      ['g:b', 'build.gradle:5'],
    ]);
  });

  it('reads a declaration inside an if or a subprojects block, and nested dependencies blocks', () => {
    const text = [
      'subprojects {',
      '    dependencies {',
      '        if (project.hasProperty("x")) {',
      "            implementation 'g:a:1'",
      '        }',
      '    }',
      '}',
      'project(":web") {',
      '    dependencies {',
      "        runtimeOnly 'g:b:2'",
      '    }',
      '}',
      '',
    ].join('\n');
    expect(names(read({ 'build.gradle': text }))).toEqual(['g:a', 'g:b']);
  });

  it('ignores comments, and braces and quotes inside strings and comments', () => {
    const text = [
      'dependencies {',
      "    // implementation 'g:no:1'",
      "    /* implementation 'g:no2:1' { */",
      '    implementation "g:a:1" // a } brace',
      '    println "}"',
      "    implementation 'g:b:2'",
      '}',
      "implementation 'g:outside:1'",
      '',
    ].join('\n');
    expect(names(read({ 'build.gradle': text }))).toEqual(['g:a', 'g:b']);
  });

  it('does not read a declaration outside a dependencies block', () => {
    const text = ["configurations {", "    implementation 'g:no:1'", '}', "implementation 'g:no2:1'", ''].join('\n');
    expect(read({ 'build.gradle': text }).deps).toEqual([]);
  });
});

describe('readGradle: Kotlin DSL', () => {
  it('reads Kotlin DSL forms', () => {
    const text = [
      'dependencies {',
      '    implementation("g:a:1")',
      '    "implementation"("g:b:2")',
      '    add("api", "g:c:3")',
      '    implementation(group = "g", name = "d", version = "4")',
      '    implementation("g:e:5") { exclude(group = "x") }',
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle.kts': text });
    expect(r.deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:a@1', 'g:b@2', 'g:c@3', 'g:d@4', 'g:e@5']);
    expect(r.deps.map((d) => d.manifest)).toEqual([2, 3, 4, 5, 6].map((n) => `build.gradle.kts:${n}`));
  });

  it('resolves val and extra variables', () => {
    const text = [
      'val okhttpVersion = "4.12.0"',
      'extra["retrofitVersion"] = "2.9.0"',
      'dependencies {',
      '    implementation("com.squareup.okhttp3:okhttp:$okhttpVersion")',
      '    implementation("com.squareup.retrofit2:retrofit:${retrofitVersion}")',
      '}',
      '',
    ].join('\n');
    expect(read({ 'build.gradle.kts': text }).deps.map((d) => d.version)).toEqual(['4.12.0', '2.9.0']);
  });

  it('reads a coordinate in a raw string and a string with a nested template', () => {
    const text = ['dependencies {', '    implementation("""g:a:1""")', '    implementation("g:b:${"2"}")', '}', ''].join('\n');
    const r = read({ 'build.gradle.kts': text });
    expect(r.deps[0]?.name).toBe('g:a');
    expect(names(r)).toContain('g:b');
  });
});

describe('readGradle: configurations', () => {
  it('skips test, debug and processor configurations and counts them', () => {
    const text = [
      'dependencies {',
      '    testImplementation "g:t:1"',
      '    androidTestImplementation "g:at:1"',
      '    debugImplementation "g:d:1"',
      '    kapt "g:k:1"',
      '    ksp "g:s:1"',
      '    testFixturesApi "g:tf:1"',
      '    releaseImplementation "g:r:1"',
      '    fdroidImplementation "g:f:1"',
      '    compileOnly "g:c:1"',
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:r', 'g:f', 'g:c']);
    expect(r.devSkipped).toBe(6);
  });

  it('skips by camel-case segment and by the listed names, and not by a substring', () => {
    const text = [
      'dependencies {',
      '    integrationTestImplementation "g:1:1"',
      '    debugAndroidTestImplementation "g:2:1"',
      '    annotationProcessor "g:3:1"',
      '    lintChecks "g:4:1"',
      '    lintPublish "g:5:1"',
      '    detektPlugins "g:6:1"',
      '    ktlint "g:7:1"',
      '    contestImplementation "g:keep:1"',
      '    latestApi "g:keep2:1"',
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:keep', 'g:keep2']);
    expect(r.devSkipped).toBe(7);
  });
});

describe('readGradle: processor configurations', () => {
  it('treats any kapt, ksp or annotationProcessor configuration as dev, flavors and targets included', () => {
    const text = [
      'dependencies {',
      '    kaptFree "g:1:1"',
      '    kspTest "g:2:1"',
      '    kspJvm "g:3:1"',
      '    annotationProcessorRelease "g:4:1"',
      '    kaptAndroidTest "g:5:1"',
      '    kapt "g:6:1"',
      '    kspecial "g:keep:1"',
      '    apiKaptLike "g:keep2:1"',
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:keep', 'g:keep2']);
    expect(r.devSkipped).toBe(6);
  });
});

describe('readGradle: what is not a dependency', () => {
  it('ignores buildscript, plugins, pluginManagement and constraints', () => {
    const text = [
      'buildscript {',
      '    dependencies {',
      "        classpath 'com.android.tools.build:gradle:8.0.0'",
      '    }',
      '}',
      'plugins {',
      '    id("com.android.application")',
      "    id 'org.jetbrains.kotlin.android' version '1.9.0'",
      '}',
      'pluginManagement {',
      '    dependencies { implementation("g:pm:1") }',
      '}',
      'dependencies {',
      '    constraints {',
      "        implementation 'g:constrained:1'",
      '    }',
      "    implementation 'g:real:1'",
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:real']);
    expect(r.devSkipped).toBe(0);
  });

  it('does not record projects, files, platforms or kotlin()', () => {
    const text = [
      'dependencies {',
      "    implementation project(':core')",
      '    implementation(project(":core:ui"))',
      "    implementation project(path: ':login-api-2')",
      "    implementation fileTree(dir: 'libs', include: ['*.jar'])",
      "    implementation files('libs/a.jar')",
      "    implementation platform('g:bom:1') ",
      '    implementation(platform("g:bom2:1"))',
      '    implementation(enforcedPlatform("g:bom3:1"))',
      '    implementation(kotlin("stdlib"))',
      '    implementation(gradleApi())',
      "    implementation 'g:real:1'",
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:real']);
    expect(r.notices).toEqual([]);
  });

  it('does not record type-safe project accessors, and does not count them', () => {
    const text = ['dependencies {', '    implementation(projects.core.model)', '    api projects.core.data', '    testImplementation(projects.core.testing)', "    implementation 'g:real:1'", '}', ''].join('\n');
    const r = read({ 'build.gradle.kts': text });
    expect(names(r)).toEqual(['g:real']);
    expect(r.notices).toEqual([]);
    expect(r.devSkipped).toBe(0);
  });

  it('does not read a dependency on a module name that is not a coordinate', () => {
    const text = ['dependencies {', "    implementation 'justaname'", '    implementation ":sibling"', '    implementation(name: "flat", ext: "aar")', '}', ''].join('\n');
    expect(read({ 'build.gradle': text }).deps).toEqual([]);
  });
});

describe('readGradle: variables and properties', () => {
  it('reads gradle.properties beside the file and at the build root', () => {
    const files = {
      'settings.gradle': "include ':app'\n",
      'gradle.properties': 'aVersion=2.0\n# comment=9\nbVersion = 3.0\n',
      'app/gradle.properties': 'cVersion: 4.0\n',
      'app/build.gradle': ['dependencies {', '    implementation "g:a:$aVersion"', '    implementation "g:b:${bVersion}"', '    implementation "g:c:$cVersion"', '}', ''].join('\n'),
    };
    const r = read(files);
    expect(r.deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:a@2.0', 'g:b@3.0', 'g:c@4.0']);
  });

  it('takes the root build file ext when the module does not define it', () => {
    const files = {
      'settings.gradle': "include ':app'\n",
      'build.gradle': "ext {\n    okhttp = '4.12.0'\n}\next.retrofit = '2.9.0'\n",
      'app/build.gradle': ['dependencies {', '    implementation "com.squareup.okhttp3:okhttp:$okhttp"', '    implementation "com.squareup.retrofit2:retrofit:${rootProject.ext.retrofit}"', '}', ''].join('\n'),
    };
    const r = read(files);
    expect(r.deps.map((d) => d.version)).toEqual(['4.12.0', '2.9.0']);
  });

  it('prefers the module own definition over the root', () => {
    const files = {
      'settings.gradle': '',
      'build.gradle': "ext.v = '1'\n",
      'app/build.gradle': ["def v = '2'", 'dependencies {', '    implementation "g:a:$v"', '}', ''].join('\n'),
    };
    expect(read(files).deps[0]?.version).toBe('2');
  });

  it('resolves a Groovy map of versions', () => {
    const text = ['ext.versions = [retrofit: "2.9.0", okhttp: \'4.12.0\']', 'dependencies {', '    implementation "g:a:${versions.retrofit}"', '    implementation "g:b:$versions.okhttp"', '}', ''].join('\n');
    expect(read({ 'build.gradle': text }).deps.map((d) => d.version)).toEqual(['2.9.0', '4.12.0']);
  });

  it('bounds a variable that names itself or fans out', () => {
    const lines = ['def a = "$b"', 'def b = "$a"', "def x0 = 'v'"];
    for (let i = 1; i <= 40; i++) lines.push(`def x${i} = "$x${i - 1}$x${i - 1}"`);
    lines.push('dependencies {', '    implementation "g:a:$a"', '    implementation "g:b:$x40"', "    implementation 'g:c:1'", '}', '');
    const r = read({ 'build.gradle': lines.join('\n') });
    expect(names(r)).toEqual(['g:a', 'g:b', 'g:c']);
    expect(r.deps[0]?.version).toBeUndefined();
    expect(r.deps[1]?.version).toBeUndefined();
    expect(r.deps[2]?.version).toBe('1');
  });

  it('does not interpolate a single-quoted Groovy string', () => {
    const text = ["def v = '1'", 'dependencies {', "    implementation 'g:a:$v'", '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(r.deps[0]?.version).toBeUndefined();
  });

  it('skips a module named through a variable it cannot resolve, with one notice', () => {
    const text = ['dependencies {', '    implementation "$group:artifact:1"', '    implementation "g:ok:1"', '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:ok']);
    expect(r.notices).toEqual(['1 Gradle dependency names its group or artifact through a value lexcode cannot read; skipped']);
  });
});

describe('readGradle: notices', () => {
  it('one notice for unversioned dependencies', () => {
    const text = [
      'dependencies {',
      "    implementation 'g:a'",
      '    implementation "g:b:$undefined"',
      "    implementation 'g:c:1'",
      '}',
      '',
    ].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:a', 'g:b', 'g:c']);
    expect(r.notices).toEqual(['2 Gradle dependencies have no version lexcode can read (a platform BOM, a plugin or a computed value); recorded without a version']);
  });

  it('a single unversioned dependency reads in the singular', () => {
    const r = read({ 'build.gradle': "dependencies {\n    implementation 'g:a'\n}\n" });
    expect(r.notices).toEqual(['1 Gradle dependency has no version lexcode can read (a platform BOM, a plugin or a computed value); recorded without a version']);
  });

  it('a constant lexcode does not evaluate is counted in one notice', () => {
    const text = ['dependencies {', '    implementation Libs.FIREBASE_MESSAGING', '    implementation(Libs.LOTTIE)', "    implementation 'g:a:1'", '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(names(r)).toEqual(['g:a']);
    expect(r.notices).toEqual(['2 Gradle dependencies are named by a constant or variable lexcode does not evaluate; not recorded']);
  });

  it('notices never quote the file', () => {
    const text = ['dependencies {', '    implementation "SECRET-TOKEN-xyz:artifact:1"', '    implementation SECRET_CONSTANT_ABC', '}', ''].join('\n');
    const r = read({ 'build.gradle': text });
    expect(JSON.stringify(r.notices)).not.toMatch(/SECRET/);
  });
});

describe('readGradle: version catalogs', () => {
  const toml = [
    '[versions]',
    'fa = "21.5.0"',
    'okhttp = { strictly = "[4.0,5.0)", prefer = "4.12.0" }',
    '',
    '[libraries]',
    'firebase-analytics = { module = "com.google.firebase:firebase-analytics", version.ref = "fa" }',
    'okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }',
    'retrofit = "com.squareup.retrofit2:retrofit:2.9.0"',
    'moshi-kotlin = { module = "com.squareup.moshi:moshi-kotlin", version = "1.15.0" }',
    'gson = { module = "com.google.code.gson:gson", version = { require = "2.10" } }',
    'firebase-bom = { module = "com.google.firebase:firebase-bom" }',
    'junit = { module = "junit:junit", version = "4.13.2" }',
    'unreferenced = { module = "com.example:unreferenced", version = "9" }',
    'androidGradlePlugin = { module = "com.android.tools.build:gradle", version = "8.5.0" }',
    '',
    '[bundles]',
    'net = ["okhttp", "retrofit"]',
    '',
    '[plugins]',
    'android-app = { id = "com.android.application", version = "8.5.0" }',
    '',
  ].join('\n');

  it('resolves catalog accessors (Review Focus 3)', () => {
    const app = [
      'dependencies {',
      '    implementation(libs.firebase.analytics)',
      '    implementation(libs.bundles.net)',
      '    implementation(libs.moshi.kotlin)',
      '    implementation(libs.gson)',
      '    implementation libs.androidGradlePlugin',
      '    implementation(platform(libs.firebase.bom))',
      '    testImplementation(libs.junit)',
      '}',
      '',
    ].join('\n');
    const r = read({ 'settings.gradle.kts': '', 'gradle/libs.versions.toml': toml, 'app/build.gradle.kts': app });
    const row = (n: string, v: string | undefined, line: number) => ({ ecosystem: 'maven', name: n, ...(v !== undefined ? { version: v } : {}), manifest: `app/build.gradle.kts:${line}` });
    expect(r.deps).toEqual([
      row('com.google.firebase:firebase-analytics', '21.5.0', 2),
      row('com.squareup.okhttp3:okhttp', '[4.0,5.0)', 3),
      row('com.squareup.retrofit2:retrofit', '2.9.0', 3),
      row('com.squareup.moshi:moshi-kotlin', '1.15.0', 4),
      row('com.google.code.gson:gson', '2.10', 5),
      row('com.android.tools.build:gradle', '8.5.0', 6),
    ]);
    expect(r.devSkipped).toBe(1);
    expect(r.deps.some((d) => d.name === 'com.example:unreferenced')).toBe(false);
    expect(r.notices).toEqual([]);
  });

  it('records a versionless catalog library without a version and counts it', () => {
    const app = ['dependencies {', '    implementation(libs.firebase.bom)', '}', ''].join('\n');
    const r = read({ 'gradle/libs.versions.toml': toml, 'build.gradle.kts': app });
    expect(r.deps).toEqual([{ ecosystem: 'maven', name: 'com.google.firebase:firebase-bom', manifest: 'build.gradle.kts:2' }]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^1 Gradle dependency has no version/);
  });

  it('names the catalog after its file', () => {
    const files = {
      'settings.gradle': '',
      'gradle/deps.versions.toml': '[libraries]\nx = "g:x:1"\n',
      'build.gradle': ['dependencies {', '    implementation deps.x', '    implementation libs.x', '}', ''].join('\n'),
    };
    const r = read(files);
    expect(names(r)).toEqual(['g:x']);
    expect(r.notices).toEqual(['1 Gradle catalog reference names no library in a version catalog lexcode can read; skipped']);
  });

  it('uses the catalog at the build root for a nested module, and a nested build keeps its own', () => {
    const files = {
      'settings.gradle': '',
      'gradle/libs.versions.toml': '[libraries]\nroot-lib = "g:root:1"\n',
      'a/b/build.gradle': "dependencies {\n    implementation libs.root.lib\n}\n",
      'nested/settings.gradle': '',
      'nested/gradle/libs.versions.toml': '[libraries]\nroot-lib = "g:nested:2"\n',
      'nested/m/build.gradle': "dependencies {\n    implementation libs.root.lib\n}\n",
    };
    const r = read(files);
    expect(r.deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:root@1', 'g:nested@2']);
  });

  it('a catalog that does not parse is a notice, not a throw', () => {
    const files = {
      'gradle/libs.versions.toml': '[libraries\nSECRET-VALUE = oops\n',
      'build.gradle.kts': ['dependencies {', '    implementation(libs.x)', "    implementation(\"g:ok:1\")", '}', ''].join('\n'),
    };
    const r = read(files);
    expect(names(r)).toEqual(['g:ok']);
    expect(r.notices.some((n) => n.startsWith('gradle/libs.versions.toml: ') && /did not parse/.test(n))).toBe(true);
    expect(JSON.stringify(r.notices)).not.toMatch(/SECRET/);
  });

  it('a catalog entry referenced twice in one file is recorded once', () => {
    const files = {
      'gradle/libs.versions.toml': '[libraries]\nx = "g:x:1"\n',
      'build.gradle.kts': ['dependencies {', '    implementation(libs.x)', '    api(libs.x)', '}', ''].join('\n'),
    };
    expect(read(files).deps).toHaveLength(1);
  });
});

describe('readGradle: convention plugins', () => {
  const catalog = [
    '[versions]',
    'crash = "18.6.0"',
    '[libraries]',
    'firebase-crashlytics = { module = "com.google.firebase:firebase-crashlytics", version.ref = "crash" }',
    'firebase-bom = { module = "com.google.firebase:firebase-bom", version = "32.7.0" }',
    'firebase-analytics = { module = "com.google.firebase:firebase-analytics" }',
    'junit = "junit:junit:4.13.2"',
    'android-gradlePlugin = { module = "com.android.tools.build:gradle", version = "8.5.0" }',
    'room-compiler = "androidx.room:room-compiler:2.6.1"',
    '',
  ].join('\n');

  it('reads findLibrary in a convention plugin (Review Focus 3)', () => {
    const plugin = [
      'package conventions',
      '',
      'class FirebasePlugin : Plugin<Project> {',
      '    override fun apply(target: Project) {',
      '        with(target) {',
      '            dependencies {',
      '                val bom = libs.findLibrary("firebase-bom").get()',
      '                "implementation"(platform(bom))',
      '                add("implementation", libs.findLibrary("firebase.crashlytics").get())',
      '                "implementation"(libs.findLibrary("firebase.analytics").get()) {',
      '                    exclude(group = "x", module = "y")',
      '                }',
      '                "testImplementation"(libs.findLibrary("junit").get())',
      '                "ksp"(libs.findLibrary("room.compiler").get())',
      '                add(',
      '                    "androidTestImplementation",',
      '                    libs.findLibrary("junit").get(),',
      '                )',
      '            }',
      '        }',
      '    }',
      '}',
      '',
    ].join('\n');
    const files = {
      'settings.gradle.kts': 'includeBuild("build-logic")\n',
      'gradle/libs.versions.toml': catalog,
      'build-logic/settings.gradle.kts': '',
      'build-logic/convention/build.gradle.kts': 'dependencies {\n    compileOnly(libs.android.gradlePlugin)\n    implementation("g:tooling:1")\n}\n',
      'build-logic/convention/src/main/kotlin/FirebasePlugin.kt': plugin,
    };
    const r = read(files);
    const src = 'build-logic/convention/src/main/kotlin/FirebasePlugin.kt';
    expect(r.deps.map((d) => [d.name, d.version, d.manifest])).toEqual([
      ['com.google.firebase:firebase-crashlytics', '18.6.0', `${src}:${lineOf(plugin, 'firebase.crashlytics')}`],
      ['com.google.firebase:firebase-analytics', undefined, `${src}:${lineOf(plugin, 'firebase.analytics')}`],
    ]);
    // compileOnly + implementation in the build file (tooling), testImplementation, ksp, androidTestImplementation in the plugin.
    expect(r.devSkipped).toBe(5);
  });

  it('records a findLibrary with no configuration on its line as implementation', () => {
    const plugin = ['class P {', '    fun f() {', '        val x = libs.findLibrary("firebase.crashlytics").get()', '        deps(x)', '    }', '}', ''].join('\n');
    const files = {
      'gradle/libs.versions.toml': catalog,
      'buildSrc/src/main/kotlin/P.kt': plugin,
    };
    expect(names(read(files))).toEqual(['com.google.firebase:firebase-crashlytics']);
  });

  it('a library found only to feed platform() is not a dependency', () => {
    const plugin = ['class P {', '    fun f() {', '        val bom = libs.findLibrary("firebase-bom").get()', '        "implementation"(platform(bom))', '    }', '}', ''].join('\n');
    const files = { 'gradle/libs.versions.toml': catalog, 'build-logic/convention/src/main/kotlin/P.kt': plugin };
    expect(read(files).deps).toEqual([]);
  });

  it('reads findBundle', () => {
    const toml = '[libraries]\na = "g:a:1"\nb = "g:b:2"\n[bundles]\nab = ["a", "b"]\n';
    const plugin = 'class P { fun f() { add("api", libs.findBundle("ab").get()) } }\n';
    const files = { 'gradle/libs.versions.toml': toml, 'buildSrc/src/main/kotlin/P.kt': plugin };
    expect(names(read(files))).toEqual(['g:a', 'g:b']);
  });

  it('skips the tooling build files of buildSrc and of an includeBuild directory, counting them', () => {
    const files = {
      'settings.gradle': "includeBuild('tools/plugins')\n",
      'gradle/libs.versions.toml': catalog,
      'buildSrc/build.gradle.kts': 'dependencies {\n    implementation("g:one:1")\n    implementation(libs.junit)\n}\n',
      'tools/plugins/build.gradle': "dependencies {\n    implementation 'g:two:2'\n}\n",
      'app/build.gradle': "dependencies {\n    implementation 'g:app:3'\n}\n",
    };
    const r = read(files);
    expect(names(r)).toEqual(['g:app']);
    expect(r.devSkipped).toBe(3);
  });

  it('an includeBuild that leaves the repository is ignored', () => {
    const files = { 'settings.gradle': "includeBuild('../outside')\n", 'build.gradle': "dependencies {\n    implementation 'g:a:1'\n}\n" };
    expect(names(read(files))).toEqual(['g:a']);
  });

  it('reads a findLibrary only in kt and kts sources under the convention directories', () => {
    const files = {
      'gradle/libs.versions.toml': catalog,
      'app/src/main/kotlin/Other.kt': 'class Other { fun f() { add("api", libs.findLibrary("junit").get()) } }\n',
    };
    expect(read(files).deps).toEqual([]);
  });
});

describe('readGradle: constants in buildSrc objects', () => {
  const consts = [
    '@file:Suppress("unused")',
    '',
    'object Versions {',
    '    const val COMPILE_SDK = 36',
    '    const val okhttp = "4.12.0"',
    '    const val junit: String = "4.13.2"',
    '}',
    '',
    'object Libs {',
    '    const val okhttp = "com.squareup.okhttp3:okhttp:${Versions.okhttp}"',
    '    const val JUNIT = "junit:junit:$junitVersion"',
    '    const val sibling = "g:sibling:${localVersion}"',
    '    const val localVersion = "9"',
    '    const val BOM = "com.google.firebase:firebase-bom:34.6.0"',
    '    const val NOVERSION = "com.google.firebase:firebase-config"',
    '    const val UNKNOWN = "g:unknown:${Versions.missing}"',
    '    object Google {',
    '        const val MAPS = "com.google.android.gms:play-services-maps:1.0"',
    '        val cycleA = "g:a:${cycleB}"',
    '        val cycleB = "${cycleA}"',
    '    }',
    '}',
    '',
  ].join('\n');

  it('reads object constants from buildSrc', () => {
    const app = ['dependencies {', '    implementation(Libs.okhttp)', '    implementation Libs.Google.MAPS', '    implementation(Libs.NOVERSION)', '    api(Libs.sibling)', '}', ''].join('\n');
    const r = read({ 'settings.gradle.kts': '', 'buildSrc/src/main/java/Deps.kt': consts, 'app/build.gradle.kts': app });
    expect(r.deps).toEqual([
      { ecosystem: 'maven', name: 'com.squareup.okhttp3:okhttp', version: '4.12.0', manifest: 'app/build.gradle.kts:2' },
      { ecosystem: 'maven', name: 'com.google.android.gms:play-services-maps', version: '1.0', manifest: 'app/build.gradle.kts:3' },
      { ecosystem: 'maven', name: 'com.google.firebase:firebase-config', manifest: 'app/build.gradle.kts:4' },
      { ecosystem: 'maven', name: 'g:sibling', version: '9', manifest: 'app/build.gradle.kts:5' },
    ]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^1 Gradle dependency has no version/);
  });

  it('a constant used only in a test configuration is skipped', () => {
    const app = ['dependencies {', '    testImplementation(Libs.okhttp)', '    androidTestImplementation Libs.BOM', '}', ''].join('\n');
    const r = read({ 'buildSrc/src/main/java/Deps.kt': consts, 'build.gradle': app });
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(2);
    expect(r.notices).toEqual([]);
  });

  it('records a constant whose version cannot be resolved without a version, and bounds a cycle', () => {
    const app = ['dependencies {', '    implementation(Libs.UNKNOWN)', '    implementation(Libs.Google.cycleA)', '}', ''].join('\n');
    const r = read({ 'buildSrc/src/main/java/Deps.kt': consts, 'build.gradle': app });
    // cycleA is "g:a:${cycleB}" and cycleB names cycleA back: the version is unresolved, the dependency is still g:a.
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['g:unknown', undefined],
      ['g:a', undefined],
    ]);
  });

  it('counts a reference to a constant that does not exist, and a reference outside any buildSrc', () => {
    const app = ['dependencies {', '    implementation(Libs.NOPE)', '    implementation(Other.okhttp)', '}', ''].join('\n');
    const r = read({ 'buildSrc/src/main/java/Deps.kt': consts, 'build.gradle': app });
    expect(r.deps).toEqual([]);
    expect(r.notices).toEqual(['2 Gradle dependencies are named by a constant or variable lexcode does not evaluate; not recorded']);
  });

  it('uses the constants of the buildSrc that belongs to the build, nearest first', () => {
    const files = {
      'a/settings.gradle': '',
      'a/buildSrc/src/Deps.kt': 'object Libs { const val X = "g:from-a:1" }\n',
      'b/settings.gradle': '',
      'b/buildSrc/src/Deps.kt': 'object Libs { const val X = "g:from-b:2" }\n',
      'a/app/build.gradle': 'dependencies {\n    implementation Libs.X\n}\n',
      'b/app/build.gradle': 'dependencies {\n    implementation Libs.X\n}\n',
    };
    expect(read(files).deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:from-a@1', 'g:from-b@2']);
  });

  it('a module moved out of the build with projectDir sees the buildSrc of its build', () => {
    const files = {
      'apps/settings.gradle': "include ':lib'\ninclude ':other'\nproject(':lib').projectDir = new File(rootProject.projectDir, '/../libs/lib')\nproject(':other').projectDir = file(\"../tools/other\")\n",
      'apps/buildSrc/src/Deps.kt': 'object Libs { const val X = "g:moved:4" }\n',
      'libs/lib/build.gradle': 'dependencies {\n    implementation Libs.X\n}\n',
      'tools/other/build.gradle.kts': 'dependencies {\n    implementation(Libs.X)\n}\n',
      'elsewhere/build.gradle': 'dependencies {\n    implementation Libs.X\n}\n',
    };
    const r = read(files);
    expect(r.deps.map((d) => [d.name, d.manifest])).toEqual([
      ['g:moved', 'libs/lib/build.gradle:2'],
      ['g:moved', 'tools/other/build.gradle.kts:2'],
    ]);
    expect(r.notices).toEqual(['1 Gradle dependency is named by a constant or variable lexcode does not evaluate; not recorded']);
  });

  it('reads constants from an includeBuild directory', () => {
    const files = {
      'settings.gradle': "includeBuild('tools/plugins')\n",
      'tools/plugins/src/main/kotlin/Deps.kt': 'object Libs { const val X = "g:inc:3" }\n',
      'app/build.gradle': 'dependencies {\n    implementation Libs.X\n}\n',
    };
    expect(read(files).deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:inc@3']);
  });

  it('bounds a chain of constants that each name the previous twice', () => {
    const lines = ['object Libs {', '    const val C0 = "v"'];
    for (let i = 1; i <= 40; i++) lines.push(`    const val C${i} = "\${C${i - 1}}\${C${i - 1}}"`);
    lines.push('    const val DEP = "g:a:${C40}"', '}', '');
    const files = { 'buildSrc/src/Deps.kt': lines.join('\n'), 'build.gradle': 'dependencies {\n    implementation Libs.DEP\n}\n' };
    const t0 = Date.now();
    const r = read(files);
    expect(Date.now() - t0).toBeLessThan(2000);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([['g:a', undefined]]);
  });

  it('does not read constants from outside the tooling directories', () => {
    const files = { 'app/src/main/kotlin/Deps.kt': 'object Libs { const val X = "g:x:1" }\n', 'build.gradle': 'dependencies {\n    implementation Libs.X\n}\n' };
    expect(read(files).deps).toEqual([]);
  });
});

describe('readGradle: robustness', () => {
  it('ignores a file that is not a Gradle build file and reads each build file in the list', () => {
    const files = {
      'a/build.gradle': "dependencies {\n    implementation 'g:a:1'\n}\n",
      'b/build.gradle.kts': 'dependencies {\n    implementation("g:b:2")\n}\n',
      'c/other.gradle': "dependencies {\n    implementation 'g:c:3'\n}\n",
    };
    const r = read(files);
    expect(r.deps.map((d) => [d.name, d.manifest])).toEqual([
      ['g:a', 'a/build.gradle:2'],
      ['g:b', 'b/build.gradle.kts:2'],
    ]);
  });

  it('survives unbalanced braces, unterminated strings and an empty file', () => {
    const files = {
      'a/build.gradle': "dependencies {\n    implementation 'g:a:1\n    implementation 'g:b:2'\n",
      'b/build.gradle': '}}}} ((( \n',
      'c/build.gradle': '',
      'd/build.gradle': 'dependencies { implementation "g:d:1" ',
    };
    expect(() => read(files)).not.toThrow();
  });

  it('dedupes the same dependency declared in two configurations of one file', () => {
    const text = ['dependencies {', "    implementation 'g:a:1'", "    api 'g:a:1'", "    runtimeOnly 'g:a:2'", '}', ''].join('\n');
    expect(read({ 'build.gradle': text }).deps.map((d) => `${d.name}@${d.version}`)).toEqual(['g:a@1', 'g:a@2']);
  });

  it('a listed file that is missing is skipped', () => {
    const r = readGradle(tree({}), ['build.gradle']);
    expect(r.deps).toEqual([]);
  });

  it('handles a large file without quadratic work', () => {
    const lines = ['dependencies {'];
    for (let i = 0; i < 20000; i++) lines.push(`    implementation "g:a${i}:1"`);
    lines.push('}', '');
    const t0 = Date.now();
    const r = read({ 'build.gradle': lines.join('\n') });
    expect(r.deps).toHaveLength(20000);
    expect(Date.now() - t0).toBeLessThan(5000);
  });
});
