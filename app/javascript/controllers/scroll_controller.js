import { Controller } from '@hotwired/stimulus'

/* Example:

<div data-controller="scroll">
  <div>content</div>
  <div>content</div>
  <div>content</div>
  <div data-scrolling-target="scrollEnd">content</div>
</div>
*/

export default class extends Controller {
  static targets = ['scrollEnd', 'smoothScrollEnd']

  scrollEndTargetConnected(target) {
    target.scrollIntoView()
  }

  smoothScrollEndTargetConnected(target) {
    target.scrollIntoView({
      behavior: 'smooth',
    })
  }
}
