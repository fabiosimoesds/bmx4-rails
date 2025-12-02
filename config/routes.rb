Rails.application.routes.draw do
  devise_for :accounts, skip: [:registrations], path_names: { sign_in: 'log_in' }, controllers: { masquerades: 'accounts/masquerades' }

  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  require 'sidekiq/web'
  mount Sidekiq::Web => '/sidekiq'

  devise_scope :account do
    unauthenticated do
      root 'devise/sessions#new', as: :root
    end
  end

  %w(404 422 500).each do |code|
    get code, to: 'errors#show', code: code
  end
end
