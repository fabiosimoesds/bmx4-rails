import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['tab', 'body']

  // show correct tab section
  showSection(event) {
    // loops over all tab links to remove active class
    this.tabTargets.forEach((link) => {
      link.classList.remove('tab--active')
    })

    let clickedTab = this.tabTargets.find((link) => {
      return link.dataset.tabId === event.currentTarget.dataset.tabId
    })

    // adds active class to clicked link
    clickedTab.classList.add('tab--active')

    // loops over all section bodys and shows only if it's ID matches the ID of the clicked link
    this.bodyTargets.forEach((body) => {
      // if link.id and body.id match, then show the body
      if (clickedTab.dataset.tabId == body.id) {
        body.classList.remove('hidden')
      } else {
        body.classList.add('hidden')
      }
    })
  }
}
