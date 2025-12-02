class NestedUniquenessValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    if self.siblings(record).any? { |sibling| sibling.public_send(attribute) == value }
      record.errors.add(attribute, options[:message] || 'has already been taken')
    end
  end

  private

  def siblings(record)
    begin
      siblings = record.public_send(options[:parent]).public_send(sibling_accessor(record)).select { |s| !s.marked_for_destruction? }
    rescue NoMethodError
      raise 'The validation should implement the key `parent`, which returns the associated instance of the class which specifies `accepts_nested_attribute_for [child_class]`'
    end

    siblings - [record]
  end

  # Works out the method for accessing the collection of nested objects (children of the parent class) based on the record's class name
  def sibling_accessor(record)
    record.class.table_name
  end
end
