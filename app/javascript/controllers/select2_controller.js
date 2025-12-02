import { Controller } from '@hotwired/stimulus'
require('select2')()

/*
Example:

<div data-controller="select2">
  <select data-select2-target="multi">
    <option value="1" selected>Text 1</option>
    <option value="2">Text 2</option>
    <option value="3">Text 3</option>
    <option value="4">Text 4</option>
    <option value="5">Text 5</option>
  </select>
</div>
*/
export default class extends Controller {
  static targets = ['single', 'multi']

  singleTargetConnected(target) {
    $(target)
      .select2({
        theme: 'flat',
        placeholder: 'Type to search...',
        width: '100%',
        allowClear: true,
      })
      .on('select2:open', () => {
        $('.select2-container--open .select2-search__field').last().get(0).focus()
      })
  }

  singleTargetDisconnected(target) {
    $(target).select2('destroy')
  }

  multiTargetConnected(target) {
    $(target).select2({
      theme: 'flat',
      placeholder: 'Type to search...',
      width: '100%',
      dropdownCssClass: 'select2--dynamic',
    })
  }

  multiTargetDisconnected(target) {
    $(target).select2('destroy')
  }
}
