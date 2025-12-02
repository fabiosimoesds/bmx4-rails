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
FactoryBot.define do
  factory :account do
    sequence(:email)        { |n| "account#{n}@example.com" }
    password                { 'Password12' }
    first_name              { 'Joe' }
    sequence(:last_name)    { |n| "Blogger#{n}" }
    invitation_accepted_at  { 1.day.ago }
    terms_of_service { true }
    accepted_terms_at { 1.day.ago }
  end
end
