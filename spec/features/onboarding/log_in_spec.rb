require 'rails_helper'

feature 'user arrives at landing page' do
  before do
    @account = FactoryBot.create(:account)
    visit root_path
  end

  it 'and percy checks the page', js: true, only_percy: true do
    page.percy_snapshot('Onboarding - Log in')
  end

  it 'page renders correctly and logs in correctly' do
    expect(page).to have_content 'Log in to your account'
    expect(page).to have_content 'Enter your email address and password below to sign in'

    expect(page).to have_content 'Remember me'
    expect(page).to have_link 'Forgot your password?', href: new_account_password_path
    expect(page).to have_link 'Sign Up', href: '#'

    fill_in 'Email Address', with: @account.email
    fill_in 'Password', with: @account.password
    click_button 'Log In'

    expect(page).to have_current_path admin_authenticated_root_path
    expect(page).to have_content 'User Management'
  end

  it 'fails to log in' do
    fill_in 'Email Address', with: @account.email
    fill_in 'Password', with: 'Wrong Password'
    click_button 'Log In'

    expect(page).to have_content 'Invalid Email or password.'
  end
end
