module EmailsHelper
  def email_button(button_text, button_url, button_classes: nil)
    tag.table(class: 'table-button', cellpadding: '0', cellspacing: '0', role: 'presentation') do
      tag.tbody do
        tag.tr do
          tag.td do
            tag.table(width: '100%', cellpadding: '0', cellspacing: '0', role: 'presentation') do
              tag.tbody do
                tag.tr do
                  tag.td(class: "td-button #{button_classes}") do
                    link_to(button_url, target: :_blank, class: "button #{button_classes}", rel: :noopener) { button_text.html_safe }
                  end
                end
              end
            end
          end
        end
      end
    end
  end

  def two_email_buttons(button_one, button_two)
    tag.table(class: 'table-button', cellpadding: '0', cellspacing: '0', role: 'presentation') do
      tag.tbody do
        tag.tr do
          tag.td(style: 'padding-right: 0.25em') do
            tag.table(width: '100%', cellpadding: '0', cellspacing: '0', role: 'presentation') do
              tag.tbody do
                tag.tr do
                  tag.td(class: "td-button #{button_one[:button_classes]}") do
                    link_to(button_one[:button_url], target: :_blank, class: "button #{button_one[:button_classes]}", rel: :noopener) { button_one[:button_text].html_safe }
                  end
                end
              end
            end
          end +
          tag.td do
            tag.table(width: '100%', cellpadding: '0', cellspacing: '0', role: 'presentation') do
              tag.tbody do
                tag.tr do
                  tag.td(class: "td-button #{button_two[:button_classes]}") do
                    link_to(button_two[:button_url], target: :_blank, class: "button #{button_two[:button_classes]}", rel: :noopener) { button_two[:button_text].html_safe }
                  end
                end
              end
            end
          end
        end
      end
    end
  end
end
