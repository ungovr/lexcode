# lexcode-expect: 7
require "gemini-ai"

class AnswersController < ApplicationController
  # Whatever the model returns, text or an image, is the response body.
  def create
    gemini = Gemini.new(
      credentials: { service: "generative-language-api", api_key: ENV.fetch("GOOGLE_API_KEY") },
      options: { model: "gemini-pro" }
    )
    result = gemini.generate_content({ contents: { role: "user", parts: { text: params[:question] } } })
    render json: { text: result.dig("candidates", 0, "content", "parts", 0, "text") }
  end
end

class DescriptionsController < ApplicationController
  # Keyword arguments, as the Google Gen AI client takes them.
  def show
    response = GEMINI.models.generate_content(model: "gemini-2.5-flash", contents: [params[:photo].read, "Describe this picture."])
    render plain: response.text
  end
end

class StoriesController < ApplicationController
  include ActionController::Live

  # The streamed parts are written to the browser as they arrive.
  def show
    response.headers["Content-Type"] = "text/event-stream"
    chunks = GEMINI.stream_generate_content({ contents: { role: "user", parts: { text: "Tell a story about #{params[:topic]}" } } })
    chunks.each do |chunk|
      response.stream.write("data: #{chunk}\n\n")
    end
  ensure
    response.stream.close
  end
end

class ReportJob < ApplicationJob
  # A background job pushes the result to the page the user is watching.
  def perform(report_id)
    result = GEMINI.generate_content({ contents: { role: "user", parts: { text: "Write the weekly report." } } })
    summary = result.dig("candidates", 0, "content", "parts", 0, "text")
    ActionCable.server.broadcast("reports_#{report_id}", { html: summary })
    Turbo::StreamsChannel.broadcast_update_to("reports_#{report_id}", target: "summary", html: summary)
  end
end

class Api < Sinatra::Base
  post "/caption" do
    result = GEMINI.generate_content(contents: [{ text: "Caption this: #{params[:text]}" }])
    halt 200, result.to_json
  end
end

# The implicit view shows the answer (app/views/explainers/show.html.erb).
class ExplainersController < ApplicationController
  def show
    result = GEMINI.generate_content({ contents: { role: "user", parts: { text: "Explain #{params[:term]}" } } })
    @explanation = result.dig("candidates", 0, "content", "parts", 0, "text")
  end
end
