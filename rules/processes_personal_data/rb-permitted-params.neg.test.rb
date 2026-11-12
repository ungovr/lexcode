# lexcode-expect: 0
# Strong parameters that carry no strong personal token.
class PostsController < ApplicationController
  def create
    Post.create!(post_params)
  end

  private

  def post_params
    params.require(:post).permit(:title, :body, :published, tag_ids: [])
  end
end

class SearchController < ApplicationController
  def index
    @results = Article.search(params.permit(:q, :page, :per_page))
  end
end

# A name or display name alone is not a strong token.
class TeamsController < ApplicationController
  def team_params
    params.require(:team).permit(:name, :display_name, :slug)
  end

  def email_template_params
    params.expect(template: [:subject, :email_template_id])
  end
end

# A hash of options that is not the request's parameters.
class Mailer
  def deliver(options)
    options.slice(:to, :subject)
    settings = { email: "support@example.org" }
    settings.fetch(:email)
  end
end
