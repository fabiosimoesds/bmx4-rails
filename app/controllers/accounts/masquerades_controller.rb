class Accounts::MasqueradesController < Devise::MasqueradesController
  protected

  def masquerade_authorize!
    authorize(self.find_masqueradable_resource, :masquerade?) unless params[:action] == 'back'
  end

  def after_back_masquerade_path_for(resource)
    accounts_path
  end
end
