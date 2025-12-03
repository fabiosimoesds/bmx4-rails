class ChangeMessageTypeForContacts < ActiveRecord::Migration[8.0]
  def change
    change_column :contacts, :message, :text
  end
end
