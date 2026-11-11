// lexcode-expect: 0
// Classes that share names with local speech engines and are not them: a pattern
// Recognizer from a regex-style tokenizer, a Model from an unrelated library, and a
// whisper-named class that reads text.
package demo.local;

import java.util.List;
import java.util.regex.Pattern;

public class Tokens {
  private final Recognizer recognizer = new Recognizer(Pattern.compile("[a-z]+"), 3);

  List<String> words(String line) {
    return recognizer.acceptWaveForm(line);
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
  String full(String text) {
    return text.toLowerCase();
  }
}
