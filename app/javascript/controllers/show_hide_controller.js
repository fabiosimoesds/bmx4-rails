import { Controller } from '@hotwired/stimulus'

// This is a generic controller to be re-used for simple show/hide toggling and radio actions
// Examples can be found in app/views/templates/base/partails/section/stimulus

// Certain functions are written to support multiple uses within the same controller on the page by using parent and child IDs:
// replaceObject (by using parent/child IDs)
// toggleObjects (by using parent/child IDs)
// toggleByBoolean (by using parent/child IDs)
// toggleByRadio (by using a list of the options rather than a parent/child ID like other targets)
// toggleByOption (by using a list of the options rather than a parent/child ID like other targets)
// toggleWithClass (by using parent/child IDs)
// switchClass (by using a switchId rather than a parent/child ID like other targets)
// toggleWithTimer (only focuses on itself anyway)

export default class extends Controller {
  static targets = ['replaceable', 'toggleable', 'boolean', 'booleanable', 'radio', 'radioable', 'option', 'optionable', 'classable', 'timed']

  connect() {
    if (this.hasToggleTarget) {
      this.toggleObjects()
    }

    if (this.hasBooleanTarget) {
      this.toggleByBoolean()
    }

    if (this.hasRadioTarget) {
      this.toggleByRadio()
    }

    if (this.hasOptionTarget) {
      this.toggleByOption()
    }

    if (this.hasTimedTarget) {
      this.toggleWithTimer()
    }
  }

  // hides the actionable and shows another target to "take it's place"
  replaceObject(event) {
    let parentId = event.currentTarget.dataset.parentId

    event.currentTarget.classList.add('display--none')
    this.replaceableTargets
      .filter((t) => t.dataset.childId === parentId)
      .forEach((object) => {
        object.classList.remove('display--none')
      })
  }

  // hides and shows targets when an actionable target is clicked
  // this can be used with multiple toggleable objects in a html controller by specifying data-toggle-id and data-toggleable-id
  toggleObjects(event) {
    let parentId = event.currentTarget.dataset.parentId

    if (parentId !== undefined) {
      this.toggleableTargets
        .filter((t) => t.dataset.childId === parentId)
        .forEach((object) => {
          object.classList.toggle('display--none')
        })
    } else {
      this.toggleableTargets.forEach((object) => {
        object.classList.toggle('display--none')
      })
    }
  }

  // hides and shows targets when a boolean target is (un)checked
  toggleByBoolean() {
    let parentId = this.booleanTarget.dataset.parentId

    if (parentId !== undefined) {
      let targets = this.booleanableTargets.filter((t) => t.dataset.childId === parentId)
      if (this.booleanTarget.checked) {
        targets.forEach((object) => {
          object.classList.remove('display--none')
        })
      } else {
        targets.forEach((object) => {
          object.classList.add('display--none')
        })
      }
    } else {
      if (this.booleanTarget.checked) {
        this.booleanableTargets.forEach((object) => {
          object.classList.remove('display--none')
        })
      } else {
        this.booleanableTargets.forEach((object) => {
          object.classList.add('display--none')
        })
      }
    }
  }

  // hides and shows targets when a radio's options is (un)checked
  toggleByRadio() {
    let selectedRadio = this.radioTarget.querySelector('input[type="radio"]:checked')

    if (selectedRadio !== null) {
      this.radioableTargets.forEach((element) => {
        let optionsArray = element.dataset.options.split(',')
        if (optionsArray.includes(selectedRadio.value)) {
          element.classList.remove('display--none')
        } else {
          element.classList.add('display--none')
        }
      })
    }
  }

  // hides and shows targets when a select's options is (un)selected
  toggleByOption() {
    let selected = this.optionTarget.selectedOptions[0].value

    this.optionableTargets.forEach((object) => {
      let optionsArray = object.dataset.options.split(',')
      if (optionsArray.includes(selected)) {
        object.classList.remove('display--none')
      } else {
        object.classList.add('display--none')
      }
    })
  }

  // add and remove a class to classable targets which can then affect them and their children
  toggleWithClass(event) {
    let toggleClass = event.currentTarget.dataset.class
    let parentId = event.currentTarget.dataset.parentId

    if (parentId !== undefined) {
      this.classableTargets
        .filter((t) => t.dataset.childId === parentId)
        .forEach((object) => {
          object.classList.toggle(`${toggleClass}`)
        })
    } else {
      this.classableTargets.forEach((object) => {
        object.classList.toggle(`${toggleClass}`)
      })
    }
  }

  // remove the switching class from all targets, then apply it to the originally clicked target
  // commonly used for tab clicking to remove the active link from any tabs and place it on the clicked tab
  switchClass(event) {
    let switchClass = event.currentTarget.dataset.class
    let switchId = event.currentTarget.dataset.switchId

    this.classableTargets
      .filter((t) => t.dataset.switchId === switchId)
      .forEach((object) => {
        object.classList.remove(switchClass)
      })

    event.currentTarget.classList.add(switchClass)
  }

  toggleWithTimer() {
    this.timedTargets.forEach((object) => {
      setTimeout(() => {
        object.classList.toggle('display--none')
      }, object.dataset.timeout || 10000) // fallback to 10 seconds
    })
  }
}
