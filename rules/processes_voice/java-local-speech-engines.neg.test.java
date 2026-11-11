// lexcode-expect: 0
// Classes that share names with local speech engines and are not them, defined here with
// no speech-engine import: a pattern Recognizer from a tokenizer, a text-only Whisperer
// with a full method, and Offline and Online recognizers that classify text.
package demo.local;

import java.util.List;
import java.util.regex.Pattern;

public class Tokens {
  private final Recognizer recognizer = new Recognizer(Pattern.compile("[a-z]+"), 3);
  private final Whisperer whisperer = new Whisperer();

  List<String> words(String line) {
    return recognizer.acceptWaveForm(line);
  }

  String quiet(String text) {
    return whisperer.full(text, 3);
  }

  Object tags(String config) {
    return List.of(new OfflineRecognizer(config), new OnlineRecognizer(config));
  }
}

// A text tokenizer that happens to be called a Recognizer and has a wave-named method.
class Recognizer {
  private final Pattern pattern;
  private final int min;

  Recognizer(Pattern pattern, int min) {
    this.pattern = pattern;
    this.min = min;
  }

  List<String> acceptWaveForm(String line) {
    return pattern.matcher(line).results().map(m -> m.group()).filter(s -> s.length() >= min).toList();
  }
}

class Whisperer {
  String full(String text, int length) {
    return text.toLowerCase().substring(0, Math.min(length, text.length()));
  }
}

// Text classifiers named like sherpa-onnx recognizers.
class OfflineRecognizer {
  OfflineRecognizer(String config) {}
}

class OnlineRecognizer {
  OnlineRecognizer(String config) {}
}
