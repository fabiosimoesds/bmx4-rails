import { Controller } from '@hotwired/stimulus'

/* Example:

<div data-controller="toast" data-toast-timeout-value="0" class="toast">
  <div class="toast__message">Toast Message</div>
  <i class="toast__close far fa-times" data-action="click->toast#remove"></i>
</div>
*/

export default class extends Controller {
  static values = { timeout: Number }

  connect() {
    if (this.timeoutValue > 0) {
      setTimeout(() => {
        this.remove()
      }, this.timeoutValue)
    }
  }

  remove() {
    this.element.remove()
  }
}
