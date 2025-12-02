Ransack.configure do |config|
  config.custom_arrows = {
    up_arrow: "<i class='fa-duotone fa-sort ml--1'></i>",
    down_arrow: "<i class='fa-duotone fa-sort fa-swap-opacity ml--1'></i>",
    default_arrow: "<i class='fa-duotone fa-sort ml--1' style='--fa-primary-opacity: 0.40'></i>"
  }

  config.postgres_fields_sort_option = :nulls_always_last
end
