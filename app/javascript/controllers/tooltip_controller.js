import { Controller } from '@hotwired/stimulus'
import tippy from 'tippy.js'

// Example usage:
// <div data-controller="tooltip" data-tooltip-content-value="Hello world"></div>

export default class extends Controller {
  static values = {
    content: String,
    placement: {
      type: String,
      default: 'top',
    },
  }

  connect() {
    this.tippy = tippy(this.element, {
      content: this.contentValue,
      placement: this.placementValue,
      delay: [200, 50],
      animation: 'fade',
    })
  }

  disconnect() {
    this.tippy.destroy()
  }
}
