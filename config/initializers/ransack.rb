Ransack.configure do |config|
  config.custom_arrows = {
    up_arrow: "<i class='fad fa-sort-up ml--1'></i>",
    down_arrow: "<i class='fad fa-sort-down ml--1'></i>",
    default_arrow: "<i class='fad fa-sort ml--1'></i>"
  }

  config.postgres_fields_sort_option = :nulls_always_last
end
