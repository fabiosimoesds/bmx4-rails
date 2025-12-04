# == Schema Information
#
# Table name: articles
#
#  id                  :bigint           not null, primary key
#  content             :text             not null
#  posted_at           :datetime         not null
#  published           :boolean          default(FALSE), not null
#  slug                :string           not null
#  summary             :string           not null
#  tags                :string           default([]), not null, is an Array
#  thumbnail_image_url :string
#  title               :string           not null
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  author_id           :bigint           not null
#
# Indexes
#
#  index_articles_on_author_id  (author_id)
#  index_articles_on_slug       (slug) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (author_id => authors.id)
#
FactoryBot.define do
  factory :article do
    association :author

    posted_at { 1.day.ago }
    title { 'AI Tools We Actually Use (August 2025 Edition): Vibe Marketing' }
    summary { "Our tried and tested ChatGPT system to supercharge our company's marketing IQ has just got even better with GPT-5!" }
    content do
      <<~HTML
        <h2>Welcome to the Article</h2>
        <p>This article contains <strong>rich HTML</strong> content.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <p>End of content.</p>
      HTML
    end
    tags { ['AI', 'Productivity', 'Business Development', 'Office Life'] }
  end
end
