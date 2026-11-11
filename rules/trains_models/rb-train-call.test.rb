# lexcode-expect: 4
# One-call training: XGBoost and LightGBM take params and a dataset, and Eps builds a model from
# an array of hashes and a target column.
require "xgboost"
require "lightgbm"
require "eps"

class PriceModel
  def train(listings)
    data = listings.map { |l| { bedrooms: l.bedrooms, sqft: l.sqft, price: l.price } }
    Eps::Model.new(data, target: :price)
  end
end

class ClickModel
  def train(x, y)
    dtrain = XGBoost::DMatrix.new(x, label: y)
    XGBoost.train({ objective: "binary:logistic", max_depth: 4 }, dtrain, num_boost_round: 50)
  end

  def train_lgb(x, y)
    dataset = LightGBM::Dataset.new(x, label: y)
    LightGBM.train({ objective: "regression" }, dataset, num_boost_round: 100)
  end
end

class LegacyEps
  def build(rows)
    Eps::Regressor.new(rows, target: :price)
  end
end
