# lexcode-expect: 0
Rails.application.routes.draw do
  # Staff-only sign-in: no public registration.
  devise_for :admin_users, skip: [:registrations]
  devise_for :users, only: [:sessions, :passwords]
  devise_for :staff_members

  namespace :admin do
    resources :users, only: [:new, :create]
    resources :registrations
    get "signup", to: "invitations#new"
  end

  scope :internal do
    resources :users, only: [:new, :create]
  end

  get "login", to: "sessions#new"
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"

  get "invitations/accept", to: "invitations#accept"
  resources :users, only: [:show, :index]
  resources :vehicle_registrations, only: [:new, :create]
  resources :sessions, only: [:new, :create]
  get "registry/search", to: "registry#search"
  post "/vehicles/register", to: "vehicles#create"
  get "unregister", to: "subscriptions#destroy"
end
