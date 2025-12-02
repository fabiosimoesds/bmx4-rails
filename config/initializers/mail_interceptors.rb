# class SandboxEmailInterceptor
#   def self.delivering_email(message)
#     message.to = message.to.select { |email| email.include?('thresholds.co.uk') || email.include?('mmtm.io') || (ENV.fetch("SEND_ADDRESSES") { '' }).split(',').include?(email) }
#
#     message.to = 'office@thresholds.co.uk' if message.to.blank?
#   end
# end
#
# if Rails.env.staging?
#   ActionMailer::Base.register_interceptor(SandboxEmailInterceptor)
# end

class MmtmTestingEmailInterceptor
  def self.delivering_email(message)
    message.to = 'developer.name@mmtm.io' # replace with the dev's email who is doing the testing
    message.cc = 'dev@mmtm.io'
    message.bcc = 'dev@mmtm.io'
  end
end

if Rails.env.development? && ActionMailer::Base.delivery_method == :postmark
  ActionMailer::Base.register_interceptor(MmtmTestingEmailInterceptor)
end
