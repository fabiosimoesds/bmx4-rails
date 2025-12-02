module SelectDateTime
  def select_date_and_time(date, options = {})
    field = options[:from]
    select date.strftime('%Y'), from: "#{field}_1i" # year
    select date.strftime('%B'), from: "#{field}_2i" # month
    select date.strftime('%-d'), from: "#{field}_3i" # day
    select date.strftime('%H'), from: "#{field}_4i" # hour
    select date.strftime('%M'), from: "#{field}_5i" # minute
  end

  def select_nested_date_and_time(date, options = {})
    field = options[:from]
    year = date.strftime('%Y')
    month = date.strftime('%-m')
    day = date.strftime('%-d')
    hour = date.strftime('%H')
    minute = date.strftime('%M')

    find(:css, ".#{field} .date__select:nth-child(1) select").find(:css, "option[value='#{year}']").select_option # year
    find(:css, ".#{field} .date__select:nth-child(2) select").find(:css, "option[value='#{month}']").select_option # month
    find(:css, ".#{field} .date__select:nth-child(3) select").find(:css, "option[value='#{day}']").select_option # day
    find(:css, ".#{field} .date__select:nth-child(4) select").find(:css, "option[value='#{hour}']").select_option # day
    find(:css, ".#{field} .date__select:nth-child(5) select").find(:css, "option[value='#{minute}']").select_option # day
  end

  def select_date(date, options = {})
    field = options[:from]
    select date.strftime('%Y'), from: "#{field}_1i" # year
    select date.strftime('%B'), from: "#{field}_2i" # month
    select date.strftime('%-d'), from: "#{field}_3i" # day
  end

  def select_month_year(date, options = {})
    field = options[:from]
    select date.strftime('%Y'), from: "#{field}_1i" # year
    select date.strftime('%B'), from: "#{field}_2i" # month
  end
end

RSpec.configure do |config|
  config.include SelectDateTime, type: :feature
end
