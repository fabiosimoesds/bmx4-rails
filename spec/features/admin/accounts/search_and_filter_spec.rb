require 'rails_helper'

feature 'search and filter user index' do
  before do
    @account_1 = FactoryBot.create(:account)
    @account_2 = FactoryBot.create(:account)

    login_as(@account_1)
    visit root_path
  end

  it 'search or filter' do
    expect(page).to have_content @account_1.name
    expect(page).to have_content @account_2.name

    # Search by Name
    fill_in 'Search by name or email...', with: @account_1.name
    find('.search__button').click

    within('tbody') do
      expect(page).to have_content @account_1.name

      expect(page).not_to have_content @account_2.name
    end

    # Search by email
    fill_in 'Search by name or email...', with: @account_2.email
    find('.search__button').click

    within('tbody') do
      expect(page).to have_content @account_2.name

      expect(page).not_to have_content @account_1.name
    end

    # Reset search
    fill_in 'Search by name or email...', with: ''
    find('.search__button').click

    expect(page).to have_content @account_1.name
    expect(page).to have_content @account_2.name

    # Filter by name
    within('.filters') do
      within('div.filter', text: 'Type') do
        check 'Admin'
      end
    end

    click_button 'Apply'

    within('tbody') do
      expect(page).to have_content @account_1.name
      expect(page).to have_content @account_2.name
    end
  end
end
