RSpec.configure do |config|
  config.around(:each, perform_caching: true) do |example|
    caching = ActionController::Base.perform_caching
    ActionController::Base.perform_caching = true
    example.run
    Rails.cache.clear
    ActionController::Base.perform_caching = caching
  end
end
