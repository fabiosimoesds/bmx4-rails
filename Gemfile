source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.4.7'

# Rails is a web-application framework that includes everything needed to create database-backed web applications [https://github.com/rails/rails]
# Always lock up to 2 minor versions of Rails. e.g. 8.0.1
gem 'rails', '~> 8.1.1'
# Use postgresql as the database for Active Record [https://github.com/ged/ruby-pg]
gem 'pg'
# Puma is a simple, fast, multi-threaded, and highly parallel HTTP 1.1 server for Ruby/Rack applications [https://puma.io/]
gem 'puma'
# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem 'jbuilder'
# Provides installers to get you going with the bundler of your choice in a new Rails application [https://github.com/rails/jsbundling-rails]
gem 'jsbundling-rails'
# Use PostCSS with Dart Sass from cssbundling-rails to bundle and process CSS [https://github.com/rails/cssbundling-rails]
gem 'cssbundling-rails'
# Use Redis adapter to run Action Cable in production
gem 'redis'
# Use Active Model has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Build a simple, robust and scalable authorization system [https://github.com/varvet/pundit]
gem 'pundit'
# A sampling call-stack profiler for Ruby. [https://github.com/tmm1/stackprof]
gem 'stackprof'
# Bad software is everywhere, and we're tired of it. Sentry is on a mission to help developers write better software faster [https://github.com/getsentry/sentry-ruby]
gem 'sentry-ruby'
gem 'sentry-rails'
gem 'sentry-sidekiq'
# Simple, efficient background processing for Ruby [https://github.com/mperham/sidekiq]
gem 'sidekiq'
gem 'sidekiq-failures'
# Reduces boot times through caching; required in config/boot.rb [https://github.com/Shopify/bootsnap]
gem 'bootsnap', '>= 1.4.4', require: false
# Catch unsafe migrations in development
gem 'strong_migrations'
# Run data migrations alongside schema migrations [https://github.com/ilyakatz/data-migrate]
gem 'data_migrate'

# Devise is a flexible authentication solution for Rails based on Warden [https://github.com/heartcombo/devise]
gem 'devise'

# The S3 storage handles uploads to AWS S3 service (or any s3-compatible service such as DigitalOcean Spaces or MinIO) [https://rubygems.org/gems/aws-sdk-s3]
gem 'aws-sdk-s3'
# A toolkit for handling file attachments in Ruby applications [https://shrinerb.com/]
gem 'shrine'
# Provides higher-level image processing helpers that are commonly needed when handling image uploads [https://github.com/janko/image_processing]
gem 'image_processing'

# A drop-in plug-in for ActionMailer to send emails via Postmark [https://github.com/ActiveCampaign/postmark-rails]
gem 'postmark-rails'
# A drop in solution for styling HTML emails with CSS without having to do the hard work yourself [https://github.com/fphilipe/premailer-rails]
gem 'premailer-rails'
# Provides Sprockets implementation for Rails 4.x (and beyond) Asset Pipeline. [https://github.com/rails/sprockets-rails]
gem 'sprockets-rails'
# Turbo-charged counter caches for your Rails app [https://github.com/magnusvk/counter_culture]
gem 'counter_culture'
# Help ActiveRecord::Enum feature to work fine with I18n and simple_form [https://github.com/zmbacker/enum_help]
gem 'enum_help'
# A library for adding finite state machines to Ruby classes [https://github.com/aasm/aasm]
gem 'aasm'

# Rails engine for static pages [http://thoughtbot.github.io/high_voltage/]
gem 'high_voltage'
# Turbo gives you the speed of a single-page web application without having to write any JavaScript [https://github.com/hotwired/turbo-rails]
gem 'turbo-rails'
# Stimulus is a JavaScript framework with modest ambitions [https://stimulus.hotwired.dev/]
gem 'stimulus-rails'
# Rails forms made easy. [https://github.com/heartcombo/simple_form]
gem 'simple_form'
# Pagination [https://github.com/ddnexus/pagy]
gem 'pagy'
# Smarter importing of CSV Files as Array(s) of Hashes, with optional features [https://github.com/tilo/smarter_csv]
gem 'smarter_csv'
# Breadcrumbs is a simple plugin that adds a breadcrumbs object to controllers and views. [https://github.com/fnando/breadcrumbs]
gem 'breadcrumbs'
# Ransack will help you easily add searching to your Rails application [https://activerecord-hackery.github.io/ransack/]
gem 'ransack'
# Cocoon makes it easier to handle nested forms [https://github.com/nathanvda/cocoon]
gem 'cocoon'
# Presenting names for English-language applications where a basic model of first and last name(s) combined is sufficient [https://github.com/basecamp/name_of_person]
gem 'name_of_person'
# Creates a link tag of the given name using a URL created by the set of options and checks if it matches the current controller/action [https://github.com/comfy/active_link_to]
gem 'active_link_to'
# Inline SVG file rendering for Rails applications [https://github.com/jamesmartin/inline_svg]
gem 'inline_svg'
# Act as list provides the capabilities for sorting and reordering a number of objects in a list [https://github.com/brendon/acts_as_list]
gem 'acts_as_list'
# Provides a complete interface to CSV files. No longer included in Ruby after 3.4 [https://github.com/ruby/csv]
gem 'csv'

group :development, :test do
  # A simple to use and feature rich debugger for Ruby [https://github.com/deivid-rodriguez/byebug]
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Helps you test web applications by simulating how a real user would interact with your app [https://github.com/teamcapybara/capybara]
  gem 'capybara'
  # Selenium implements the W3C WebDriver protocol to automate popular browsers used in specs [https://github.com/SeleniumHQ/selenium/wiki/Ruby-Bindings]
  gem 'selenium-webdriver'
  # Brings the RSpec testing framework to Ruby on Rails [https://github.com/rspec/rspec-rails]
  gem 'rspec-rails'
  # A test-double framework for rspec with support for method stubs, fakes, and message expectations [https://github.com/rspec/rspec-mocks]
  gem 'rspec-mocks'
  # Fixtures replacement with a straightforward definition syntax [https://github.com/thoughtbot/factory_bot_rails]
  gem 'factory_bot_rails'
  # RuboCop is a Ruby static code analyzer (a.k.a. linter) and code formatter [https://docs.rubocop.org/rubocop/1.44/index.html]
  gem 'rubocop'
  # Contains Airbnb's internally used configuration for RuboCop and RuboCop RSpec [https://github.com/airbnb/ruby/tree/master/rubocop-airbnb]
  gem 'rubocop-airbnb'
  # Code style checking for Rails RSpec files. [https://github.com/rubocop/rubocop-rspec_rails]Add commentMore actions
  gem 'rubocop-rspec_rails'
  # TestProf is a collection of different tools to analyse our test suite performance [https://test-prof.evilmartians.io/#/]
  gem 'test-prof'
  # ruby-prof is a profiler for MRI Ruby [https://ruby-prof.github.io/]
  gem 'ruby-prof'
end

group :development do
  # Web Console is a debugging tool for your Ruby on Rails applications [https://github.com/rails/web-console]
  gem 'web-console'
  # Display performance information such as SQL time and flame graphs for each request in your browser.
  gem 'rack-mini-profiler'
  # Listens to file modifications and notifies you about the changes [https://github.com/guard/listen]
  gem 'listen'
  # Spring speeds up development by keeping your application running in the background [https://github.com/rails/spring]
  gem 'spring'
  # Add a comment summarising the current schema to the top of each model [https://github.com/drwl/annotaterb]
  gem 'annotaterb'
  # Static analysis tool which checks Ruby on Rails applications for security vulnerabilities [https://brakemanscanner.org/]
  gem 'brakeman'
  # Avoid repeating yourself, use pry-rails instead of copying the initializer to every rails project [https://github.com/pry/pry-rails]
  gem 'pry-rails'
  # Allows you to automatically update all gems which pass your build in separate commits [https://github.com/thought-driven/bummr]
  gem 'bummr'
  # Multi-platform favicon for your Ruby on Rails project [https://github.com/RealFaviconGenerator/rails_real_favicon]
  gem 'rails_real_favicon'
  # Generate a diagram based on your application's Active Record models [http://voormedia.github.io/rails-erd/]
  gem 'rails-erd'
  # A tool to help lint your ERB or HTML files [https://github.com/Shopify/erb-lint]
  gem 'erb_lint'
  # Fast and powerful Git hooks manager for Node.js, Ruby or any other type of projects. [https://github.com/evilmartians/lefthook]
  gem 'lefthook'
  # Preview email in the default browser instead of sending it [https://github.com/ryanb/letter_opener]
  gem 'letter_opener'
  # Help you increase your application's performance by reducing the number of queries it makes [https://github.com/flyerhzm/bullet]
  gem 'bullet'
  # A library for generating fake data such as names, addresses, and phone numbers. [https://github.com/faker-ruby/faker]
  gem 'faker'
  # Automatically reload Hotwire Turbo when app files are modified [https://github.com/kirillplatonov/hotwire-livereload]
  gem 'hotwire-livereload'
  # Create View templates and bootstrap interfaces in HTML without ActionController's. A system for creating and making design decisions [https://github/Ancez/templates-rails]
  gem 'templates-rails'
end

group :test do
  # Provides RSpec- and Minitest-compatible one-liners to test common Rails functionality [https://matchers.shoulda.io/]
  gem 'shoulda-matchers'
  # Matchers to test before, after and around hooks [https://github.com/jdliss/shoulda-callback-matchers]
  gem 'shoulda-callback-matchers'
  # Percy visual testing for Ruby Selenium. [https://github.com/percy/percy-capybara]
  gem 'percy-capybara'
  # Matchers for RSpec, MiniTest and Cucumber steps to make testing emails go smoothly [https://github.com/email-spec/email-spec]
  gem 'email_spec'
  # select2 specs [https://github.com/Hirurg103/capybara_select2]
  gem 'capybara-select-2'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
