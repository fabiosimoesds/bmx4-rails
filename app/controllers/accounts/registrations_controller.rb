class Accounts::RegistrationsController < Devise::RegistrationsController
  protected

  def update_resource(resource, params)
    # use .nil? instead of .blank? to show form errors when password params are not present
    if params[:password].nil? && params[:password_confirmation].nil?
      resource.update_without_password(params.except(:current_password))
    else
      if params[:current_password].blank? || params[:password].blank? || params[:password_confirmation].blank?
        flash.now[:danger] = 'Something went wrong. Please try again.'
      end

      super
    end
  end

  def after_update_path_for(resource)
    edit_registrations_path
  end
end
