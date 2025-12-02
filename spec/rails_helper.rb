# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../config/environment', __dir__)
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?

require 'rspec/rails'
require 'capybara/rspec'
require 'percy/capybara'
require 'email_spec'
require 'email_spec/rspec'
require 'aasm/rspec'
require 'test_prof/recipes/rspec/before_all'
require 'test_prof/recipes/rspec/factory_default'
require 'test_prof/recipes/rspec/sample'
require 'support/select_datetime'
require 'support/inline_jobs'
require 'support/perform_caching'
require 'sidekiq/testing'
require 'content_disposition'
require 'pundit/rspec'

begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  puts e.to_s.strip
  exit 1
end

RSpec.configure do |config|
  config.before(:each, type: :system) do
    driven_by :rack_test
  end

  config.before(:each, js: true) do
    Capybara.page.current_window.resize_to(1920, 1024)
  end

  config.include Warden::Test::Helpers
  config.fixture_paths = "#{::Rails.root}/spec/fixtures"
  config.example_status_persistence_file_path = 'spec/spec_results.txt'
  config.use_transactional_fixtures = true
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
  config.filter_run_excluding only_percy: true
end

Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end

Capybara.javascript_driver = :selenium_chrome_headless
