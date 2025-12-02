import { Controller } from '@hotwired/stimulus'
import { TempusDominus, DateTime, extend } from '@eonasdan/tempus-dominus'
import { load } from '@eonasdan/tempus-dominus/dist/plugins/fa-five'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import customDateFormat from '@eonasdan/tempus-dominus/dist/plugins/customDateFormat'
extend(customDateFormat)
extend(load)

/** Example usage:
 * Example 1 - datetime
<div data-controller="datepicker">
  <input id="date_1" type="text" data-datepicker-target="datetime" autocomplete="off">
</div>
 *
 * Example 2 - date
<div data-controller="datepicker">
  <input id="date_2" type="text" data-datepicker-target="date" autocomplete="off">
</div>
 *
 * Example 3 - linked datetime
<div data-controller="datepicker">
  <input type="text" data-datepicker-target="datetimeLinked1" data-pair="1" data-duration="24" data-second-duration="36" autocomplete="off">
  <input type="text" data-datepicker-target="datetimeLinked2" data-pair="1" autocomplete="off">
  <input type="text" data-datepicker-target="datetimeLinked2" data-pair="1" data-duration-field="second-duration" autocomplete="off">
</div>
 */

export default class extends Controller {
  static targets = ['date', 'dateLinked1', 'dateLinked2', 'datetime', 'datetimeLinked1', 'datetimeLinked2', 'linkedListener']

  // Date Pickers
  dateTargetConnected(target) {
    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    this.setDateInput(target, unsetDefaultDate)
  }

  dateLinked1TargetConnected(target) {
    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    this.setDateInput(target, unsetDefaultDate)
  }

  dateLinked2TargetConnected(target) {
    dayjs.extend(customParseFormat)

    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    let linked2 = this.setDateInput(target, unsetDefaultDate)

    this.dateLinked1Targets.forEach((linked1) => {
      this.linkDatepickers(linked2, target, linked1)
    })
  }

  // Date & Time Pickers
  datetimeTargetConnected(target) {
    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    this.setDatetimeInput(target, unsetDefaultDate)
  }

  datetimeLinked1TargetConnected(target) {
    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    this.setDatetimeInput(target, unsetDefaultDate)
  }

  datetimeLinked2TargetConnected(target) {
    dayjs.extend(customParseFormat)

    let unsetDefaultDate = target.hasAttribute('data-default') && target.dataset.default == 'false'
    let linked2 = this.setDatetimeInput(target, unsetDefaultDate)

    this.datetimeLinked1Targets.forEach((linked1) => {
      this.linkDatepickers(linked2, target, linked1)
    })
  }

  setDateInput(target, unsetDefaultDate) {
    const hour = parseInt(target.dataset.hour ?? '0', 10)

    let options = {
      display: {
        components: {
          clock: false,
          hours: false,
          minutes: false,
          seconds: false,
        },
      },
      localization: {
        locale: 'en-GB',
        format: 'dd/MM/yyyy',
        startOfTheWeek: 1,
      },
      defaultDate: DateTime.convert(dayjs().startOf('day').add(hour, 'hours').toDate(), 'en-GB'),
    }

    if (unsetDefaultDate) {
      delete options.defaultDate
    }

    return new TempusDominus(target, options)
  }

  setDatetimeInput(target, unsetDefaultDate) {
    const hour = parseInt(target.dataset.hour ?? '0', 10)
    const minute = parseInt(target.dataset.minute ?? '0', 10)

    let options = {
      display: {
        viewMode: this.defaultViewValue,
      },
      localization: {
        locale: 'en-GB',
        hourCycle: 'h23',
        format: 'dd/MM/yyyy HH:mm',
        startOfTheWeek: 1,
      },
      defaultDate: DateTime.convert(dayjs().startOf('day').add(hour, 'hours').add(minute, 'minutes').toDate(), 'en-GB'),
    }

    if (target.hasAttribute('data-default-view')) {
      options.display = {
        viewMode: target.dataset.defaultView,
      }
    }

    if (unsetDefaultDate) {
      delete options.defaultDate
    }

    return new TempusDominus(target, options)
  }

  linkDatepickers(linked2, target, linked1) {
    if (linked1.dataset.pair === target.dataset.pair) {
      if (linked1.value != '') {
        linked2.updateOptions({
          restrictions: {
            minDate: linked1.value,
          },
        })
      }

      linked1.addEventListener('change.td', (e) => {
        this.setDurationEndInputs(linked2, target, linked1, e.detail.date)
      })
    }
  }

  setDurationEndInputs(linked2, target, datetime1, date) {
    linked2.updateOptions({
      restrictions: {
        minDate: date,
      },
    })

    // by default we use the data-duration field to set the end time of a linked datepicker
    // but we sometimes want to use another field i.e. 'facilitator-duration'
    // if no duration is provided, we don't set the second input
    let duration_field = 'duration'

    if (target.hasAttribute('data-duration-field')) {
      duration_field = target.dataset.durationField
    }

    if (datetime1.hasAttribute(`data-${duration_field}`)) {
      date = dayjs(date)
        .add(datetime1.getAttribute(`data-${duration_field}`), 'hours')
        .toDate()

      linked2.dates.setValue(DateTime.convert(date, 'en-GB'))
    }
  }
}
