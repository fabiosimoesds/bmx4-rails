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
require 'rails_helper'

RSpec.describe Article, type: :model do
  context 'associations' do
    specify(:aggregate_failures) do
      is_expected.to belong_to(:author)
    end
  end

  context 'validations' do
    subject { FactoryBot.create(:article) }

    specify(:aggregate_failures) do
      is_expected.to validate_presence_of(:title)
      is_expected.to validate_presence_of(:summary)
      is_expected.to validate_presence_of(:content)
      is_expected.to validate_presence_of(:slug)
      is_expected.to validate_inclusion_of(:published).in_array([true, false])
      is_expected.to validate_length_of(:title).is_at_most(75)
      is_expected.to validate_length_of(:summary).is_at_most(160)

      is_expected.to allow_value('http://example.com').for(:thumbnail_image_url)
      is_expected.to allow_value('https://example.com').for(:thumbnail_image_url)
      is_expected.not_to allow_value('example.com').for(:thumbnail_image_url)

      # is_expected.to validate_uniqueness_of(:slug) callback ensures this always passes
    end
  end

  context 'methods' do
    it 'profile_image' do
      article = FactoryBot.build_stubbed(:article)

      expect(article.thumbnail_image).to eq('https://mmtm.io/articles/the-importance-of-a-cdn/hero.jpg')

      article.thumbnail_image_url = 'https://mmtm.io/articles/authors/fs.jpeg'
      expect(article.thumbnail_image).to eq('https://mmtm.io/articles/authors/fs.jpeg')
    end
  end

  context 'callbacks' do
    specify(:aggregate_failures) do
      is_expected.to callback(:set_slug).before(:validation)
    end

    it 'set_slug' do
      post_1 = FactoryBot.create(:article, title: '  1 ')

      expect(post_1.slug).to eq 'post-1'

      post_2 = FactoryBot.build_stubbed(:article, title: '  1 ')

      post_2.valid?
      expect(post_2.slug).to eq 'post-1-1'

      post_2.title = "\n 1 \n\n "
      post_2.valid?
      expect(post_2.slug).to eq 'post-1-1'

      post_2.title = 'x'
      post_2.valid?
      expect(post_2.slug).to eq 'x'

      post_2.published = true
      post_2.title = 'y'
      post_2.valid?
      expect(post_2.slug).to eq 'x'
    end
  end
end
