import { Controller } from '@hotwired/stimulus'

/** Example usage (FILTER SELECT OPTIONS):
 * <div data-controller="form">
 *   <select data-form-target="parentSelect" data-parent-id="client_project" data-action="change->form#updateChildOptions">
 *     <option value="1">Parent 1</option>
 *     <option value="2">Parent 2</option>
 *   </select>
 *
 *   <select data-form-target="childSelect parentSelect" data-child-id="client_project">
 *     <option value="1" data-selected-option-id="1">Child 1</option>
 *     <option value="2" data-selected-option-id="1">Child 2</option>
 *   </select>
 *
 * </div>
 * Show/hide childSelect options based on the parentSelect selected option
 **/

/** Example usage (TRANSFER DATA TO INPUT):
 * <div data-controller="form">
 *   <select id="client" class="select" data-show-hide-target="option" data-action="change->form#transferInfoToInput">
 *     <option value="netomnia" data-info="netomnia_admin@example.com, netomnia_commercial@example.com">Netomnia</option>
 *     <option value="fibrus" data-info="fibrus_admin@example.com, fibrus_commercial@example.com">Fibrus</option>
 *   </select>
 *
 *   <input class="string" type="text" value="" data-form-target="input"></input>
 * </div>
 **/

export default class extends Controller {
  static targets = ['parentSelect', 'childSelect', 'input']

  initialize() {
    this.parentInitialValues = {}
    this.childrenOptions = {}
  }

  // FILTER SELECT OPTIONS LOGIC
  parentSelectTargetConnected(target) {
    // build the initial selected options for the parents eg. { client_project: '1', project_layer: '3' }
    this.parentInitialValues[target.dataset.parentId] = target.selectedOptions[0].value
  }

  childSelectTargetConnected(target) {
    // build the initial options for the children eg. { client_project: [option_html_1, option_html_2], project_layer: [option_html_1, option_html_2] }
    this.childrenOptions[target.dataset.childId] = Array.from(target.options)
    const parent = this.element.querySelector(`[data-parent-id="${target.dataset.childId}"]`)
    this.filterOptions(target.dataset.childId, parent.selectedOptions[0].value)
  }

  updateChildOptions(event) {
    this.filterOptions(event.currentTarget.dataset.parentId, event.currentTarget.value)
  }

  filterOptions(parentId, selectedOptionId) {
    const children = this.element.querySelectorAll(`[data-child-id="${parentId}"]`)
    const parent = this.element.querySelector(`[data-parent-id="${parentId}"]`)

    children.forEach((child) => {
      this.childrenOptions[parentId].forEach((option) => {
        if (option.dataset.selectedOptionId === selectedOptionId || option.dataset.selectedOptionId === undefined) {
          child.insertAdjacentElement('beforeend', option)
        } else {
          if (parent.selectedOptions[0].value !== this.parentInitialValues[parentId]) {
            // Unset the selected option when we change parent. So any request are not automatically fired. [https://github.com/mmtmio/novonet-rails/pull/539]
            child.value = ''
          }

          // removes the option element from the DOM. Does not affect the initial array itself
          option.remove()
        }
      })
    })
  }

  // TRANSFER DATA TO INPUT LOGIC
  transferInfoToInput(event) {
    this.inputTarget.value = event.currentTarget.selectedOptions[0].dataset.info
  }
}
