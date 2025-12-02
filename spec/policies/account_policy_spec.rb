require 'rails_helper'

RSpec.describe AccountPolicy do
  subject { AccountPolicy }

  before_all do
    @account = FactoryBot.build_stubbed(:account)
  end

  permissions :masquerade? do
    it 'correctly authorizes accounts to masquerade' do
      expect(subject).not_to permit(@account, @account)
    end
  end
end
