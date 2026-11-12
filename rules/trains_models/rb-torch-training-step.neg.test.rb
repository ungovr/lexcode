# lexcode-expect: 0
# Inference with a model somebody else trained, a backward pass used for an explanation with no
# optimizer step, and `step` calls that have nothing to do with training.
require "torch"

class Scorer
  def initialize(path)
    @model = Torch.load(path)
    @model.eval
  end

  def score(features)
    Torch.no_grad { @model.call(Torch.tensor(features)).item }
  end
end

class Saliency
  # A gradient for an explanation: backward, then read the gradient, no optimizer step.
  def attribution(model, input)
    input.requires_grad!(true)
    model.call(input).sum.backward
    input.grad.abs
  end

  def batch_attribution(model, inputs)
    inputs.map do |input|
      input.requires_grad!(true)
      model.call(input).max.backward
      input.grad
    end
  end
end

class Slider
  def run(range)
    range.step(5) { |n| puts n }
    1.step(10, 3) do |n|
      progress.step(n)
    end
  end
end
