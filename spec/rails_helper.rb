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

# There is an ongoing issue with Chromedriver causing random spec failures. Adding "disable-backgrounding-occluded-windows --disable-features=VizDisplayCompositor" fixes most of the issues.
# https://www.reddit.com/r/rails/comments/1jhvq1j/cabybara_js_tests_randomly_failing_too_many_sleep/
# https://github.com/teamcapybara/capybara/issues/2800
Capybara.register_driver :custom_driver do |app|
  Capybara::Selenium::Driver.new(
    app,
    browser: :chrome,
    options: Selenium::WebDriver::Chrome::Options.new(
      args: %w(
        headless disable-gpu no-sandbox --window-size=1980,1024 --enable-features=NetworkService,NetworkServiceInProcess --disable-features=VizDisplayCompositor disable-backgrounding-occluded-windows
      ),
    )
  )
end

# Capybara.javascript_driver = :selenium_chrome_headless
Capybara.javascript_driver = :custom_driver
