class Admin::AccountsController < ApplicationController
  before_action :authenticate_account!

  def index
    @q = Account.ransack(params[:q])
    @q.sorts = ['full_name'] if @q.sorts.empty?

    @pagy, @accounts = pagy(@q.result)
  end
end
