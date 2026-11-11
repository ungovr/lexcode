# lexcode-expect: 5
# torch-rb training loops: a loss is back-propagated and an optimizer is stepped.
require "torch"

class ChurnTrainer
  EPOCHS = 20

  def initialize(model, loader)
    @model = model
    @loader = loader
    @optimizer = Torch::Optim::Adam.new(model.parameters, lr: 1e-3)
    @loss_fn = Torch::NN::MSELoss.new
  end

  def fit
    EPOCHS.times do |epoch|
      @loader.each do |features, labels|
        @optimizer.zero_grad
        loss = @loss_fn.call(@model.call(features), labels)
        loss.backward
        @optimizer.step
      end
    end
  end

  def fit_with_accumulation(steps: 4)
    @loader.each_with_index do |(features, labels), i|
      loss = @loss_fn.call(@model.call(features), labels) / steps
      loss.backward()
      if (i + 1) % steps == 0
        @optimizer.step
        @optimizer.zero_grad
      end
    end
  end
end

class RecommenderJob < ApplicationJob
  def perform(dataset_id)
    data = Interaction.where(dataset_id: dataset_id).pluck(:user_idx, :item_idx, :rating)
    net = MatrixFactorization.new(users: 5000, items: 800)
    opt = Torch::Optim::SGD.new(net.parameters, lr: 0.05)
    for epoch in 0...30
      opt.zero_grad
      loss = Torch::NN::F.mse_loss(net.call(data), target)
      loss.backward
      opt.step
    end
  end
end

def minimize(model, batch)
  optimizer = Torch::Optim::LBFGS.new(model.parameters)
  step = 0
  while step < 200
    loss = Torch::NN::F.cross_entropy(model.call(batch.x), batch.y)
    loss.backward
    optimizer.step
    step += 1
  end
end

def train_forever(model, source)
  optimizer = Torch::Optim::RMSprop.new(model.parameters)
  loop do
    x, y = source.next
    loss = Torch::NN::F.l1_loss(model.call(x), y)
    loss.backward
    optimizer.step
  end
end
