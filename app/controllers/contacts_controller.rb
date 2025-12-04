class ContactsController < ApplicationController
  layout 'application'

  def show
  end

  def create
    @contact = Contact.new(contact_params)

    if @contact.save
      @flash = { key: :success, message: 'Message was successfully sent.' }
    else
      @flash = { key: :danger, message: 'Something went wrong, sending your message.' }
    end

    # TODO switch to a turbo append

    flash.now[@flash[:key]] = @flash[:message]

    render :show, status: :unprocessable_entity
  end

  def contact_params
    params.expect(contact: [:name, :email, :company, :phone, :message])
  end
end
