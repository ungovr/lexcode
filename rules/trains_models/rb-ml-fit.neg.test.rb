# lexcode-expect: 0
# Predictions from a model trained elsewhere, and fits that learn column statistics or a
# projection instead of a model.
require "rumale"
require "informers"

class Scorer
  def initialize
    @model = Marshal.load(File.binread(Rails.root.join("models/churn.bin")))
  end

  def score(rows)
    @model.predict_proba(Numo::DFloat.cast(rows))
  end
end

class Embedder
  def call(texts)
    pipe = Informers.pipeline("embedding", "sentence-transformers/all-MiniLM-L6-v2")
    pipe.(texts)
  end
end

class Preprocess
  def call(x)
    # Fitting a scaler or a projection learns column statistics, not a model.
    scaler = Rumale::Preprocessing::StandardScaler.new
    scaler.fit(x)
    Rumale::Preprocessing::MinMaxScaler.new.fit(x).transform(x)
    pca = Rumale::Decomposition::PCA.new(n_components: 2)
    pca.fit(x)
    Rumale::Preprocessing::LabelEncoder.new.fit(%w[a b c])
  end
end

class Report
  def trend(points)
    line = Statistics.linear_fit(points)
    line.fit(1, 2)
  end

  def adjust(sizing)
    Sizing.new.fit(sizing)
  end
end

class Tshirt
  def fit(size)
    size.to_i
  end

  def order(sizes)
    sizes.map { |s| Tshirt.new.fit(s) }
  end
end

class Coach
  def train(athlete)
    athlete.train(:cardio, minutes: 30)
    Dog.new.train(:sit)
  end
end
