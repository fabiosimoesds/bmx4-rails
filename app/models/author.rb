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
class Author < ApplicationRecord
  has_many :articles

  validates_presence_of :name
  validates :profile_image_url, url: true

  def profile_image
    self.profile_image_url || "#{Rails.application.routes.url_helpers.root_url}images/fs.jpeg"
  end
end
