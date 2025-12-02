import { Controller } from '@hotwired/stimulus'
import jstimezonedetect from 'jstimezonedetect'

// Example:
// <input data-controller="timezone">

export default class extends Controller {
  connect() {
    this.element.value = jstimezonedetect.determine().name()
  }
}
