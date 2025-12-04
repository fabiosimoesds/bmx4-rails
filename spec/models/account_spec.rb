# == Schema Information
#
# Table name: accounts
#
#  id                     :bigint           not null, primary key
#  accepted_terms_at      :datetime
#  account_type           :integer          default("admin"), not null
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  first_name             :string
#  invitation_accepted_at :datetime
#  invitation_created_at  :datetime
#  invitation_limit       :integer
#  invitation_sent_at     :datetime
#  invitation_token       :string
#  invitations_count      :integer          default(0)
#  invited_by_type        :string
#  last_name              :string
#  remember_created_at    :datetime
#  reset_password_sent_at :datetime
#  reset_password_token   :string
#  super_admin            :boolean          default(FALSE), not null
#  time_zone              :string           default("Europe/London"), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  invited_by_id          :bigint
#
# Indexes
#
#  index_accounts_on_email                 (email) UNIQUE
#  index_accounts_on_invitation_token      (invitation_token) UNIQUE
#  index_accounts_on_invited_by            (invited_by_type,invited_by_id)
#  index_accounts_on_invited_by_id         (invited_by_id)
#  index_accounts_on_reset_password_token  (reset_password_token) UNIQUE
#
require 'rails_helper'

RSpec.describe Account, type: :model do
  context 'validations' do
    specify(:aggregate_failures) do
      is_expected.to validate_presence_of(:email)
      is_expected.to validate_presence_of(:account_type)
      is_expected.to validate_presence_of(:time_zone)

      is_expected.to validate_inclusion_of(:time_zone).in_array(ActiveSupport::TimeZone::MAPPING.values)
    end

    it 'full_name using name_of_person' do
      account = FactoryBot.build_stubbed(:account, first_name: nil, last_name: nil)
      expect(account).not_to be_valid
      expect(account.errors[:name]).to eq ['first and last name required']

      account.name = 'Jeff'
      expect(account).not_to be_valid
      expect(account.errors[:name]).to eq ['last name is required']

      account.name = 'Jeff Simms'
      account.valid?
      expect(account).to be_valid
    end
  end

  context 'enums' do
    specify(:aggregate_failures) do
      is_expected.to define_enum_for(:account_type).with_values({ admin: 0 })
    end
  end

  context 'methods' do
    it 'sets raven user context correctly' do
      account = FactoryBot.build(:account)

      expect(Sentry.set_user(account.sentry_account_hash)).to eq({
        id: account.id,
        name: account.name,
        email: account.email,
      })
    end
  end
end
