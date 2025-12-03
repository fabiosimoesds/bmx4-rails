class CreateContacts < ActiveRecord::Migration[8.0]
  def change
    create_table :contacts do |t|
      t.string :name
      t.string :email
      t.string :company
      t.string :phone
      t.string :message

      t.timestamps
    end
  end
end
