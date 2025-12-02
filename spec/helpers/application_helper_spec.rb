require 'rails_helper'

RSpec.describe ApplicationHelper, type: :helper do
  context 'current year method' do
    it 'correctly returns the current year' do
      expect(helper.current_year).to eq(Date.current.year)
    end
  end

  it 'filter items returns correct checbox tag' do
    # rubocop:disable Layout/LineLength
    expect(helper.filter_check_box('q_state_in', 'active', 'Active')).to eq "<div class='control'><input type=\"checkbox\" name=\"q[q_state_in][]\" id=\"q_state_in_active\" value=\"active\" /><label class='boolean optional' for='q_state_in_active'>Active</label></div>"
    expect(helper.filter_check_box('q_state_null', 'active', 'Active', single: true)).to eq "<div class='control'><input type=\"checkbox\" name=\"q[q_state_null]\" id=\"q_state_null_active\" value=\"active\" /><label class='boolean optional' for='q_state_null_active'>Active</label></div>"
    # rubocop:enable Layout/LineLength
  end

  it 'upload_icon returns correct icon' do
    expect(helper.upload_icon('application/msword')).to eq tag.i class: 'far fa-2x fa-file-word'
    expect(helper.upload_icon('application/xls')).to eq tag.i class: 'far fa-2x fa-file-excel'
    expect(helper.upload_icon('application/pdf')).to eq tag.i class: 'far fa-2x fa-file-pdf'
    expect(helper.upload_icon('application/vnd.ms-powerpoint')).to eq tag.i class: 'far fa-2x fa-file-powerpoint'
    expect(helper.upload_icon('text/csv')).to eq tag.i class: 'far fa-2x fa-file-csv'
    expect(helper.upload_icon('application/octet-stream')).to eq tag.i class: 'far fa-2x fa-cube'
    expect(helper.upload_icon('')).to eq tag.i class: 'far fa-2x fa-file'
  end

  it 'lists error messages' do
    account = FactoryBot.build(:account, email: nil, password: nil)
    account.valid?

    # rubocop:disable Layout/LineLength
    expect(helper.list_errors_message(account, 'creating', 'account')).to eq "<div>Something went wrong creating the account. Please review the problems below: <ul class=\"my--0 ml--2 pl--6\"><li>Email can't be blank</li><li>Password can't be blank</li></ul></div>"
    # rubocop:enable Layout/LineLength
  end
end
