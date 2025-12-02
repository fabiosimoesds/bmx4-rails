class ApplicationMailer < ActionMailer::Base
  prepend_view_path 'app/views/mailers' # Create mailer your template in this same path
  default from: 'from@example.com'
  layout 'mailer'
  helper(EmailsHelper)
end
