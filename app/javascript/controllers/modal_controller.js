import { Controller } from '@hotwired/stimulus'

/* Example:

<div class="modal-screen" data-controller="modal">
  <div class="modal-bg" data-action="click->modal#remove"></div>

  <div class="modal">
    <div class="modal__top">
      <div class="modal__title"></div>

      <a class="ml--4 font-size--3 link--brand cursor--pointer" data-action="click->modal#remove">
        <i class="fa-solid fa-sm fa-times"></i>
      </a>
    </div>

    <div class="modal__middle">
      Modal Content
    </div>

    <div class="modal__bottom">
      Buttons
    </div>
  </div>
</div>
*/

export default class extends Controller {
  connect() {
    if (this.element.classList.contains('modal-screen') && !this.element.classList.contains('display--none')) {
      // prevents background scrolling
      document.body.style.overflow = 'hidden'
    }
  }

  disconnect() {
    document.body.style.overflow = 'auto'
  }

  openModal(event) {
    document.getElementById(event.currentTarget.dataset.modalId).classList.remove('display--none')
  }

  toggleModal(event) {
    document.getElementById(event.currentTarget.dataset.modalId).classList.toggle('display--none')
  }

  remove() {
    this.element.remove()
  }

  removeFrame() {
    this.element.parentNode.remove()
  }
}
