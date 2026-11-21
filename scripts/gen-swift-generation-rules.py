#!/usr/bin/env python3
"""Generate lexcode's Swift taint rules for the generates_* activities (#13199).

    python3 scripts/gen-swift-generation-rules.py [<lexcode checkout>]

The checkout defaults to the one this script sits in. It overwrites these eight rule files, and no other:

    rules/generates_text/swift-chat-reply-to-response.yml
    rules/generates_text/swift-chat-result-returned.yml
    rules/generates_content/swift-genai-to-response.yml
    rules/generates_content/swift-model-result-returned.yml
    rules/generates_images/swift-image-reply-to-response.yml
    rules/generates_images/swift-image-result-returned.yml
    rules/generates_video/swift-video-reply-to-response.yml
    rules/generates_audio/swift-speech-reply-to-response.yml

The eight share their source, propagator and sink blocks, so change them here and run the script, never in
one yml file by hand; then run the fixtures. The fixtures and the two hand-written search rules
(swift-platform-tts-speak, swift-image-playground-ui) are not touched.
"""
import sys
from pathlib import Path

WT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
IND = "  "


def q(s: str) -> str:
    """A YAML single-quoted scalar."""
    return "'" + s.replace("'", "''") + "'"


def block(s: str, n: int) -> str:
    """A YAML literal block scalar at indent n."""
    lines = s.strip("\n").split("\n")
    return "|\n" + "\n".join(IND * n + ln if ln else "" for ln in lines)


# ---------------------------------------------------------------- anchors

def anchor(lit: str) -> str:
    """A whole-file pre-filter, the one-literal greedy form CONTRIBUTING.md requires."""
    return r"(?s)\A(?=.*" + lit + r").*"


def IMPORT(mod: str) -> str:
    """A line-anchored import guard (the controller's ruling on review Minor 4, as it stands on v1.5): the
    import at the start of a line, after an optional byte order mark and any attributes, with an optional
    import kind."""
    return (r"(?ms)\A(?=.*^\x{FEFF}?[ \t]*(?:@\w+(?:\([^)]*\))?\s+)*import\s+"
            r"(?:(?:class|struct|enum|protocol|func|var|let|typealias)\s+)?" + mod + r"\b).*")
SERVER = [IMPORT("Vapor"), IMPORT("Hummingbird")]

# A vendor group: name, anchors (each entry a regex, or a list meaning any of them; all entries must hold),
# calls (the source call shapes) and closures (a call with a trailing closure, whose first parameter
# receives the result).
OPENAI = dict(name="openai", anchors=[IMPORT("OpenAI")])
SWIFTOPENAI = dict(name="swiftopenai", anchors=[IMPORT("SwiftOpenAI")])
FOUNDATION = dict(name="foundationmodels", anchors=[IMPORT("FoundationModels")], own=True)
BEDROCK = dict(name="bedrock", anchors=[IMPORT("AWSBedrockRuntime")])
GOOGLE = dict(name="googlegenai", anchors=[IMPORT("GoogleGenerativeAI")])
FIREBASE = dict(
    name="firebaseai",
    anchors=[[
        IMPORT("FirebaseAI"),
        IMPORT("FirebaseAILogic"),
        IMPORT("FirebaseVertexAI"),
        anchor(r"\bFirebaseAI\.firebaseAI\b"),
        anchor(r"\bVertexAI\.vertexAI\b"),
    ]],
)
PLAYGROUND = dict(name="imageplayground", anchors=[IMPORT("ImagePlayground")])
POLLY = dict(name="polly", anchors=[IMPORT("AWSPolly")])


# A capture list of one item (`[weak self]`, `[unowned self]`, `[self]`, `[weak delegate]`) or of two
# (`[weak self, model]`); probed for #13294 on Opengrep 1.33.1: `[$CAP]` matches any one capture whatever
# its specifier, but a capture list takes no ellipsis (`[...]` and `[$...CAPS]` are parse errors), so each
# length is a pattern of its own. A list of three matches `[$CAP, $CAP2, $CAP4]`, but every length adds a
# copy of each closure pattern (two per completion pair), so the rules stop at two and three is a known gap.
# A streaming call's completion closure takes none or one (closure2), and two or more is a known gap too
# (rules/README.md, "Known Swift gaps").
CAPTURES = ["", "[$CAP] ", "[$CAP, $CAP2] "]


def closure1(call: str) -> list:
    return [call + " { " + c + "$R in\n  ...\n}" for c in CAPTURES]


def closure2(call: str) -> list:
    # the completion closure may carry its own capture list of one item; a pattern cannot leave it out
    # (`completion: { ... }` and `completion: $COMP` matched nothing, probed)
    return [call + " { " + c + "$R in\n  ...\n} completion: { " + d + "$E in\n  ...\n}"
            for c in CAPTURES for d in ("", "[$CAP3] ")]


# ---------------------------------------------------------------- sources per activity

TEXT_SOURCES = [
    dict(OPENAI, calls=[
        "$C.chats(query: $Q)", "$C.chatsStream(query: $Q)",
        "$C.completions(query: $Q)", "$C.completionsStream(query: $Q)",
        "$C.responses.createResponse(query: $Q)", "$C.responses.createResponseStreaming(query: $Q)",
    ], closures=[
        closure1("$C.chats(query: $Q)"), closure1("$C.completions(query: $Q)"),
        closure1("$C.responses.createResponse(query: $Q)"),
        closure2("$C.chatsStream(query: $Q)"), closure2("$C.completionsStream(query: $Q)"),
        closure2("$C.responses.createResponseStreaming(query: $Q)"),
    ]),
    dict(SWIFTOPENAI, calls=[
        "$S.startChat(parameters: $P)", "$S.startStreamedChat(parameters: $P)",
        "$S.responseCreate($P)", "$S.responseCreateStream($P)",
    ]),
    dict(FOUNDATION, calls=["$S.respond(...)", "$S.streamResponse(...)"]),
    dict(BEDROCK, calls=["$C.converse(input: $I)", "$C.converseStream(input: $I)"]),
]

GENAI_SOURCES = [
    dict(GOOGLE, calls=[
        "$M.generateContent(...)", "$M.generateContentStream(...)",
        "$H.sendMessage(...)", "$H.sendMessageStream(...)",
    ]),
    dict(FIREBASE, calls=[
        "$M.generateContent(...)", "$M.generateContentStream(...)",
        "$H.sendMessage(...)", "$H.sendMessageStream(...)",
    ]),
]

IMAGE_SOURCES = [
    dict(OPENAI, calls=[
        "$C.images(query: $Q)", "$C.imageEdits(query: $Q)", "$C.imageVariations(query: $Q)",
    ], closures=[
        closure1("$C.images(query: $Q)"), closure1("$C.imageEdits(query: $Q)"),
        closure1("$C.imageVariations(query: $Q)"),
    ]),
    dict(SWIFTOPENAI, calls=[
        "$S.createImages(parameters: $P)", "$S.legacyCreateImages(parameters: $P)",
        "$S.legacyEditImage(parameters: $P)", "$S.legacyCreateImageVariations(parameters: $P)",
    ]),
    dict(FIREBASE, calls=["$M.generateImages(...)"]),
    dict(PLAYGROUND, calls=["$C.images(for: $P, style: $ST, limit: $LM)"]),
    dict(BEDROCK, name="bedrock-image", anchors=BEDROCK["anchors"] + [[
        anchor(r'"amazon\.nova-canvas'),
        anchor(r'"amazon\.titan-image-generator'),
        anchor(r'"stability\.'),
    ]], calls=["$C.invokeModel(input: $I)"]),
]

VIDEO_SOURCES = [
    dict(BEDROCK, name="bedrock-video", anchors=BEDROCK["anchors"] + [[
        anchor(r'"amazon\.nova-reel'),
        anchor(r'"luma\.ray'),
    ]], calls=["$C.startAsyncInvoke(input: $I)"]),
]

AUDIO_SOURCES = [
    dict(OPENAI, calls=["$C.audioCreateSpeech(query: $Q)"],
         closures=[closure1("$C.audioCreateSpeech(query: $Q)")]),
    dict(SWIFTOPENAI, calls=["$S.createSpeech(parameters: $P)"]),
    dict(POLLY, calls=["$C.synthesizeSpeech(input: $I)"]),
]


def anchors_yaml(group, n):
    out = []
    for a in group["anchors"]:
        if isinstance(a, list):
            out.append(f"{IND*n}- pattern-either:")
            for r in a:
                out.append(f"{IND*(n+2)}- pattern-regex: {q(r)}")
        else:
            out.append(f"{IND*n}- pattern-regex: {q(a)}")
    return out


def pattern_item(p: str, n: int, key="pattern") -> str:
    if "\n" in p:
        return f"{IND*n}- {key}: {block(p, n+2)}"
    return f"{IND*n}- {key}: {q(p)}"


def shift(lines, k):
    """Indent already-rendered YAML lines (each may hold several) by k levels."""
    return [IND * k + ln if ln else ln for item in lines for ln in item.split("\n")]


def sources_yaml(groups) -> list:
    """Four sources at most (the call, a completion closure's parameter, a guard binding, a binding from a
    value that holds the call), each a pattern-either of anchored branches (see the merge note below)."""
    calls, closures, guards, derived = [], [], [], []
    # The pre-filter is lost once the sources hold more than about seven alternatives in all (probed:
    # 6 and 7 kept it, 9 and 10 lost it, 21 to 55 s against 2 s). So the vendors that need only their
    # import are merged into one branch per kind (any of their imports, any of their calls), and a vendor
    # that also needs a model id in the file (Bedrock image and video) keeps a branch of its own for the
    # call alone when other vendors are present.
    # A vendor whose call names are generic (Foundation Models' respond and streamResponse, which are also
    # Vapor's and Hummingbird's middleware calls) keeps full branches of its own under its own import.
    own = [g for g in groups if g.get("own")]
    plain = [g for g in groups if not g.get("own") and len(g["anchors"]) == 1 and not isinstance(g["anchors"][0], list)]
    plain += [g for g in groups if not g.get("own") and len(g["anchors"]) == 1 and isinstance(g["anchors"][0], list)]
    extra = [g for g in groups if not g.get("own") and len(g["anchors"]) > 1]
    merged_groups = []
    if plain:
        regexes = []
        for g in plain:
            a = g["anchors"][0]
            regexes += a if isinstance(a, list) else [a]
        merged = dict(name="vendors", anchors=[regexes] if len(regexes) > 1 else regexes,
                      calls=list(dict.fromkeys(c for g in plain for c in g["calls"])),
                      closures=list(dict.fromkeys(c for g in plain for cl in g.get("closures", []) for c in cl)))
        merged_groups.append(merged)
        merged_groups += [dict(g, call_only=True) for g in extra]
    else:
        merged_groups = extra
    merged_groups += [dict(g, closures=[c for cl in g.get("closures", []) for c in cl]) for g in own]
    for g in merged_groups:
        tag = "calls_" + g["name"].replace("-", "_")
        # 1. the call itself
        b = [f"{IND*5}- patterns:"] + shift(anchors_yaml(g, 5), 2)
        b.append(f"{IND*7}- pattern-either:" + ("" if g.get("call_only") else f" &{tag}"))
        b += [pattern_item(c, 9) for c in g["calls"]]
        calls += b
        if g.get("call_only"):
            continue
        # 2. the result handed to a trailing closure
        if g.get("closures"):
            b = [f"{IND*5}- patterns:"] + shift(anchors_yaml(g, 5), 2)
            b.append(f"{IND*7}- pattern-either:")
            b += [pattern_item(c, 9) for c in g["closures"]]
            b.append(f"{IND*7}- focus-metavariable: $R")
            closures += b
        # 3. the name a guard binds to the call's result (the engine does not carry taint through an
        #    optional binding, so the bound name is a source of its own). The anchors sit one level up:
        #    beside the pattern-inside terms they drop every match (probed).
        inner = [f"{IND*5}- pattern-either:",
                 pattern_item("guard let $X = $E0 else { ... }\n...", 7, "pattern-inside"),
                 pattern_item("guard let $X = $E0, ... else { ... }\n...", 7, "pattern-inside"),
                 f"{IND*5}- metavariable-pattern:",
                 f"{IND*7}metavariable: $E0",
                 f"{IND*7}pattern-either: *{tag}",
                 f"{IND*5}- pattern: $X"]
        b = [f"{IND*5}- patterns:"] + shift(anchors_yaml(g, 5), 2) + [f"{IND*7}- patterns:"] + shift(inner, 4)
        guards += b
        # 4. a name bound by guard let or if let from a value that holds the call's result
        inner = [f"{IND*5}- pattern-either:",
                 pattern_item("let $V = $E0\n...", 7, "pattern-inside"),
                 pattern_item("var $V = $E0\n...", 7, "pattern-inside"),
                 f"{IND*5}- metavariable-pattern:",
                 f"{IND*7}metavariable: $E0",
                 f"{IND*7}pattern-either: *{tag}",
                 f"{IND*5}- pattern-either:",
                 pattern_item("guard let $X = $E1 else { ... }\n...", 7, "pattern-inside"),
                 pattern_item("guard let $X = $E1, ... else { ... }\n...", 7, "pattern-inside"),
                 pattern_item("if let $X = $E1 {\n  ...\n}", 7, "pattern-inside"),
                 pattern_item("if let $X = $E1, ... {\n  ...\n}", 7, "pattern-inside"),
                 f"{IND*5}- metavariable-pattern:",
                 f"{IND*7}metavariable: $E1",
                 f"{IND*7}pattern: $V",
                 f"{IND*5}- pattern: $X"]
        b = [f"{IND*5}- patterns:"] + shift(anchors_yaml(g, 5), 2) + [f"{IND*7}- patterns:"] + shift(inner, 4)
        derived += b
    out = []
    for part in (calls, closures, guards, derived):
        if part:
            out.append(f"{IND*3}- pattern-either:")
            out += part
    return out


PROPAGATORS = r"""
    pattern-propagators:
      - patterns:
          - pattern-inside: |
              for try await $X in $S {
                ...
              }
          - pattern: $X
        from: $S
        to: $X
      - patterns:
          - pattern-inside: |
              for await $X in $S {
                ...
              }
          - pattern: $X
        from: $S
        to: $X
      - patterns:
          - pattern-inside: |
              switch $S {
              case .success(let $X):
                ...
              }
          - pattern: $X
        from: $S
        to: $X
      - patterns:
          - pattern-inside: |
              if case .success(let $X) = $S {
                ...
              }
          - pattern: $X
        from: $S
        to: $X
      - patterns:
          - pattern-inside: |
              guard case .success(let $X) = $S else { ... }
              ...
          - pattern: $X
        from: $S
        to: $X
""".strip("\n")

# ---------------------------------------------------------------- sinks

TEXT_NAMES = r"state|message|reply|response|answer|result|output|text|summary|story|caption|content|completion|suggestion|draft|translation"
IMAGE_NAMES = r"image|photo|picture|artwork|avatar|illustration|drawing|sticker"
VIDEO_NAMES = r"video|clip|movie|footage"
AUDIO_NAMES = r"audio|speech|sound|voice|narration"
TEXT_LISTS = r"messages|replies|responses|answers|results|outputs|suggestions|transcript"
# `results` and `outputs` name a list of whatever the call made, so each kind's list takes them; the
# rule's own sources keep a text model's results out of the image rule (#13294).
IMAGE_LISTS = r"images|photos|pictures|results|outputs"
VIDEO_LISTS = r"clips|videos|results|outputs"
AUDIO_LISTS = r"recordings|clips|results|outputs"


def state_sink(names: str, lists: str) -> str:
    """An assignment, `+=` or append to a property whose name says it holds output. The name check sits in a
    nested block with the pattern-either that binds $S (CONTRIBUTING.md, Cost), so every other assignment in
    the file is dropped before the local-`var` exclusions are paired with it: about a fifth of
    swift-image-reply-to-response's time on rule-cost's plain 900 KB filler (two runs at high load, same
    matches). A local-`var` exclusion written with no return type also covers a function that has one, so
    there is no `-> $T` copy of either; each reply rule's `.neg.test.scope.swift` holds that shape, untyped
    and typed, and matches once the exclusions are removed. A computed property's body (SwiftUI's `var body`,
    whose `.task { }` closure keeps a local accumulator) is excluded the same way (#13294); a local `var` in
    a closure inside a function is already inside the function's exclusion."""
    return f"""
      - patterns:
          - patterns:
              - pattern-either:
                  - pattern: $S = $X
                  - pattern: $S += $X
                  - pattern: $S.append($X)
                  - pattern: '$S.append(contentsOf: $X)'
              - metavariable-regex:
                  metavariable: $S
                  regex: (?i)^(self[?!]?\\.)?_?\\w*({names}|{lists})\\w*$
          - pattern-not-inside: let $S = $E
          - pattern-not-inside: |
              func $F(...) {{
                ...
                var $S = $E
                ...
              }}
          - pattern-not-inside: |
              func $F(...) {{
                ...
                var $S: $U = $E
                ...
              }}
          - pattern-not-inside: |
              var $P: $PT {{
                ...
                var $S = $E
                ...
              }}
          - pattern-not-inside: |
              var $P: $PT {{
                ...
                var $S: $U = $E
                ...
              }}
{closure_locals()}
          - focus-metavariable: $X""".strip("\n")


# A closure whose own local `var` takes the output is no screen either: a closure outside any function
# (top-level code in main.swift, a stored closure) or inside an init is not covered by the function
# exclusion above (#13294). An init's own local was not matched before (probed), so it needs no form. A
# capture list takes no ellipsis and a closure's parameters are part of its head, so each head is a pattern (probed on Opengrep 1.33.1: no parameter, one, two, and a capture
# of one item with none or one; `{ ... }` alone does not match a closure that names a parameter). A
# sequence exclusion (`var $S = $E` then `...`) is not one: it also covers a class's stored property and
# every method after it.
CLOSURE_HEADS = ["{", "{ $CP in", "{ $CP, $CQ in", "{ [$CAP] in", "{ [$CAP] $CP in"]


def closure_locals() -> str:
    out = []
    for h in CLOSURE_HEADS:
        for decl in ("var $S = $E", "var $S: $U = $E"):
            out += ["          - pattern-not-inside: |", f"              {h}", "                ...",
                    f"                {decl}", "                ...", "              }"]
    return "\n".join(out)


TEXT_UI = r"""
      - pattern: $V.text = $X
      - pattern: $V.attributedText = $X
      - pattern: $V.stringValue = $X
      - pattern: Text($X)
      - pattern: 'Text(verbatim: $X)'
      - pattern: '$W.loadHTMLString($X, baseURL: $B)'
""".strip("\n")

IMAGE_UI = r"""
      - pattern: $V.image = $X
      - pattern: '$V.setImage($X, for: $ST)'
      - pattern: 'Image(uiImage: $X)'
      - pattern: 'Image(nsImage: $X)'
      - pattern: 'Image(decorative: $X, ...)'
      - pattern: 'Image($X, scale: $SC, ...)'
      - pattern: 'AsyncImage(url: $X, ...)'
      - pattern: 'UIImageView(image: $X)'
""".strip("\n")

AV_PLAYER = r"""
      - pattern: 'AVFoundation.AVPlayer(url: $X)'
      - pattern: 'AVFoundation.AVPlayerItem(url: $X)'
      - pattern: 'AVFoundation.AVPlayer(playerItem: $X)'
""".strip("\n")

AUDIO_UI = r"""
      - pattern: 'AVFoundation.AVAudioPlayer(data: $X, ...)'
      - pattern: 'AVFoundation.AVAudioPlayer(contentsOf: $X, ...)'
      - pattern: '$N.scheduleBuffer($X, ...)'
""".strip("\n")

SERVER_SINKS = """
      - patterns:
          - pattern-either:
              - pattern-regex: {v}
              - pattern-regex: {h}
          - pattern-either:
              - patterns:
                  - pattern-either:
                      - pattern: |
                          $APP.$M(...) {{ $REQ in
                            ...
                            return $X
                          }}
                      - pattern: |
                          $APP.$M(...) {{ $REQ, $CTX in
                            ...
                            return $X
                          }}
                  - metavariable-regex:
                      metavariable: $M
                      regex: ^(get|post|put|patch|delete|on)$
              - pattern: |
                  func $F(..., $REQ: Request, ...) -> $T {{
                    ...
                    return $X
                  }}
              - pattern: |
                  func $F(..., $REQ: HBRequest, ...) -> $T {{
                    ...
                    return $X
                  }}
              # a handler of one expression, whose value is its implicit return (a route closure of one
              # expression is already matched by the closure forms above); a handler that returns Void
              # or `()` has no implicit return, so its one statement (`_ = try await ...`, a log line)
              # is not one
              - patterns:
                  - pattern-either:
                      - pattern: |
                          func $F(..., $REQ: Request, ...) -> $T {{
                            $X
                          }}
                      - pattern: |
                          func $F(..., $REQ: HBRequest, ...) -> $T {{
                            $X
                          }}
                  # (the engine binds `$T` from the effects on, `async throws(MyError) -> Void` or
                  # `async throws` and `-> ()` on the next line, so the type is read after the last
                  # `->` when there is one, and a type that ends in `(` or `()` is the empty tuple)
                  - metavariable-regex:
                      metavariable: $T
                      regex: ^(?!(?:[\\s\\S]*->\\s*)?\\(?\\s*(?:(?:Swift\\.)?Void)?\\s*\\)?$|[\\s\\S]*\\(\\s*\\)?$)
          - focus-metavariable: $X
      - patterns:
          - pattern-either:
              - pattern-regex: {v}
              - pattern-regex: {h}
          - pattern-either:
              - pattern: 'Response(..., body: $X, ...)'
              - pattern: 'HBResponse(..., body: $X, ...)'
              - pattern: $REQ.eventLoop.makeSucceededFuture($X)
      - patterns:
          - pattern-either:
              - pattern: $WS.send($X, ...)
          - metavariable-regex:
              metavariable: $WS
              regex: (?i)^(self[?!]?\\.)?_?\\w*(ws|websocket|socket)$
      - pattern: 'APIGatewayV2Response(..., body: $X, ...)'
      - pattern: 'APIGatewayResponse(..., body: $X, ...)'
""".format(v=q(SERVER[0]), h=q(SERVER[1])).strip("\n")

def call_names(groups) -> str:
    """The method names of a rule's source calls (the last name before the call's parenthesis), as one
    alternation for a regex."""
    import re
    names = []
    for g in groups:
        for c in g["calls"]:
            m = re.search(r"\.(\w+)\(", c)
            if m and m.group(1) not in names:
                names.append(m.group(1))
    return "|".join(names)


def return_sink(groups) -> str:
    """A value returned from a function, other than a Vapor or Hummingbird handler, inside a function (with or
    without a return type, an init included) whose body names one of the rule's source calls. Without the
    name check every return in the file is a sink, and a taint rule's time grows with its sink matches times
    the file's size once a source is in the file (#13034): 16 to 19 s on rule-cost's 900 KB Swift file,
    against about 7 s with the check and 3.6 s for the bare parse (probed). The engine does carry taint
    into a nested function that captures a tainted local, so the scope is any enclosing function that names
    the call, not only the returning one. One scope pattern with no return type matches a function with or
    without one, and an init; a pattern-either of it and the `-> T` form cost about 60 s on the same file
    (probed), so keep it one pattern. The return itself is a function's with a return type, or a closure's
    (a `Task { ... return x }` or a stored closure under a method with no return type or an init, #13294),
    which the `-> T` form does not reach. A model result held at file scope (a script or main.swift) and
    returned from a function that names no call is not a sink: a known gap."""
    return """
      - patterns:
          - pattern-inside:
              patterns:
                - pattern: |
                    func $SCOPE(...) {{
                      $...BODY
                    }}
                - metavariable-regex:
                    metavariable: $...BODY
                    regex: (?s).*\\b(?:{names})\\b
          - pattern-either:
              - pattern: |
                  func $F(...) -> $T {{
                    ...
                    return $X
                  }}
              # a closure's or a Task's own return, under a function with no return type or an init
              # (#13294). The engine also reads a closure's last statement as `return $X` when it has no
              # `return` (`print(output)` at the end of a Task), so the value must follow the keyword on
              # its line: a returned expression split over lines is not read.
              - patterns:
                  - patterns:
                      - pattern-either:
                          - pattern: |
                              {{
                                ...
                                return $X
                              }}
                          - pattern: |
                              {{ $CP in
                                ...
                                return $X
                              }}
                      - focus-metavariable: $X
                  - pattern-regex: '(?<=\\breturn )[^\\n]+'
          - focus-metavariable: $X
          - pattern-not-inside:
              patterns:
                - pattern-either:
                    - pattern-regex: {v}
                    - pattern-regex: {h}
                - pattern-either:
                    - pattern: |
                        func $G(..., $REQ: Request, ...) -> $U {{
                          ...
                        }}
                    - pattern: |
                        func $G(..., $REQ: HBRequest, ...) -> $U {{
                          ...
                        }}
                    # a route closure, which the evidence rule reads as the response
                    - patterns:
                        - pattern-either:
                            - pattern: |
                                $APP.$M(...) {{ $REQ in
                                  ...
                                }}
                            - pattern: |
                                $APP.$M(...) {{ $REQ, $CTX in
                                  ...
                                }}
                        - metavariable-regex:
                            metavariable: $M
                            regex: ^(get|post|put|patch|delete|on)$
""".format(names=call_names(groups), v=q(SERVER[0]), h=q(SERVER[1])).strip("\n")


def meta(activity: str, page: str, signal: bool) -> str:
    s = f"""    metadata:
      activity: {activity}
      mentioned: performs
      definition: https://lexlint.io/activities/{page}
      provenance: ungovr-original
      license: MIT"""
    if signal:
        s += "\n      strength: signal"
    return s


def rule(rid, activity, page, message, comment, groups, sinks, signal=False):
    out = ["rules:", f"  - id: {rid}", "    languages: [swift]", "    severity: INFO", f"    message: {message}"]
    for ln in comment.strip("\n").split("\n"):
        out.append("    # " + ln if ln else "    #")
    out.append("    mode: taint")
    out.append("    pattern-sources:")
    out += sources_yaml(groups)
    out.append(PROPAGATORS)
    out.append("    pattern-sinks:")
    out += sinks
    out.append(meta(activity, page, signal))
    return "\n".join(out) + "\n"


def write(activity, what, text):
    p = WT / "rules" / activity / f"swift-{what}.yml"
    p.write_text(text)
    print("wrote", p)


COMMON_COMMENT = """Swift shapes (Opengrep 1.33.1, probed for #13199): the engine does not carry taint through an
optional binding (`guard let x = ...`, `if let x = ...`), so a name bound from a model call, or from a
value that holds one, is a source of its own; a `for try await` loop variable, a `switch` or `if case`
`.success(let x)` binding and the first parameter of a vendor's completion closure are carried. An
`if let x = try ...` condition does not parse at all and is a known gap. A local `var` declared in the
same function is not a screen, so a state-name sink skips it."""

UI_SERVER = ["Sinks: a screen (SwiftUI `Text`, a UIKit or AppKit text property, a view-model property whose",
             "name says it holds output), and a Vapor or Hummingbird response or socket, or an AWS Lambda API Gateway",
             "response."]


def main():
    text_sinks = [state_sink(TEXT_NAMES, TEXT_LISTS), TEXT_UI, SERVER_SINKS]
    write("generates_text", "chat-reply-to-response", rule(
        "lexcode.text.swift-chat-reply-to-response", "generates_text", "generates-text",
        "Shows text written by a chat or language model on screen, or sends it back in an HTTP response or a socket, which is generating text with AI that reaches users (generates_text).",
        "Sources: MacPaw OpenAI (chats, completions, responses), SwiftOpenAI (startChat, responseCreate),\n"
        "Apple Foundation Models (LanguageModelSession respond and streamResponse) and Amazon Bedrock Converse.\n"
        + "\n".join(UI_SERVER) + "\n" + COMMON_COMMENT,
        TEXT_SOURCES, text_sinks))
    write("generates_text", "chat-result-returned", rule(
        "lexcode.text.swift-chat-result-returned", "generates_text", "generates-text",
        "Returns text written by a chat or language model from a function, which may be generating text with AI that reaches users (generates_text).",
        "The signal beside swift-chat-reply-to-response: a function that returns the model's text, often a\n"
        "service a view model calls from another file. A Vapor or Hummingbird handler is left to the evidence rule.\n"
        "The return counts only inside a function whose body names one of the source calls (the sink regex\n"
        "lists them; keep it equal to them), which keeps the rule within its cost bounds. A\n"
        "model result held at file scope and returned from a function that names no call is not read.\n"
        + COMMON_COMMENT,
        TEXT_SOURCES, [return_sink(TEXT_SOURCES)], signal=True))

    all_names = "|".join([TEXT_NAMES, IMAGE_NAMES, VIDEO_NAMES, AUDIO_NAMES])
    genai_sinks = [state_sink(all_names, "|".join([TEXT_LISTS, IMAGE_LISTS, VIDEO_LISTS, AUDIO_LISTS])), TEXT_UI, IMAGE_UI, SERVER_SINKS]
    write("generates_content", "genai-to-response", rule(
        "lexcode.generate.swift-genai-to-response", "generates_content", "generates-content",
        "Shows a Gemini response, whose kind the code does not fix, on screen, or sends it back in an HTTP response or a socket, which is generating content with AI that reaches users (generates_content).",
        "Sources: Google's Generative AI Swift SDK and Firebase AI Logic (FirebaseAI, FirebaseAILogic,\n"
        "FirebaseVertexAI): generateContent, generateContentStream and a chat's sendMessage. Gemini can answer\n"
        "with text or pictures, so the call is generates_content. `FirebaseAI.firebaseAI` and `VertexAI.vertexAI`\n"
        "carry the product's own name and also admit a file that reaches Firebase through an umbrella import.\n"
        + "\n".join(UI_SERVER) + "\n" + COMMON_COMMENT,
        GENAI_SOURCES, genai_sinks))
    write("generates_content", "model-result-returned", rule(
        "lexcode.generate.swift-model-result-returned", "generates_content", "generates-content",
        "Returns the output of a Gemini call from a function, which may be generating content with AI that reaches users (generates_content).",
        "The signal beside swift-genai-to-response. A Vapor or Hummingbird handler is left to the evidence rule.\n"
        "The return counts only inside a function whose body names one of the source calls (the sink regex\n"
        "lists them; keep it equal to them), which keeps the rule within its cost bounds. A\n"
        "model result held at file scope and returned from a function that names no call is not read.\n"
        + COMMON_COMMENT,
        GENAI_SOURCES, [return_sink(GENAI_SOURCES)], signal=True))

    image_sinks = [state_sink(IMAGE_NAMES, IMAGE_LISTS), IMAGE_UI, SERVER_SINKS]
    write("generates_images", "image-reply-to-response", rule(
        "lexcode.image.swift-image-reply-to-response", "generates_images", "generates-images",
        "Shows a picture made by an image model on screen, or sends it back in an HTTP response or a socket, which is generating images with AI that reaches users (generates_images).",
        "Sources: MacPaw OpenAI (images, imageEdits, imageVariations), SwiftOpenAI (createImages and the legacy\n"
        "calls), Firebase AI Logic Imagen (generateImages), Apple Image Playground's ImageCreator\n"
        "(images(for:style:limit:)) and Amazon Bedrock InvokeModel in a file that names an image model\n"
        "(Nova Canvas, Titan Image Generator, Stability).\n"
        "Sinks: a SwiftUI Image or AsyncImage, a UIKit image view or button, a view-model property whose name\n"
        "says it holds a picture, and a Vapor or Hummingbird response or socket.\n"
        + COMMON_COMMENT,
        IMAGE_SOURCES, image_sinks))
    write("generates_images", "image-result-returned", rule(
        "lexcode.image.swift-image-result-returned", "generates_images", "generates-images",
        "Returns a picture made by an image model from a function, which may be generating images with AI that reaches users (generates_images).",
        "The signal beside swift-image-reply-to-response. A Vapor or Hummingbird handler is left to the evidence rule.\n"
        "The return counts only inside a function whose body names one of the source calls (the sink regex\n"
        "lists them; keep it equal to them), which keeps the rule within its cost bounds. A\n"
        "model result held at file scope and returned from a function that names no call is not read.\n"
        + COMMON_COMMENT,
        IMAGE_SOURCES, [return_sink(IMAGE_SOURCES)], signal=True))

    video_sinks = [state_sink(VIDEO_NAMES, VIDEO_LISTS), AV_PLAYER, SERVER_SINKS]
    write("generates_video", "video-reply-to-response", rule(
        "lexcode.video.swift-video-reply-to-response", "generates_video", "generates-video",
        "Plays or sends back a clip from a video model, which is generating video with AI that reaches users (generates_video).",
        "Source: Amazon Bedrock StartAsyncInvoke in a file that names a video model (Nova Reel, Luma Ray). The\n"
        "job writes the clip to S3 and returns its invocation ARN, which an app hands to its client to fetch\n"
        "the clip. OpenAI's Videos API has no Swift client in scope and was retired on 2026-09-24.\n"
        "Sinks: an AVPlayer, a view-model property whose name says it holds a clip, and a Vapor or Hummingbird\n"
        "response or socket.\n"
        + COMMON_COMMENT,
        VIDEO_SOURCES, video_sinks))

    audio_sinks = [state_sink(AUDIO_NAMES, AUDIO_LISTS), AUDIO_UI, AV_PLAYER, SERVER_SINKS]
    write("generates_audio", "speech-reply-to-response", rule(
        "lexcode.audio.swift-speech-reply-to-response", "generates_audio", "generates-audio",
        "Plays or sends back speech synthesized by a text-to-speech model, which is generating audio with AI that reaches users (generates_audio).",
        "Sources: MacPaw OpenAI audioCreateSpeech, SwiftOpenAI createSpeech and Amazon Polly SynthesizeSpeech.\n"
        "Sinks: an AVAudioPlayer, AVPlayer or AVAudioPlayerNode, a view-model property whose name says it holds\n"
        "audio, and a Vapor or Hummingbird response or socket.\n"
        + COMMON_COMMENT,
        AUDIO_SOURCES, audio_sinks))


if __name__ == '__main__':
    main()
