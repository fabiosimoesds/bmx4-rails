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
require 'rails_helper'

RSpec.describe Author, type: :model do
  context 'associations' do
    specify(:aggregate_failures) do
      is_expected.to have_many(:articles)
    end
  end

  context 'validations' do
    specify(:aggregate_failures) do
      is_expected.to validate_presence_of(:name)

      is_expected.to allow_value('http://example.com').for(:profile_image_url)
      is_expected.to allow_value('https://example.com').for(:profile_image_url)
      is_expected.not_to allow_value('example.com').for(:profile_image_url)
    end
  end

  context 'methods' do
    it 'profile_image' do
      author = FactoryBot.build_stubbed(:author, profile_image_url: nil)

      expect(author.profile_image).to eq('http://localhost:3000/images/fs.jpeg')

      author.profile_image_url = 'https://bmx4.com.br/articles/authors/fs.jpeg'
      expect(author.profile_image).to eq('https://bmx4.com.br/articles/authors/fs.jpeg')
    end
  end
end
