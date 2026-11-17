# What lexcode reads

The short version is in the [README](../README.md#what-it-reads). This page
lists every file, directory and extension a scan reads or leaves out. How each
language and manifest is read, rule by rule, is in
[rules/README.md](../rules/README.md).

## Which files

| Where the scan runs | What it reads |
|---|---|
| Inside a git work tree | Files tracked by git or trackable by it, honoring `.gitignore` |
| Outside a git work tree | Every file under the directory, less the root `.gitignore`'s simple patterns (a name, `dir/`, a glob such as `*.ext`, and a leading `/`) and the directories in the next table. Negations (`!pattern`) are not supported, and neither is a `.gitignore` below the root; the scan says so in a notice |

`app.scope` in `lexlint.yml` narrows the read, as the lint reads it.

### Left out outside a git work tree

| Kind | Directories |
|---|---|
| Python environments and caches | `.venv`, `venv` and `env` where a `pyvenv.cfg` says they are one; `site-packages`, `__pycache__`, `.tox`, `.nox`, `.mypy_cache`, `.pytest_cache` |
| Web framework output | `.next`, `.nuxt`, `.svelte-kit` |
| Build output | `target`, `.gradle`, `.terraform`, `.build`, `DerivedData` |
| .NET build output | `obj` where it holds a `project.assets.json`; `bin` where it holds a `Debug` or `Release` directory |

### Never read

| Kind | What |
|---|---|
| Dependencies and build output | `node_modules`, `vendor`, `dist`, `build`, `.git`, `Pods`, `Carthage`, and a legacy NuGet restore folder (a `packages` directory whose subdirectories hold a `.nupkg`; a `packages/` of your own code is read) |
| Minified or bundled files | Including any named `*.min.js`, `*.bundle.js`, `vendor.*.js` or `*.vendor.js` |
| C# the compiler generated | `*.g.cs` and `*.g.i.cs` (a `*.Designer.cs` is read) |
| Generated Swift | `*.generated.swift`, `*+Generated.swift`, `*.pb.swift`, `*.grpc.swift`, and anything under a directory named `GeneratedSources`, where swift-openapi-generator writes its output (the name is case-sensitive) |
| Other generated code | A file with a line over 100,000 characters (counted in a notice) |
| Links and large files | Symbolic links, and files over 5 MB |
| Files you cannot open | Counted in a notice |

### Tests, unless you pass `--include-tests`

| Kind | Left out |
|---|---|
| Test directories | `test`, `tests`, `__tests__`, `spec`, `fixtures`, `testdata`, `benches`, `androidTest`, `testFixtures`, `integrationTest` |
| Kotlin Multiplatform test source sets | `commonTest`, `jvmTest`, `androidUnitTest`, `androidInstrumentedTest`, `iosTest`, `jsTest`, `nativeTest` |
| .NET test projects | A directory whose name ends in `.Tests`, `.Test`, `.UnitTests`, `.IntegrationTests`, `.FunctionalTests`, `.AcceptanceTests` or `.Specs`, so `src/MyApp.Tests` |
| Xcode test targets | A directory whose name ends in `Tests` with a capital T, so `WikipediaTests`, `WikipediaUITests`, `UITests`, `APITests` and `iOSTests` but not `Contests` |
| Rust test modules | Code inside a `#[cfg(test)]` module |

The directory names match in any case (so Symfony's `Tests` and Magento's
`Test` are left out too), except the Xcode test targets, which are
case-sensitive.

## Languages

| Language | Files |
|---|---|
| TypeScript | `.ts`, `.tsx`, `.mts`, `.cts` |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` |
| Python | `.py`, `.pyi` |
| Go | `.go` |
| Ruby | `.rb`, `.rake`, `.ru` and `.gemspec` files, and a `Rakefile`, `Fastfile`, `Appfile` or `Capfile` |
| Java | `.java` |
| Kotlin | `.kt`, `.kts` |
| PHP | `.php`, `.phtml`, and `.inc`, `.module`, `.theme` and `.install` files that open with `<?php` |
| C# | `.cs` (`.csx` and `.cake` scripts are not read) |
| Swift | `.swift` |
| Rust | `.rs` |

Code in any other language (Objective-C, F#, Visual Basic and the like) is not
read. The scan names each such language with its file count in a notice, so a
missing activity there reads as "not checked", never as "not there".

### Views and templates

| View | Files | What is read |
|---|---|---|
| Vue, Svelte, HTML, Jinja | `.vue`, `.svelte`, `.html`, `.htm`, `.jinja`, `.jinja2`, `.j2`, `.njk` | The `<script>` blocks, as JavaScript |
| ERB | `.erb`, so `.html.erb` | Only the `<script>` blocks, as JavaScript |
| JSP | `.jsp`, `.jspf`, `.tag` | Only the `<script>` blocks, as JavaScript |
| Twig | `.twig`, so `.html.twig` | Only the `<script>` blocks, as JavaScript |
| Tera | `.tera`, so `.html.tera` | Only the `<script>` blocks, as JavaScript |
| Razor | `.cshtml`, `.razor` | The `<script>` blocks as JavaScript, and the `@code` and `@functions` blocks as C# |
| PHP and Blade | `.php`, `.phtml`, `.blade.php` | The whole file as PHP, and its `<script>` blocks as JavaScript as well |

In an ERB, JSP, Twig, Tera or Razor view, the Ruby, Java, C# or template code
inside the tags is not read. The tags are blanked, so line numbers hold.

### Apple app configuration

For Apple apps lexcode also reads, as text, the files that declare what an app
may do: `Info.plist` (and Xcode's `<Target>-Info.plist`),
`PrivacyInfo.xcprivacy`, `*.entitlements` and `project.pbxproj`. A binary
plist is not read.

## Package manifests

| Ecosystem | Files |
|---|---|
| npm | `package.json`, with `package-lock.json`, `pnpm-lock.yaml` or `yarn.lock` |
| PyPI | `pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock` |
| Go | `go.mod` |
| RubyGems | `Gemfile` or `gems.rb`, with `Gemfile.lock` or `gems.locked`, and `*.gemspec` |
| Maven and Gradle | `pom.xml`; Gradle's `build.gradle` and `build.gradle.kts` with their version catalogs (`gradle/*.versions.toml`), and the constants and `findLibrary` lookups in `buildSrc` and `build-logic` |
| Composer | `composer.json`, with the `composer.lock` beside it |
| NuGet | `*.csproj`, `*.fsproj`, `*.vbproj`, `Directory.Build.props`, `Directory.Build.targets`, `Directory.Packages.props` and `packages.config`, with the `packages.lock.json` beside a project |
| Cargo | `Cargo.toml`, with the `Cargo.lock` beside it or above it |
| Swift packages | `Package.swift`, and the Swift packages of an Xcode project's `project.pbxproj`, with `Package.resolved` |
| CocoaPods | `Podfile` and `Podfile.lock` |

Carthage's `Cartfile.resolved` is not read; the scan counts its entries in a
notice.
