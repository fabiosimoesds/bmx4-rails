# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)
#
# ** Set Inline Queue Adapter (therefore no need to run sidekiq) **
ActiveJob::Base.queue_adapter = :inline
ActionMailer::Base.delivery_method = :test
ActionMailer::Base.perform_deliveries = false

# Accounts
FactoryBot.create(:account, :admin, name: 'Joe Bloggs', email: 'admin@example.com')

3.times { FactoryBot.create(:account) }

puts "Seeded: Account(s) (#{Account.count})"

puts '---------------------------------------'
puts 'Seeding Finished. Checking Counters...'
puts '---------------------------------------'

puts "#{Account.count == 4 ? 'Correct' : 'Error'}: Account(s) (#{Account.count})"
