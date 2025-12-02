require 'rails_helper'

feature 'Header renders correctly for' do
  it 'admins' do
    account = FactoryBot.create(:account)

    login_as(account)
    visit root_path

    within('.main-navigation') do
      expect(page).to have_content account.name

      expect(page).to have_link 'Users', href: root_path
      expect(page).to have_link 'My Profile', href: edit_registrations_path
      expect(page).to have_button 'Logout'
    end
  end
end
