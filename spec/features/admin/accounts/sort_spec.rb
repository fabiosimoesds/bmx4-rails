require 'rails_helper'

feature 'sorts accounts' do
  before do
    account = FactoryBot.create(:account, first_name: 'Account', last_name: 'A', updated_at: 1.day.ago)
    FactoryBot.create(:account, :other, first_name: 'Account', last_name: 'B', updated_at: 2.days.ago)

    login_as(account)
    visit root_path
  end

  it 'and percy checks the page', js: true, only_percy: true do
    page.percy_snapshot('Accounts - Index')
  end

  it 'correctly' do
    # Default full_name asc
    within('tbody') do
      within(:xpath, 'tr[1]') { expect(page).to have_content 'Account A' }
      within(:xpath, 'tr[2]') { expect(page).to have_content 'Account B' }
    end

    # full_name desc
    click_link 'Name'
    within('tbody') do
      within(:xpath, 'tr[1]') { expect(page).to have_content 'Account B' }
      within(:xpath, 'tr[2]') { expect(page).to have_content 'Account A' }
    end

    # updated_at desc
    click_link 'Updated At'
    within('tbody') do
      within(:xpath, 'tr[1]') { expect(page).to have_content 'Account A' }
      within(:xpath, 'tr[2]') { expect(page).to have_content 'Account B' }
    end

    # updated_at asc
    click_link 'Updated At'
    within('tbody') do
      within(:xpath, 'tr[1]') { expect(page).to have_content 'Account B' }
      within(:xpath, 'tr[2]') { expect(page).to have_content 'Account A' }
    end
  end
end
