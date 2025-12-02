class AddColumnsToAccounts < ActiveRecord::Migration[8.0]
  def change
    add_column :accounts, :time_zone, :string, null: false, default: 'Europe/London'
    add_column :accounts, :accepted_terms_at, :datetime
    add_column :accounts, :account_type, :integer, null: false, default: 0
    add_column :accounts, :super_admin, :boolean, null: false, default: false
  end
end
