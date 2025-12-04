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
class Article < ApplicationRecord
  belongs_to :author

  validates_presence_of :title, :summary, :content, :slug
  validates_inclusion_of :published, in: [true, false]
  validates_length_of :title, maximum: 75
  validates_length_of :summary, maximum: 160
  validates :thumbnail_image_url, url: true
  validates_uniqueness_of :slug

  before_validation :set_slug

  def thumbnail_image
    self.thumbnail_image_url || 'https://mmtm.io/articles/the-importance-of-a-cdn/hero.jpg'
  end

  def tags=(value)
    if value.is_a?(String)
      super(
        value.split(',')
          .map(&:strip) # remove leading/trailing spaces
          .compact_blank # drop empty strings
      )
    else
      super(value)
    end
  end

  private

  def set_slug
    if self.title.present? && (!self.published || self.slug.blank?)
      # first we check the title isn't just a number, if it is we add the word "post" so slugs dont conflict with ids
      base_slug = self.title.to_s.strip.match?(/\A\d+\z/) ? "post-#{self.title.parameterize}" : self.title.parameterize

      counter = nil
      # we then loop over checking the slug is unique and appending a number each time it isn't to generate the slug
      loop do
        self.slug = counter.nil? ? base_slug : "#{base_slug}-#{counter}"

        break unless Article.where.not(id: self.id).exists?(slug: self.slug)

        counter = counter.nil? ? 1 : counter + 1
      end
    end
  end
end
