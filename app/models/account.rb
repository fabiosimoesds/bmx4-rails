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
class Account < ApplicationRecord
  devise :database_authenticatable, :rememberable, :validatable

  has_person_name

  # Email is validated in the devise validatable module if: :email_required? (which is true by default)
  validates_presence_of :time_zone, :account_type

  validates :name, full_name: true

  validates_inclusion_of :time_zone, in: ActiveSupport::TimeZone::MAPPING.values

  enum :account_type, { admin: 0 }

  ransacker :full_name do |parent|
    Arel::Nodes::InfixOperation.new('||',
      Arel::Nodes::InfixOperation.new('||',
        parent.table[:first_name], Arel::Nodes.build_quoted(' ')),
      parent.table[:last_name])
  end

  # rubocop:disable Airbnb/OptArgParameters
  def self.ransackable_attributes(auth_object = nil)
    ['id', 'full_name', 'first_name', 'last_name', 'email', 'updated_at', 'account_type']
  end

  def self.ransackable_associations(auth_object = nil)
    []
  end
  # rubocop:enable Airbnb/OptArgParameters

  def sentry_account_hash
    {
      id: self.id,
      name: self.name,
      email: self.email,
    }
  end
end
