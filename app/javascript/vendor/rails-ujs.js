import Rails from '@rails/ujs'
Rails.start()

// Custom modals for confirm dialogs

// Cache a copy of the old Rails.confirm since we'll override it when the modal opens
const old_confirm = Rails.confirm

// Elements we want to listen to for data-confirm
const elements = ['a[data-confirm]', 'button[data-confirm]', 'input[type=submit][data-confirm]']

const createConfirmModal = (element) => {
  var id = 'confirm-modal-' + String(Math.random()).slice(2, -1)
  var confirm = element.dataset.confirm
  var subtext = element.dataset.subtext
  var alert_style = element.dataset.alertStyle
  var alert_icon = ''
  var turbo_frame_modal = document.querySelector('turbo-frame[id="modals"]')

  if (subtext === undefined) {
    subtext = ''
  }

  if (alert_style === undefined) {
    alert_style = 'danger'
  }

  if (alert_style === 'danger') {
    alert_icon = `<i class="fa-regular fa-exclamation-triangle fa-2x color--danger-dark p--3 mb--5px"></i>`
  } else if (alert_style === 'success') {
    alert_icon = `<i class="fa-regular fa-check fa-2x color--success-dark p--3"></i>`
  }

  var content = `<div class="alert-screen" aria-dialog tabindex="-1">
                  <div class="alert-bg"></div>
                  <div class="alert-modal">
                    <div class="alert__main">
                      <i data-behavior="close" class="alert__close fa-regular fa-times"></i>

                      <div class="display--flex align-items--center justify-content--center mb--5">
                        <div class="alert__icon alert__icon--${alert_style}">
                          ${alert_icon}
                        </div>
                      </div>

                      <div class="text--center font-size--1">${confirm}</div>
                      <div class="text--center color--light">${subtext}</div>
                    </div>

                    <div class="alert__actions">
                      <button data-behavior="cancel" class="button button--grey button--stroke">Cancel</button>
                      <button data-behavior="commit" class="button button--${alert_style}">Confirm</button>
                    </div>
                  </div>
                </div>`

  // if page has the turbo_frame for modal we attach the popup outside of the modal
  if (turbo_frame_modal == null) {
    document.body.insertAdjacentHTML('beforeend', content)
    var modal = document.body.lastElementChild
  } else {
    turbo_frame_modal.insertAdjacentHTML('afterend', content)
    var modal = turbo_frame_modal.nextElementSibling
  }

  element.dataset.confirmModal = `#${id}`

  modal.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      element.removeAttribute('data-confirm-modal')
      modal.remove()
    }
  })

  modal.querySelector("[data-behavior='close']").addEventListener('click', (event) => {
    event.preventDefault()
    element.removeAttribute('data-confirm-modal')
    modal.remove()
  })

  modal.querySelector("[data-behavior='cancel']").addEventListener('click', (event) => {
    event.preventDefault()
    element.removeAttribute('data-confirm-modal')
    modal.remove()
  })

  modal.querySelector("[data-behavior='commit']").addEventListener('click', (event) => {
    event.preventDefault()

    continueConfirm(modal, element)
  })

  modal.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      continueConfirm(modal, element)
      modal.remove()
    }
  })

  modal.focus()

  // prevents the event closing dropdown menus
  modal.addEventListener('click', (event) => {
    event.stopPropagation()
  })

  modal.focus()
  return modal
}

// Checks if confirm modal is open
const confirmModalOpen = (element) => {
  return !!element.dataset.confirmModal
}

const handleConfirm = (event) => {
  // If there is a modal open, let the second confirm click through
  if (confirmModalOpen(event.target)) {
    return true
  } else {
    // First click, we need to spawn the modal
    createConfirmModal(event.target)
    return false
  }
}

const continueConfirm = (modal, element) => {
  // Allow the confirm to go through
  Rails.confirm = () => {
    return true
  }

  // Click the link again
  element.click()

  // Remove the confirm attribute and modal
  element.removeAttribute('data-confirm-modal')
  Rails.confirm = old_confirm

  modal.remove()
}

// When a Rails confirm event fires, we'll handle it
Rails.delegate(document, elements.join(', '), 'confirm', handleConfirm)
