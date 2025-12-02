Sentry.init do |config|
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  config.traces_sample_rate = 0.05
  config.profiles_sample_rate = 0.05
  config.enabled_environments = ['staging', 'production']
  config.dsn = Rails.application.credentials[Rails.env.to_sym][:sentry_dsn]
end
