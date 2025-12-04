# == Schema Information
#
# Table name: contacts
#
#  id         :bigint           not null, primary key
#  company    :string
#  email      :string
#  message    :text
#  name       :string
#  phone      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Contact < ApplicationRecord
  validates_presence_of :name, :company, :email, :message
  validates_length_of :message, maximum: 1000
  validates_format_of :email, with: URI::MailTo::EMAIL_REGEXP

  after_create :send_email

  private

  def send_email
    ContactMailer.contact_email(self).deliver_later
  end
end
