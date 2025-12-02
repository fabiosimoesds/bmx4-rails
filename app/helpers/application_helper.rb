module ApplicationHelper
  include Pagy::Frontend

  def current_year
    Time.new.year
  end

  def filter_check_box(search, filter, name, single: false)
    tag = "<div class='control'>"
    tag << check_box_tag(
      single ? "q[#{search}]" : "q[#{search}][]",
      filter,
      (params.dig(:q)&.dig(search)&.include? filter.to_s) ? true : false,
      id: "#{search}_#{filter}"
    )
    tag << "<label class='boolean optional' for='#{search}_#{filter}'>#{name}</label></div>"

    tag.html_safe
  end

  def upload_icon(file_mime_type)
    case file_mime_type
    when 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      tag.i class: 'far fa-2x fa-file-word'
    when 'application/vnd.ms-excel', 'application/xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      tag.i class: 'far fa-2x fa-file-excel'
    when 'application/pdf'
      tag.i class: 'far fa-2x fa-file-pdf'
    when 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      tag.i class: 'far fa-2x fa-file-powerpoint'
    when 'text/csv'
      tag.i class: 'far fa-2x fa-file-csv'
    when 'application/octet-stream'
      tag.i class: 'far fa-2x fa-cube'
    else
      tag.i class: 'far fa-2x fa-file'
    end.html_safe
  end

  def list_errors_message(object, action, title)
    if object.errors.full_messages.any?
      # rubocop:disable Layout/LineLength
      "<div>Something went wrong #{action} the #{title}. Please review the problems below: <ul class=\"my--0 ml--2 pl--6\">#{object.errors.full_messages.collect { |error| "<li>#{error}</li>" }.join}</ul></div>".html_safe
      # rubocop:enable Layout/LineLength
    else
      "Something went wrong #{action} the #{title}."
    end
  end
end
