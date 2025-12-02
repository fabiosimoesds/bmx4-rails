import { Controller } from '@hotwired/stimulus'

/* Example:

<nav id="site-navigation" class="main-navigation" role="navigation" data-controller="menu" data-action="click@window->menu#closeOutside">
  <button class="menu-toggle hamburger hamburger--mobile-only hamburger--spin" type="button" data-action="click->menu#toggleHamburger">
    <span class="hamburger-box">
      <span class="hamburger-inner"></span>
    </span>
  </button>

  <ul id="primary-menu" class="menu">
    <li class="menu-item">
      <%= link_to 'Text', _path %>
    </li>

    <li class="menu-item menu-item--sub">
      <div class="primary-menu__link" data-action="click->menu#toggleSubMenu">
        Text 2<i class="ml--2 fa-solid fa-sm fa-chevron-down"></i>
      </div>

      <ul class="menu menu--sub">
        <li class="menu-item">
          <%= link_to 'Text 3', _path, class: 'primary-menu__link' %>
        </li>

        <li class="menu-item ">
          <%= link_to 'Text 4', _path, class: 'primary-menu__link' %>
        </li>
      </ul>
    </li>
  </ul>
</nav>
*/

export default class extends Controller {
  toggleHamburger(event) {
    // from the event target the js traverses up to .hamburger (it's fine if they click directly on then class)
    // it toggles .is-active on the hamburger and primary menu
    event.target.closest('.hamburger').classList.toggle('is-active')
    document.querySelector('#primary-menu').classList.toggle('is-active')
  }

  toggleSubMenu(event) {
    // prevents the click triggering the outside click function
    event.stopPropagation()

    // find the open menu
    let openMenu = this.element.querySelector('.menu--sub.display--block')

    // closes all sub menus and chevrons
    this.closeAllMenus()

    // from the event target we find the current sub menu
    let clickedMenu = event.target.closest('.menu-item--sub').querySelector('.menu--sub')
    // from the event target we find the current sub menu
    let clickedChevron = event.target.closest('.menu-item--sub').querySelector('.menu-item__chevron')

    // if open menu is not the current menu it doesn't toggle the class again
    if (openMenu != clickedMenu) {
      // toggles the sub menu to show or hide
      clickedMenu.classList.toggle('display--block')
      // toggles the chevron to open or close
      clickedChevron.classList.toggle('menu-item__chevron--open')
    }
  }

  toggleActionMenu(event) {
    // from the event target the js traverses up to .action-menu
    // it toggles .action-menu--show on the action menu
    let actionMenu = event.target.closest('.action-menu')

    // close all non-action menus
    this.closeAllMenus(actionMenu)

    // toggle the current menu
    actionMenu.classList.toggle('action-menu--show')
  }

  closeOutside(event) {
    // find the open menu within the element
    let openMenu = this.element.querySelector('.menu--sub.display--block, .menu-item__chevron.menu-item__chevron--open, .action-menu.action-menu--show')

    // break if 1. no open menu, or 2. click is on stimulus element (the container), or 3. click is in the dropdown menu
    // and if the click is not on a link or a button
    if ((openMenu == null || openMenu === event.target || openMenu.contains(event.target)) && !this.isElementALinkOrButton(event.target)) {
      return
    }

    // close current open menu
    this.closeAllMenus()
  }

  closeAllMenus(exceptFor) {
    document.querySelectorAll('.menu--sub, .menu-item__chevron, .action-menu').forEach((menu) => {
      if (menu !== exceptFor) {
        menu.classList.remove('display--block', 'menu-item__chevron--open', 'action-menu--show')
      }
    })
  }

  // checks if the element is a link or a form button or a child of a link or a form button
  isElementALinkOrButton(element) {
    return ['A', 'BUTTON'].includes(element.tagName) || element.closest('A') || element.closest('BUTTON')
  }
}
