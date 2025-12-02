class AccountPolicy < ApplicationPolicy
  attr_reader :account, :model

  def initialize(account, model)
    @current_account = account
    @account = model
  end

  def masquerade?
    @account.masqueradable?(@current_account)
  end
end
