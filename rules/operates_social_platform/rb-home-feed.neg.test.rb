# lexcode-expect: 0
class PostsController < ApplicationController
  def mine
    @posts = Post.where(author: current_user).order(created_at: :desc)
  end

  def latest_from_sources(source_ids)
    Article.where(source_id: source_ids).order(published_at: :desc).limit(100)
  end

  def orders_for(customer_ids)
    Order.where(customer_id: customer_ids)
  end

  def tickets_waiting(agent)
    Ticket.where(user_id: agent.follow_up_ids)
  end

  def descriptions
    Description.where(user_id: friendly_ids)
  end
end
