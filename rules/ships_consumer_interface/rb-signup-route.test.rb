# lexcode-expect: 8
Rails.application.routes.draw do
  devise_for :users
  devise_for :members, controllers: { registrations: "members/registrations" }

  get "signup", to: "users#new"
  post "/signup" => "users#create"
  get "register" => "users#new"
  match "accounts/register", to: "registrations#new", via: [:get, :post]
  get :sign_up, to: "users#new"

  resources :users, only: [:new, :create]

  namespace :admin do
    root to: "dashboard#index"
  end

  get "login", to: "sessions#new"
end
