require 'rails_helper'

feature 'Accounts Destroy' do
  before do
    admin = FactoryBot.create(:account)
    @other = FactoryBot.create(:account, :other)

    login_as(admin)
    visit edit_account_path(@other)
  end

  it 'Update account correctly', js: true do
    expect(Account.other.count).to eq 1

    click_button 'Delete User'

    within('.alert-screen') do
      click_button 'Delete User'
    end

    expect(page).to have_content "Successfully deleted #{@other.name}'s account"
    expect(current_path).to eq accounts_path
    expect(Account.other.count).to eq 0
  end
end
