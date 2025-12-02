require 'rails_helper'

feature 'View Public Error Pages' do
  it '400 renders correctly' do
    visit '/400'

    expect(page).to have_css '.error-modal__sidebar--400s'
    expect(page).to have_content '400'
    expect(page).to have_content 'Bad Request'
    expect(page).to have_content "Sorry, but we couldn't process your request. Something might be wrong with what you entered. Please check and try again."
    expect(page).to have_link 'Go Home', href: root_path
  end

  it '404 renders correctly' do
    visit '/404'

    expect(page).to have_css '.error-modal__sidebar--400s'
    expect(page).to have_content '404'
    expect(page).to have_content 'Page Not Found'
    # rubocop:disable Layout/LineLength
    expect(page).to have_content "Sorry but it looks like the page you were looking for doesn't exist. You may have mistyped the address or the page may have moved, or you may need to login to access the page."
    # rubocop:enable Layout/LineLength
    expect(page).to have_link 'Go Home', href: root_path
  end

  it '406 renders correctly' do
    visit '/406-unsupported-browser'

    expect(page).to have_css '.error-modal__sidebar--400s'
    expect(page).to have_content '406'
    expect(page).to have_content 'Unsupported Browser'
    expect(page).to have_content "Sorry, but we don't support your browser. Please try a different browser or upgrade your browser to the latest version."
    expect(page).to have_link 'Go Home', href: root_path
  end

  it '422 renders correctly' do
    visit '/422'

    expect(page).to have_css '.error-modal__sidebar--400s'
    expect(page).to have_content '422'
    expect(page).to have_content 'Change Rejected'
    expect(page).to have_content "The change you wanted was rejected. Maybe you tried to change something you didn't have access to."
    expect(page).to have_link 'Go Home', href: root_path
  end

  it '500 renders correctly' do
    visit '/500'

    expect(page).to have_css '.error-modal__sidebar--500s'
    expect(page).to have_content '500'
    expect(page).to have_content 'Something Went Wrong'
    expect(page).to have_content 'Sorry but it looks like something went wrong with your last request. Please try again or contact support.'
    expect(page).to have_link 'Go Home', href: root_path
  end
end
