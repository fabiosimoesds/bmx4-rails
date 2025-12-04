class ContactMailer < ApplicationMailer
  def contact_email(contact)
    @contact = contact

    mail(
      to: 'suporte@bmx4.com.br',
      subject: 'New Contact Form Submission'
    )
  end
end
