class FullNameValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    record.errors.add(attribute, (options[:message] || full_name?(record, value)[1])) unless full_name?(record, value)[0]
  end

  def full_name?(object, name)
    errors = [true, '']

    if name.blank?
      errors[1] = 'first and last name required'
    elsif object.last_name.blank?
      errors[1] = 'last name is required'
    elsif object.first_name.blank?
      errors[1] = 'first name is required'
    end

    if errors[1].present?
      errors[0] = false
    end

    errors
  end
end
