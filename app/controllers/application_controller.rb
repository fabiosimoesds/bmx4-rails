class ApplicationController < ActionController::Base
  include Pagy::Backend
  include Pundit::Authorization
  protect_from_forgery with: :exception
  rescue_from Pundit::NotAuthorizedError, with: :account_not_authorized

  before_action :set_sentry_context
  before_action :configure_permitted_parameters, if: :devise_controller?
  around_action :set_time_zone, if: :current_account

  layout :layout_by_resource

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation])
  end

  private

  def pundit_user
    current_account
  end

  def account_not_authorized
    respond_to do |format|
      format.html do
        flash[:danger] = 'You are not authorised to view this page'
        redirect_back(fallback_location: root_path)
      end
      format.turbo_stream do
        render turbo_stream: turbo_stream.append(:toasts, partial: 'partials/toast', locals: {
          timeout: 5000,
          key: :danger,
          value: 'You are not authorized to perform this action',
        })
      end
    end
  end

  def set_sentry_context
    Sentry.set_user(current_account.sentry_account_hash) if current_account.present?
    Sentry.set_extras(params: params.to_unsafe_h, url: request.url)
  end

  def layout_by_resource
    account_signed_in? ? 'application' : 'devise'
  end

  def set_time_zone(&block)
    # sets user's timezone for localisation
    Time.use_zone(current_account.time_zone, &block)
  end
end
