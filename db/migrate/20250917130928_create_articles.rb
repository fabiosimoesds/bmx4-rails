class CreateArticles < ActiveRecord::Migration[8.0]
  def change
    create_table :articles do |t|
      t.string   :title, null: false
      t.string   :summary, null: false
      t.string   :slug, null: false
      t.boolean  :published, null: false, default: false
      t.string   :tags, array: true, default: [], null: false
      t.text     :content, null: false
      t.string   :thumbnail_image_url
      t.datetime :posted_at, null: false

      t.timestamps
    end

    add_index :articles, :slug, unique: true
  end
end
