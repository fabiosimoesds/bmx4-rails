class Admin::AccountsController < ApplicationController
  before_action :authenticate_account!

  def index
    @q = Account.ransack(params[:q])
    @q.sorts = ['full_name'] if @q.sorts.empty?

    @pagy, @accounts = pagy(@q.result)
  end

  def edit
    @account = Account.find(params[:id])
    edit_breadcrumbs
  end

  def update
    @account = Account.find(params[:id])

    if @account.update(account_params)
      flash[:success] = "Successfully updated #{@account.name}'s account"
      redirect_to accounts_path
    else
      flash.now[:danger] = 'Something went wrong updating the user. Please try again.'
      edit_breadcrumbs
      render :edit
    end
  end

  def destroy
    @account = Account.find(params[:id])

    if @account.destroy
      flash[:success] = "Successfully deleted #{@account.name}'s account"
      redirect_to accounts_path
    else
      flash.now[:danger] = 'Something went wrong destroying the user. Please try again.'
      edit_breadcrumbs
      render :edit
    end
  end

  private

  def edit_breadcrumbs
    breadcrumbs.add 'Users', accounts_path
    # TODO: change once we have the concern/helper
    breadcrumbs.add @account.name if @account.name.present?
    breadcrumbs.add 'Edit'
  end

  def account_params
    params.expect(account: [:name, :email])
  end
end
