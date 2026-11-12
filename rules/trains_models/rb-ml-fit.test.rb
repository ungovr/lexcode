# lexcode-expect: 7
# Models fitted on data the app collected, with the Ruby machine-learning gems.
require "rumale"
require "xgboost"
require "disco"

class ChurnModelJob < ApplicationJob
  def perform
    rows = Customer.where.not(churned_at: nil).pluck(:tenure, :plan_idx, :tickets, :churned)
    x = Numo::DFloat.cast(rows.map { |r| r[0..2] })
    y = Numo::Int32.cast(rows.map(&:last))

    model = Rumale::LinearModel::LogisticRegression.new(reg_param: 1.0, max_iter: 200)
    model.fit(x, y)
    File.binwrite(Rails.root.join("models/churn.bin"), Marshal.dump(model))

    Rumale::Ensemble::RandomForestClassifier.new(n_estimators: 100, random_seed: 1).fit(x, y)
  end
end

class RecommendationRefresh
  def call
    ratings = Rating.pluck(:user_id, :item_id, :value).map do |u, i, v|
      { user_id: u, item_id: i, rating: v }
    end
    @recommender = Disco::Recommender.new(factors: 20)
    @recommender.fit(ratings)
    @recommender
  end
end

class BoostedPricing
  def train(x, y)
    reg = XGBoost::Regressor.new(n_estimators: 200, max_depth: 4)
    reg.fit(x, y)
    reg
  end
end

class SpamFilter
  def retrain(messages)
    bayes = ClassifierReborn::Bayes.new("Spam", "Ham")
    messages.each { |m| bayes.train(m.label, m.body) }
    bayes
  end
end

class DemandForecast
  def call(df)
    forecaster = Prophet.new(growth: "linear")
    forecaster.fit(df)
    forecaster.predict(forecaster.make_future_dataframe(periods: 30))
  end
end

class GradingNetwork
  def run(inputs, targets)
    net = RubyFann::Standard.new(num_inputs: 4, hidden_neurons: [8], num_outputs: 1)
    train = RubyFann::TrainData.new(inputs: inputs, desired_outputs: targets)
    net.train_on_data(train, 1000, 10, 0.01)
    net
  end
end
