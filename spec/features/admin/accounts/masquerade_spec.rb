require 'rails_helper'

feature 'Admin masquerades' do
  before do
    @admin = FactoryBot.create(:account)
    @other = FactoryBot.create(:account, :other)

    login_as(@admin)
    visit edit_account_path(@other)
  end

  it 'as a Leader' do
    click_link "Log in as #{@other.first_name}"

    expect(page).to have_content "Logged in as #{@other.name}"
    expect(page).to have_content @other.name

    within('#masquerade-banner') do
      click_link 'Logout'
    end

    expect(page).to have_content @admin.name
  end
end
