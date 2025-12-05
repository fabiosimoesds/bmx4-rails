require 'rails_helper'

feature 'Footer renders correctly for' do
  before do
    visit root_path
  end

  it 'renders correctly' do
    expect(page).to have_link 'Cookies Policy', href: '#'
    expect(page).to have_link 'Privacy Policy', href: '#'
    expect(page).to have_link 'Terms of Service', href: '#'
    expect(page).to have_link 'About BMX4', href: '#'
    expect(page).to have_link 'Contact Support', href: 'mailto:fabio@bmx4.com.br'
    expect(page).to have_content "© #{Time.new.year} BMX4 Technologies Ltd. All Rights Reserved."
  end
end
