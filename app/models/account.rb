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
  devise :database_authenticatable, :invitable,
         :recoverable, :rememberable, :validatable, :masqueradable

  has_person_name

  ransacker :full_name do |parent|
    Arel::Nodes::NamedFunction.new('CONCAT_WS', [
      Arel::Nodes.build_quoted(' '), parent.table[:first_name], parent.table[:last_name],
    ])
  end

  def sentry_account_hash
    {
      id: self.id,
      name: self.name,
      email: self.email,
    }
  end

  def masqueradable?(current_account)
    true
  end
end
