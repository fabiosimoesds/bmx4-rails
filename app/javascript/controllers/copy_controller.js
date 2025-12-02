import { Controller } from '@hotwired/stimulus'
import tippy from 'tippy.js'

// Example usage:
// <div data-controller="copy" data-copy-success-message-value="Success" data-copy-error-message-value="Error" data-copy-copyable-value="#"></div>

export default class extends Controller {
  static values = {
    successMessage: String,
    errorMessage: String,
    copyable: String,
  }

  tooltip(message) {
    tippy(this.element, {
      content: message,
      showOnCreate: true,
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
          controller.tooltip(controller.successMessage)
        },
        function () {
          controller.tooltip(controller.errorMessage)
        },
      )
    } else {
      navigator.clipboard.writeText(event.currentTarget.innerText).then(
        function () {
          controller.tooltip(controller.successMessage)
        },
        function () {
          controller.tooltip(controller.errorMessage)
        },
      )
    }
  }

  get successMessage() {
    return this.successMessageValue || 'Copied!'
  }

  get errorMessage() {
    return this.errorMessageValue || 'Failed!'
  }
}
