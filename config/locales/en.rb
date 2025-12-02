{
  en: {
    time: {
      formats: {
        ordinalize_short: ->(time, **) { "%-d<sup>#{time.day.ordinal}</sup> %b %y" }, # 3<sup>rd</sup> Sep 22
        ordinalize_long: ->(time, **) { "%-d<sup>#{time.day.ordinal}</sup> %B %Y" }, # 18<sup>th</sup> September 2022
        ordinalize_long_with_time: ->(time, **) { "%-d<sup>#{time.day.ordinal}</sup> %B %Y at %-l:%M %P" }, # 18<sup>th</sup> September 2022 at 3:00 pm
      },
    },
  },
}
