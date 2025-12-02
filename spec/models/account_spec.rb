# == Schema Information
#
# Table name: accounts
#
#  id                     :bigint           not null, primary key
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
  context 'methods' do
    it 'sets raven user context correctly' do
      account = FactoryBot.build(:account)

      expect(Sentry.set_user(account.sentry_account_hash)).to eq({
        id: account.id,
        name: account.name,
        email: account.email,
      })
    end

    it 'returns true if current_account can masquerade as account' do
      account = FactoryBot.build_stubbed(:account)

      expect(account.masqueradable?(account)).to eq true
    end
  end
end
