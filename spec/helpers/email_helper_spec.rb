require 'rails_helper'

RSpec.describe EmailsHelper, type: :helper do
  it 'correctly returns a single email button' do
    # rubocop:disable Layout/LineLength
    expect(helper.email_button('Click Me', 'https://www.example.com', button_classes: 'btn-primary')).to eq "<table class=\"table-button\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td class=\"td-button btn-primary\"><a target=\"_blank\" class=\"button btn-primary\" rel=\"noopener\" href=\"https://www.example.com\">Click Me</a></td></tr></tbody></table></td></tr></tbody></table>"
    # rubocop:enable Layout/LineLength
  end

  it 'correctly returns two email buttons' do
    # rubocop:disable Layout/LineLength
    expect(helper.two_email_buttons({ button_text: 'Log In', button_url: 'https://www.example.com', button_classes: '' },
                                    { button_text: 'Learn More', button_url: 'https://www.example.com', button_classes: 'button--stroke' })).to eq "<table class=\"table-button\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td style=\"padding-right: 0.25em\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td class=\"td-button \"><a target=\"_blank\" class=\"button \" rel=\"noopener\" href=\"https://www.example.com\">Log In</a></td></tr></tbody></table></td><td><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\"><tbody><tr><td class=\"td-button button--stroke\"><a target=\"_blank\" class=\"button button--stroke\" rel=\"noopener\" href=\"https://www.example.com\">Learn More</a></td></tr></tbody></table></td></tr></tbody></table>"
    # rubocop:enable Layout/LineLength
  end
end
