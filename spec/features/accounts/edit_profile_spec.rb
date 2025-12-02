require 'rails_helper'

feature 'User arrives at their My Profile page' do
  before do
    @account = FactoryBot.create(:account)
    login_as(@account)

    visit edit_registrations_path
  end

  it 'and percy checks the page', js: true, only_percy: true do
    page.percy_snapshot('Accounts - My Profile')
  end

  it 'and updates their personal information correctly' do
    expect(page).to have_content 'Personal Information'
    expect(page).to have_content 'Manage the information associated with your account.'

    fill_in 'Full Name', with: 'Sue Grey'
    fill_in 'Email Address', with: 'sg@example.com'

    click_button 'Update Profile'

    expect(page).to have_content 'Successfully updated your profile'
    expect(current_path).to eq edit_registrations_path

    @account.reload
    expect(@account.name).to eq 'Sue Grey'
    expect(@account.email).to eq 'sg@example.com'
  end

  it 'and updates their password' do
    fill_in 'Current Password', with: 'Password12'
    fill_in 'New Password', with: 'Password123', match: :first
    fill_in 'New Password Confirmation', with: 'Password123'

    click_button 'Update Password'
    expect(page).to have_content 'Successfully updated your profile'
    expect(page).to have_current_path(edit_registrations_path)

    click_button 'Logout', match: :first

    fill_in 'Email Address', with: @account.email
    fill_in 'Password', with: 'Password123'
    click_button 'Log In'

    expect(page).to have_current_path admin_authenticated_root_path
  end
end
