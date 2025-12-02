namespace :emails do
  desc 'displays all Athena emails'
  task create_screenshots: :environment do
    return unless Rails.env.development?

    account = Account.first

    object = Object.first

    # ? do all variable setting here if possible

    # ? Add the mailers in alphabetical order and the methods in the order they appear in the file
    # ** DEVISE & CUSTOM DEVISE MAILER **
    ResetPassword.with(account: account).deliver(account)
    MagicLinkSent.deliver(account)

    # ** ACCOUNT MAILER **
    WelcomeToApp.deliver(account)

    # ** MAILER **

    # ** BOUNCE MAILER **
    BounceMailer.with(recipient: account).inactive.deliver!

    # ** DOWNLOAD MAILER **
    DownloadMailer.success('subject', account).deliver!
    DownloadMailer.failure('subject', account).deliver!

    # ** IMPORT MAILER **
    ImportMailer.success('Test', Import.new(account: account, importer: object), 'testing').deliver!
    ImportMailer.failure('Test', Import.new(account: account, importer: object), 'testing', ['..ERROR..']).deliver!
  end
end
