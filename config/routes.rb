Rails.application.routes.draw do
  devise_for :accounts, skip: [:registrations], path_names: { sign_in: 'log_in' }

  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  require 'sidekiq/web'

  devise_scope :account do
    resource :registrations, only: [:edit, :update], path: :my_profile, controller: 'accounts/registrations'

    unauthenticated do
      root 'devise/sessions#new', as: :root
    end

    authenticate :account, lambda { |u| u.super_admin? || Rails.env.development? } do
      mount Sidekiq::Web => '/sidekiq'
    end

    authenticated :account, lambda { |u| u.admin? } do
      root 'admin/accounts#index', as: :admin_authenticated_root

      scope module: :admin do
        resources :accounts, only: [:index, :edit, :update, :destroy]
      end
    end

    authenticated :account, lambda { |u| u.other? } do
      root 'admin/accounts#index', as: :other_authenticated_root
    end
  end

  %w(404 422 500).each do |code|
    get code, to: 'errors#show', code: code
  end
end
