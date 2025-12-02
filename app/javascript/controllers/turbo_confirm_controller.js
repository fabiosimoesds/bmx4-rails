import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static values = {
    title: String,
    body: String,
    buttonText: String,
    alertStyle: { type: String, default: 'danger' },
  }

  connect() {
    this.generateDialog()
    this.setupDialog()
  }

  generateDialog() {
    const alert_icon =
      this.alertStyleValue === 'danger'
        ? `<i class="far fa-exclamation-triangle fa-2x color--danger-dark p--3 mb--5px"></i>`
        : this.alertStyleValue === 'success'
        ? `<i class="far fa-check fa-2x color--success-dark p--3"></i>`
        : null

    const dialogHTML = `<dialog id="turbo-confirm-dialog">
                          <div class="alert-screen" aria-dialog tabindex="-1">
                              <div class="alert-bg"></div>
                              <form method="dialog" class="alert-modal">
                                <div class="alert__main">
                                  <i data-behaviour="close" class="alert__close far fa-times"></i>

                                  <div class="display--flex align-items--center justify-content--center mb--5">
                                    <div class="alert__icon alert__icon--${this.alertStyleValue}">${alert_icon}</div>
                                  </div>
                                  <div class="text--center font-size--1">${this.titleValue}</div>
                                  <div class="text--center color--light">${this.bodyValue}</div>
                                </div>
                                <div class="alert__actions">
                                  <button value="close" class="button button--grey button--stroke">Cancel</button>
                                  <button value="confirm" class="button button--${this.alertStyleValue}">${this.buttonTextValue}</button>
                                </div>
                              </form>
                            </div>
                          </dialog>`

    document.body.insertAdjacentHTML('beforeend', dialogHTML)
    this.dialogElement = document.getElementById('turbo-confirm-dialog')

    this.dialogElement.querySelector('[data-behaviour="close"]').addEventListener('click', (event) => {
      this.dialogElement.close('cancel')
    })

    this.dialogElement.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.dialogElement.close('cancel')
      } else if (event.key === 'Enter') {
        this.dialogElement.returnValue = 'confirm'
        this.dialogElement.close('cancel')
      }
    })
  }

  setupDialog() {
    Turbo.setConfirmMethod(() => {
      this.dialogElement.showModal()

      return new Promise((resolve) => {
        this.dialogElement.addEventListener(
          'close',
          () => {
            resolve(this.dialogElement.returnValue === 'confirm')
          },
          { once: true },
        )
      })
    })

    this.dialogElement.focus()
  }
}
