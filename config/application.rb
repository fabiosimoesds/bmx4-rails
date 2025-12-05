require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

# TODO: change bmx4 to the actual app name
module BMX4Rails
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    # config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # add jumpstart configuration
    config.jumpstart = config_for(:jumpstart)

    config.to_prepare do
      Devise::Mailer.layout 'mailer'
    end

    config.action_mailer.postmark_settings = {
      # TODO on creation of a new project comment this out to create the new master key and credentials
      api_token: Rails.application.credentials[Rails.env.to_sym][:postmark_api_key]
    }

    config.action_mailer.deliver_later_queue_name = 'mailers'
  end
end
