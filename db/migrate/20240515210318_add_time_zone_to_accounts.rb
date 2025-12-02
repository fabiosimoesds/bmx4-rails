class AddTimeZoneToAccounts < ActiveRecord::Migration[7.1]
  def change
    add_column :accounts, :time_zone, :string, null: false, default: 'Europe/London'
  end
end
