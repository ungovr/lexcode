# lexcode-expect: 0
# Whisper-named things that are not the whisper.cpp speech model: a Rails notification
# helper, a Whisper constant of an app's own, and a model loader for a text model.
require "informers"

module Whispers
  # A "whisper" in this app is a private message between two users.
  class PrivateMessage < ApplicationRecord
    belongs_to :sender, class_name: "User"
    belongs_to :recipient, class_name: "User"

    def transcribe_for_export
      "#{sender.name} to #{recipient.name}: #{body}"
    end
  end
end

class Whisper
  def self.deliver(from, to, text)
    Whispers::PrivateMessage.create!(sender: from, recipient: to, body: text)
  end
end

class TextEmbedder
  def initialize
    @model = Informers.pipeline("embedding", "sentence-transformers/all-MiniLM-L6-v2")
  end

  def embed(text)
    @model.call(text)
  end
end

class ExportsController < ApplicationController
  def show
    message = Whispers::PrivateMessage.find(params[:id])
    send_data message.transcribe_for_export, filename: "message.txt"
  end
end
