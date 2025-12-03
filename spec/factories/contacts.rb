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
FactoryBot.define do
  factory :contact do
    name { 'Jeremy Long' }
    email { 'jez@long.story' }
    company { 'Novel' }
    phone { '07776561892' }
    message { "I'd like to use your services to make my novel" }
  end
end
