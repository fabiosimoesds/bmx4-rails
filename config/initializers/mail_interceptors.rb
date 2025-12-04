# class SandboxEmailInterceptor
#   def self.delivering_email(message)
#     message.to = message.to.select { |email| email.include?('google.com') || email.include?('bmx4.com.br') || (ENV.fetch("SEND_ADDRESSES") { '' }).split(',').include?(email) }
#
#     message.to = 'office@bmx4.com.br' if message.to.blank?
#   end
# end
#
# if Rails.env.staging?
#   ActionMailer::Base.register_interceptor(SandboxEmailInterceptor)
# end

class Bmx4TestingEmailInterceptor
  def self.delivering_email(message)
    message.to = 'developer.name@bmx4.com.br' # replace with the dev's email who is doing the testing
    message.cc = 'dev@bmx4.com.br'
    message.bcc = 'dev@bmx4.com.br'
  end
end

if Rails.env.development? && ActionMailer::Base.delivery_method == :postmark
  ActionMailer::Base.register_interceptor(Bmx4TestingEmailInterceptor)
end
