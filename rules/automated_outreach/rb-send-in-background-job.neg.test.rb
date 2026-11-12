# lexcode-expect: 0
# Jobs that send nothing, mailers that only define a message, and the mail a person asked for
# sent from the request that carried the ask.
class ReindexJob < ApplicationJob
  queue_as :default

  def perform(article_id)
    Article.find(article_id).reindex!
  end
end

class ThumbnailWorker
  include Sidekiq::Worker

  def perform(photo_id)
    photo = Photo.find(photo_id)
    photo.update!(thumbnail: Thumbnailer.call(photo))
  end
end

class QueueForwarder
  include Sidekiq::Job

  def perform(bodies)
    # SQS has a send_message too; it puts work on a queue and contacts nobody.
    @sqs.send_message(queue_url: "https://sqs.us-west-2.amazonaws.com/1/jobs", message_body: bodies.join(","))
  end
end

class UserMailer < ApplicationMailer
  def reset_password(user)
    @user = user
    mail(to: user.email, subject: "Reset your password")
  end

  def notify_assignment(user)
    @user = user
    mail(to: user.email, subject: "A new assignment")
  end
end

class PasswordResetsController < ApplicationController
  def create
    user = User.find_by(email: params[:email])
    UserMailer.with(user: user).reset_password.deliver_later if user
    head :no_content
  end
end

class SessionsController < ApplicationController
  def create
    user = User.find_by(email: params[:email])
    TwilioClient.new.messages.create(to: user.phone, from: "+15550100", body: "Your login code is #{user.otp}")
  end
end

class Notifier
  def notify_log(message)
    Rails.logger.info(message)
  end
end
