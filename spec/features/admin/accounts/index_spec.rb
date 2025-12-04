require 'rails_helper'

feature 'User Management Index' do
  before do
    @account = FactoryBot.create(:account)

    login_as(@account)
    visit root_path
  end

  it 'renders correctly' do
    expect(current_path).to eq root_path
    expect(page).to have_content 'User Management'

    expect(page).to have_content 'Name'
    expect(page).to have_content 'Email'
    expect(page).to have_content 'Type'
    expect(page).to have_content 'Updated At'

    within('tbody') do
      expect(page).to have_content @account.name
      expect(page).to have_content @account.email
      expect(page).to have_content 'Admin'
      expect(page).to have_content I18n.l(@account.updated_at, format: :short)
    end
  end
end
