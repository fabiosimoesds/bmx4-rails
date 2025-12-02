require 'rails_helper'

feature 'user signs out of the app' do
  before do
    account = FactoryBot.create(:account)

    login_as(account)
    visit root_path
  end

  it 'via profile header' do
    click_button 'Logout', match: :first

    expect(current_path).to eq root_path
    expect(page).to have_content 'Log in to your account'
  end
end
