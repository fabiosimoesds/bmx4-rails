import { Controller } from '@hotwired/stimulus'
import Pluralize from 'pluralize'

// To be re-used for selecting ranges between X & Y, and for filtering a variable between two values. From & To
// Example usage can be found in app/views/templates/base/partials/inputs/_slider_range.html.erb
// Based off: https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-case/

export default class extends Controller {
  static targets = [
    'rangeMin',
    'rangeMax', // actual type="range" inputs
    'valueFrom',
    'valueTo', // elements that display the current values
    'valueFromWord',
    'valueToWord', // used to pluralize the words (e.g. "1 night" vs "2 nights")
  ]

  rangeMinTargetConnected(target) {
    this.element.style.setProperty('--min', `${((target.value - target.min) / (target.max - target.min)) * 100}%`)
  }

  rangeMaxTargetConnected(target) {
    this.element.style.setProperty('--max', `${((target.value - target.min) / (target.max - target.min)) * 100}%`)
  }

  valueFromWordTargetConnected(target) {
    // if the "from" word has a target, pluralize it
    target.innerText = Pluralize(target.innerText, this.valueFromTarget.innerText)
  }

  valueToWordTargetConnected(target) {
    // if the "to" word has a target, pluralize it
    target.innerText = Pluralize(target.innerText, this.valueToTarget.innerText)
  }

  // update the current value of the "from" range input
  updateFromValue(event) {
    // set the --min style of the slider to the percent of off the from value,
    // so the background between the two thumbs is filled in
    this.element.style.setProperty('--min', this.calculatePercentOffset(event))

    // parse the string values to floats, so we can compare them
    let new_value = parseFloat(event.currentTarget.value)
    let to_value = parseFloat(this.rangeMaxTarget.value)

    // if the "from" value is greater than the "to" value
    if (new_value >= to_value) {
      // set the "to" value to the "from" value, so the user can keep on sliding above the "from" value
      this.rangeMaxTarget.value = new_value
      this.valueToTarget.innerText = new_value

      // set the --max style of the slider to the percent of off the "from" value
      this.element.style.setProperty('--max', this.calculatePercentOffset(event))
    }

    // update the "from" value displayed, and toLocaleString() so the value is formatted with commas
    this.valueFromTarget.innerText = new_value.toLocaleString()

    // if the "from" word has a target, pluralize it
    if (this.hasValueFromWordTarget) {
      this.valueFromWordTarget.innerText = Pluralize(this.valueFromWordTarget.innerText, new_value)
    }
  }

  // update the current value of the "to" range input
  updateToValue(event) {
    // set the --max style of the slider to the percent of off the to value,
    // so the background between the two thumbs is filled in
    this.element.style.setProperty('--max', this.calculatePercentOffset(event))

    // parse the string values to floats, so we can compare them
    let new_value = parseFloat(event.currentTarget.value)
    let from_value = parseFloat(this.rangeMinTarget.value)

    // if the "to" value is less than the "from" value
    if (new_value <= from_value) {
      // set the "from" value to the "to" value, so the user can keep on sliding below the "to" value
      this.rangeMinTarget.value = new_value
      this.valueFromTarget.innerText = new_value

      // set the --min style of the slider to the percent of off the "to" value
      this.element.style.setProperty('--min', this.calculatePercentOffset(event))
    }

    // update the "to" value displayed, and toLocaleString() so the value is formatted with commas
    this.valueToTarget.innerText = new_value.toLocaleString()

    // if the "to" word has a target, pluralize it
    if (this.hasValueToWordTarget) {
      this.valueToWordTarget.innerText = Pluralize(this.valueToWordTarget.innerText, new_value)
    }
  }

  // calculate the percent offset of the current value
  calculatePercentOffset(event) {
    return `${((event.currentTarget.value - event.currentTarget.min) / (event.currentTarget.max - event.currentTarget.min)) * 100}%`
  }
}
