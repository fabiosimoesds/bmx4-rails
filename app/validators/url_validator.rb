class UrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    record.errors.add(attribute, options[:message] || 'must be a valid URL, including http or https') unless url_valid?(value)
  end

  # a URL may be technically well-formed but may
  # not actually be valid, so this checks for both.
  # passes if no url received, use validate presence to check this instead.
  def url_valid?(url)
    if url.present?
      url = begin
              URI.parse(url)
            rescue
              false
            end

      url.is_a?(URI::HTTP) || url.is_a?(URI::HTTPS)
    else
      true
    end
  end
end
