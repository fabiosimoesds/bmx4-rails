Sentry.init do |config|
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]

  config.traces_sample_rate = ENV.fetch('SENTRY_TRACES_SAMPLE_RATE', 0.05).to_f
  config.profiles_sample_rate = ENV.fetch('SENTRY_PROFILES_SAMPLE_RATE', 1.0).to_f

  config.enabled_environments = ['staging', 'production']
  config.dsn = Rails.application.credentials[Rails.env.to_sym][:sentry_dsn]
end
