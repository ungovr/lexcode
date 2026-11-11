# lexcode-expect: 0
# Loading and querying models that were trained and saved elsewhere, and data structures that
# only share a name with a trainer.
require "xgboost"
require "lightgbm"
require "eps"

class ModelLoader
  def booster
    XGBoost::Booster.new(model_file: Rails.root.join("models/click.model").to_s)
  end

  def lgb
    LightGBM::Booster.new(model_file: "models/price.txt")
  end

  def pmml
    Eps::Model.load_pmml(File.read("models/price.pmml"))
  end

  def price(model, listing)
    model.predict(bedrooms: listing.bedrooms, sqft: listing.sqft)
  end

  def features
    XGBoost::DMatrix.new(Numo::DFloat.cast([[1, 2], [3, 4]]))
  end
end

class Pipeline
  def self.train(name)
    Route.new(name).train_schedule
  end

  def run
    Pipeline.train("morning")
  end
end
