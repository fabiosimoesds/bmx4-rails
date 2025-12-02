import { Controller } from '@hotwired/stimulus'
import tippy from 'tippy.js'

// Example usage:
// <div data-controller="copy" data-copy-success-message-value="Success" data-copy-error-message-value="Error" data-copy-copyable-value="#"></div>

export default class extends Controller {
  static values = {
    successMessage: { type: String, default: 'Copied!' },
    errorMessage: { type: String, default: 'Failed!' },
    copyable: String,
    tippyOffset: { type: Array, default: [0, 10] },
  }

  tooltip(message) {
    tippy(this.element, {
      content: message,
      showOnCreate: true,
      offset: this.tippyOffsetValue,
      onHidden(instance) {
        instance.destroy()
      },
    })
  }

  toClipboard(event) {
    let controller = this
    if (this.copyableValue) {
      navigator.clipboard.writeText(this.copyableValue).then(
        function () {
          controller.tooltip(controller.successMessageValue)
        },
        function () {
          controller.tooltip(controller.errorMessageValue)
        },
      )
    } else {
      navigator.clipboard.writeText(event.currentTarget.innerText).then(
        function () {
          controller.tooltip(controller.successMessageValue)
        },
        function () {
          controller.tooltip(controller.errorMessageValue)
        },
      )
    }
  }
}
