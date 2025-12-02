require 'rails_helper'

feature 'user resets password' do
  before do
    @account = FactoryBot.create(:account)
    visit new_account_password_path
  end

  it 'and percy checks the page', js: true, only_percy: true do
    page.percy_snapshot('Onboarding - Password - New')
  end

  it 'sends reset password email and sets new password correctly' do
    expect(page).to have_content 'Reset Your Password'
    expect(page).to have_content "Enter your email, and we'll send you instructions on how to reset your password"

    fill_in 'Email Address', with: @account.email
    click_button 'Send Reset Instructions'
    expect(page).to have_content 'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.'

    open_email @account.email
    visit_in_email 'Change my password'

    expect(page).to have_content 'Change Your Password'
    expect(page).to have_content 'Create a new password for your account'
    expect(current_path).to eq edit_account_password_path

    fill_in 'New Password', with: 'Password123', match: :prefer_exact
    fill_in 'Confirm Password', with: 'Password123'
    click_button 'Change Password'

    expect(page).to have_content 'Your password has been changed successfully.'
  end

  it 'sets new password with incorrect complexity' do
    fill_in 'Email Address', with: @account.email
    click_button 'Send Reset Instructions'
    expect(page).to have_content 'If your email address exists in our database, you will receive a password recovery link at your email address in a few minutes.'

    open_email @account.email
    visit_in_email 'Change my password'

    fill_in 'New Password', with: 'Pass', match: :prefer_exact
    fill_in 'Confirm Password', with: 'Pass'
    click_button 'Change Password'

    expect(page).to have_content 'is too short (minimum is 8 characters)'
  end
end
