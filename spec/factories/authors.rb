# == Schema Information
#
# Table name: authors
#
#  id                :bigint           not null, primary key
#  name              :string           not null
#  profile_image_url :string
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
FactoryBot.define do
  factory :author do
    sequence(:name) { |n| "Author #{n}" }
    # Change after Shrine implementation
    profile_image_url { "#{Rails.application.routes.url_helpers.root_url}spec/fixtures/images/author.jpeg" }
  end
end
