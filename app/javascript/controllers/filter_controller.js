import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  connect() {
    // loops over filters and checks if any are active
    let controller = this
    document.querySelectorAll('.filter').forEach(function (filter) {
      controller.checkFilterState(filter)
    })
  }

  toggleFilterMenu(event) {
    // prevents the click triggering the outside click function
    event.stopPropagation()

    // closes datepicker if open
    document.querySelectorAll('.tempus-dominus-widget').forEach(function (datepicker) {
      datepicker.classList.remove('show')
    })

    // find the open filter
    let openFilter = this.element.querySelector('.filter__form.display--block')

    // closes all other filters
    document.querySelectorAll('.filter__form').forEach(function (filter) {
      filter.classList.remove('display--block')
    })

    // from the event target we find the current filter form
    let clickedFilter = event.target.closest('.filter').querySelector('.filter__form')

    // if open filter is not the current filter it doesn't toggle the class again
    if (openFilter != clickedFilter) {
      // toggles the filters filter form to show or hide
      clickedFilter.classList.toggle('display--block')
    }
  }

  closeOutside(event) {
    // finds the open menu
    let openFilter = this.element.querySelector('.filter__form.display--block')
    let openDatepicker = document.getElementsByClassName('tempus-dominus-widget')

    // returns if no open menu or click was on menu or inside it
    if (openFilter != null && (openFilter === event.target || openFilter.contains(event.target))) return

    // returns if either dropdown datepicker is clicked
    if (openDatepicker != null) {
      for (const datepicker of openDatepicker) {
        if (datepicker === event.target || datepicker.contains(event.target)) {
          if (event.target.classList.contains('day')) {
            datepicker.classList.remove('show')
          }
          return
        }
      }
    }

    // closes all menus
    document.querySelectorAll('.filter__form').forEach(function (filter) {
      filter.classList.remove('display--block')
    })
  }

  updateFilterState(event) {
    // takes the event and finds its filter to update the filter state
    let filter = event.target.closest('.filter')
    this.checkFilterState(filter)
  }

  checkFilterState(filter) {
    // loops over the filters inputs and sets state to true if any are selected
    let state = false

    filter.querySelectorAll('input', 'select', 'textarea').forEach(function (input) {
      if (input.type == 'checkbox') {
        if (input.checked) {
          state = true
        }
      } else if (input.type == 'select-multiple' || input.type == 'number' || input.type == 'text') {
        if (input.value.length > 0) {
          state = true
        }
      }
    })

    // updates filter name state if any active filters
    if (state) {
      filter.querySelector('.filter__name').classList.add('filter__name--active')
    } else {
      filter.querySelector('.filter__name').classList.remove('filter__name--active')
    }
  }
}
