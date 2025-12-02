require 'rails_helper'

feature 'Accounts Edit' do
  before do
    admin = FactoryBot.create(:account)
    @other = FactoryBot.create(:account, :other)

    login_as(admin)
    visit edit_account_path(@other)
  end

  it 'and percy checks the page', js: true, only_percy: true do
    page.percy_snapshot('Accounts - Edit')
  end

  it 'Update account correctly' do
    expect(page).to have_content 'Edit User'
    expect(page).to have_button 'Delete User'
    expect(page).to have_link "Log in as #{@other.first_name}" # masquerade_path is not accessible

    expect(page).to have_content 'User Information'
    expect(page).to have_content "Manage #{@other.first_name}'s personal information and contact details."

    fill_in 'Full Name', with: 'Other Name'
    fill_in 'Email Address', with: 'other.name@example.com'

    expect(page).to have_css('select[disabled]')

    click_button 'Update User'

    expect(current_path).to eq accounts_path
    expect(page).to have_content "Successfully updated Other Name's account"

    @other.reload
    expect(@other.name).to eq 'Other Name'
    expect(@other.email).to eq 'other.name@example.com'
  end
end
