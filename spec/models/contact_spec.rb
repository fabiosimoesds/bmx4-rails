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
require 'rails_helper'

RSpec.describe Contact, type: :model do
  context 'validations' do
    specify(:aggregate_failures) do
      is_expected.to validate_presence_of(:name)
      is_expected.to validate_presence_of(:company)
      is_expected.to validate_presence_of(:email)
      is_expected.to validate_presence_of(:message)
      is_expected.to validate_length_of(:message).is_at_most(1000)
      # personal_email format
      is_expected.to allow_value('test@example.com').for(:email)
      is_expected.not_to allow_value('example.com').for(:email)
    end
  end

  context 'callbacks' do
    specify(:aggregate_failures) do
      is_expected.to callback(:send_email).after(:create)
    end

    it 'send_email' do
      contact = FactoryBot.build(:contact)

      expect { contact }.not_to have_enqueued_job(ActionMailer::MailDeliveryJob)

      # Saving should trigger the callback and enqueue the job
      expect { contact.save }.to have_enqueued_job(ActionMailer::MailDeliveryJob)
    end
  end
end
