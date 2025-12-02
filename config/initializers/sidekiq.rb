# this only comes into effect when the ENV uses Heroku Key-Value Store as it's Redis provisioner
if ENV['REDISCLOUD_URL'].nil?
  Sidekiq.configure_server do |config|
    config.redis = {
      url: ENV['REDIS_URL'],
      ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE },
    }
  end

  Sidekiq.configure_client do |config|
    config.redis = {
      url: ENV['REDIS_URL'],
      ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE },
    }
  end
end
