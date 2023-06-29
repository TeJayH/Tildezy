// ==UserScript==
// @name          Tildezy
// @namespace     https://github.com/TeJayH/Tildezy/
// @version       1.3.0
// @description   Adds some extra functionality to http://tildes.net/
// @author        TeJay (https://github.com/TeJayH)
// @match         *://*.tildes.net/*
// @icon          https://www.google.com/s2/favicons?sz=64&domain=tildes.net
// @supportURL    https://github.com/TeJayH/Tildezy/issues◘
// @license       GPL-3.0
// @grant         GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @downloadURL   https://raw.githubusercontent.com/TeJayH/Tildezy/main/Tildezy.user.js
// @updateURL     https://raw.githubusercontent.com/TeJayH/Tildezy/main/Tildezy.user.js
// ==/UserScript==
// ^ Feel free to remove downloadURL and updateURL to disable automatic updates, some people like them, some hate them
// The script loaders generally show you any changes when you update but it's still technically a little dangerous if you're not going to check each update
// I don't expect this to get tons of updates so you really do not *need* it.

// ESLint nonsense.
/* global GM_getValue */
/* global GM_setValue */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-case-declarations */
/* eslint-disable eqeqeq */

// ---------------- Toggles ----------------
// Gets values from storage if they exist, else sets everything to true, enabling all functiosn of script.
const toggleNewTabComments = GM_getValue('toggleNewTabComments', true)
const toggleUserColors = GM_getValue('toggleUserColors', true)
const toggleCommentCollapser = GM_getValue('toggleCommentCollapser', true)
const toggleScrollToTopButton = GM_getValue('toggleScrollToTopButton', true)
const toggleGroupStars = GM_getValue('toggleGroupStars', true)
const toggleCommentTraveller = GM_getValue('toggleCommentTraveller', true)
const toggleMarkdownButtons = GM_getValue('toggleMarkdownButtons', true)
const toggleSettings = GM_getValue('toggleSettings', true)

/* Manual overrides if you dont want the settings button
const toggleNewTabComments = true;
const toggleUserColors = true;
const toggleCommentCollapser = true;
const toggleScrollToTopButton = true;
const toggleGroupStars = true;
const toggleCommentTraveller = true;
const toggleMarkdownButtons = true;
const toggleSettings = true;
*/

// ---------------- Color Users ----------------
// Function to generate a random color based on hashed username
// Ensures whenever you see a user they consistently have the same color. Also makes sure color is not too bright or dark to read.
function getConsistentColor (username) {
  let hash = 0
  if (username.startsWith('@')) {
    username = username.substring(1) // Remove the '@' symbol from the hash for consistent coloring.
  }
  if (username.startsWith('/u/')) {
    username = username.substring(3) // Remove the '/u/' symbol from the hash for consistent coloring.
  }

  // Calculate a hash value of the username
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
    hash ^= 0xFFFFAA
    hash |= 0
  }

  // Convert the hash value to RGB values
  const r = ((hash & 0xFF0000) >> 16)
  const g = ((hash & 0x00FF00) >> 8)
  const b = ((hash & 0x0000FF) >> 0)

  // Convert RGB values to hexadecimal color code
  const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

  // Calculate brightness with magic math.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const darkness = (r + g + b) / 3

  // Check if the brightness or darkness is out of the desired range
  // Adjust the values however you want, if you make the possible range too small you may near infinite loop while it tries over and over to generate colors for people
  const brightnessThreshold = 200
  const darknessThreshold = 50
  if (brightness > brightnessThreshold || darkness < darknessThreshold || brightness < darknessThreshold) {
    // Append an underscore to the username and recursively call the function again to generate a fresh color
    username += '_'
    return getConsistentColor(username)
  }
  return color
}

// function to loop the usernames on the page, compileing names into maps then applies color to those maps.
// Idea behind the mapping is that coloring all of a users comments at once skips the need to hash their name and calculate the color over and over, should be more efficient, but I'm dumb so who knows.
function applyConsistentColorToUserNames () {
  const userLinks = document.getElementsByClassName('link-user')
  const userMap = {}

  for (let i = 0; i < userLinks.length; i++) {
    const link = userLinks[i]
    const username = link.textContent
    if (!userMap.hasOwnProperty(username)) {
      userMap[username] = []
    }
    userMap[username].push(link)
  }

  // Apply consistent color to all instances of each username
  for (const username in userMap) {
    if (userMap.hasOwnProperty(username)) {
      const color = getConsistentColor(username)
      const userInstances = userMap[username]
      for (let i = 0; i < userInstances.length; i++) {
        const link = userInstances[i]
        link.style.color = color
      }
    }
  }
}

// ---------------- Comment Collapse ----------------

// Function to toggle collapse a comment
function toggleCommentCollapse (event) {
  event.stopPropagation()
  const comment = event.target.closest('.comment')
  comment.classList.toggle('is-comment-collapsed')
  if (window.getSelection) {
    window.getSelection().removeAllRanges() // Clears selection that happens if your triple click is on text.
  } else if (document.selection) {
    document.selection.empty()
  }
}

// Function to handle click event on comments (to trigger the collapse)
function handleCommentClicks (event) {
  if (event.detail === 3) { // Change amount of clicks required to toggle a comment 3 because you sometimes doubleclick a word to select it for copying
    toggleCommentCollapse(event)
  }
}

if (toggleCommentCollapser) {
  const commentsContainer = document.querySelector('#comments')
  if (commentsContainer) {
    commentsContainer.addEventListener('click', (event) => {
      const target = event.target
      const isCommentHeader = target.matches('.comment-header')
      const isCommentText = target.matches('.comment-text')
      if (isCommentHeader || isCommentText || target.closest('.comment-header') || target.closest('.comment-text')) {
        handleCommentClicks(event)
      }
    })
  }
}

// ---------------- Group Stars ----------------
// Function to handle clicking on a star
function handleStarClick (event) {
  event.preventDefault()
  event.stopPropagation()
  const starElement = event.target
  const groupLink = starElement.nextSibling
  if (groupLink) {
    const groupName = groupLink.getAttribute('href')
    const starredGroups = GM_getValue('starredGroups', [])
    if (!starredGroups.includes(groupName)) {
      // Group is not starred, add it
      starredGroups.push(groupName)
      starredGroups.sort() // Sort alphabetically
      GM_setValue('starredGroups', starredGroups)
      starElement.textContent = '★'
      starElement.style.color = 'yellow'
    } else {
      // Group is already starred, remove it
      const index = starredGroups.indexOf(groupName)
      if (index !== -1) {
        starredGroups.splice(index, 1)
        GM_setValue('starredGroups', starredGroups)
      }
      starElement.textContent = '☆'
      starElement.style.color = ''
    }
    rearrangeGroupLinks()
  }
}

// Function to check if a group is starred
function isGroupStarred (groupName) {
  const starredGroups = GM_getValue('starredGroups', [])
  return starredGroups.includes(groupName)
}

// Function to rearrange group links based on star status
function rearrangeGroupLinks () {
  const groupContainer = document.querySelector('.nav-group-list')
  if (groupContainer) {
    const groupLinks = Array.from(groupContainer.querySelectorAll('li'))
    const starredGroups = []
    const unstarredGroups = []

    groupLinks.forEach((groupItem) => {
      const groupLink = groupItem.querySelector('.link-group')
      const groupName = groupLink.getAttribute('href')
      const isStarred = isGroupStarred(groupName)

      if (isStarred) {
        starredGroups.push(groupItem)
      } else {
        unstarredGroups.push(groupItem)
      }
    })

    starredGroups.sort((a, b) => {
      const groupNameA = a.querySelector('.link-group').getAttribute('href').toLowerCase()
      const groupNameB = b.querySelector('.link-group').getAttribute('href').toLowerCase()
      if (groupNameA < groupNameB) return -1
      if (groupNameA > groupNameB) return 1
      return 0
    })

    unstarredGroups.sort((a, b) => {
      const groupNameA = a.querySelector('.link-group').getAttribute('href').toLowerCase()
      const groupNameB = b.querySelector('.link-group').getAttribute('href').toLowerCase()
      if (groupNameA < groupNameB) return -1
      if (groupNameA > groupNameB) return 1
      return 0
    })

    groupLinks.forEach((groupItem) => {
      groupItem.parentNode.removeChild(groupItem)
    })

    starredGroups.forEach((groupItem) => {
      groupContainer.appendChild(groupItem)
    })

    unstarredGroups.forEach((groupItem) => {
      groupContainer.appendChild(groupItem)
    })
  }
}

// Function to add clickable stars to the group links
function addGroupStars () {
  const groupItems = document.querySelectorAll('.nav-item')
  Array.from(groupItems).forEach((groupItem) => {
    const groupLink = groupItem.querySelector('.link-group')
    if (groupLink) { // Avoids a null when logged in.
      const groupName = groupLink.getAttribute('href')
      const isStarred = isGroupStarred(groupName)
      const starElement = document.createElement('span')
      starElement.classList.add('star')
      starElement.style.cursor = 'pointer'
      starElement.textContent = isStarred ? '★' : '☆'
      starElement.addEventListener('click', handleStarClick)
      starElement.style.color = isStarred ? 'yellow' : ''
      groupItem.insertBefore(starElement, groupLink)
    }
  })
  // Sort the group list
  sortGroupList()
}

// Function to sort the group list first based on starred status and then alphabetically
// Actual magic btw, sorting hurts my brain
function sortGroupList () {
  const groupList = document.querySelector('.nav-group-list')
  if (!groupList) {
    return
  }
  const groupItems = Array.from(groupList.children)

  groupItems.sort((a, b) => {
    const aIsStarred = a.querySelector('.star').textContent === '★'
    const bIsStarred = b.querySelector('.star').textContent === '★'
    const aText = a.querySelector('.link-group').textContent.toLowerCase()
    const bText = b.querySelector('.link-group').textContent.toLowerCase()

    if (aIsStarred && !bIsStarred) {
      return -1
    } else if (!aIsStarred && bIsStarred) {
      return 1
    } else {
      return aText.localeCompare(bText)
    }
  })
  groupItems.forEach((item) => groupList.appendChild(item))
}

// ---------------- New Tab Comments button ----------------
// I know Tildes supports this out of bos for logged in users now, but people with accounts can't access that function
// so I am leaving this as a feature, for anyone who like me, used Tildes before they could get an account.
if (toggleNewTabComments) {
  document.querySelectorAll('span').forEach(function (span) {
    if (span.innerText.toLowerCase().includes('comment')) {
      const anchor = span.closest('a')
      if (anchor) {
        anchor.addEventListener('click', function (event) {
          event.preventDefault()
          window.open(this.href, '_blank')
        })
      }
    }
  })
}

// ---------------- Scroll to top ----------------
// Function to scroll to the top of the page
// V2.0 now, looks better, easier to find, shiny
function scrollToTop () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Function to add a scroll-to-top button
function addScrollToTopButton (homeButton) {
  const btnGroup = document.querySelector('.btn-group')
  setupButton(homeButton, '⌂', scrollToTop)
  homeButton.classList.add('btn', 'btn-sm', 'btn-light')
  homeButton.style.fontSize = '0.6rem'
  homeButton.style.color = 'var(--foreground-secondary-color)'
  homeButton.title = 'Return to Top'
  try {
    btnGroup.appendChild(homeButton)
  } catch (err) {
    // No btnGroup
  }
}

// ---------------- Settings ----------------
// Probably a million ways to do this way better but I'm trash when html and css enter the mix.
function addSettingsButton () {
  // Create the settings button
  const settingsButton = document.createElement('button')
  settingsButton.className = 'btn btn-sm btn-link site-header-settings-button'
  settingsButton.innerText = 'Tildezy Settings'
  settingsButton.title = 'Click to open settings'
  settingsButton.style.float = 'right'

  // Create the settings dropdown container
  const settingsDropdownContainer = document.createElement('div')
  settingsDropdownContainer.className = 'site-header-settings-dropdown'
  settingsDropdownContainer.style.position = 'relative'
  settingsDropdownContainer.style.float = 'right'
  settingsDropdownContainer.style.paddingTop = '25px'

  // Create the settings dropdown content
  const settingsDropdownContent = document.createElement('div')
  settingsDropdownContent.className = 'dropdown-content'
  settingsDropdownContent.style.display = 'none' // Hide the dropdown by default
  settingsDropdownContent.style.position = 'absolute'
  settingsDropdownContent.style.backgroundColor = 'var(--background-secondary-color)'
  settingsDropdownContent.style.padding = '10px'
  settingsDropdownContent.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
  settingsDropdownContent.style.zIndex = '999'
  settingsDropdownContent.style.whiteSpace = 'nowrap'
  settingsDropdownContent.style.right = '0'
  settingsDropdownContent.style.maxWidth = '50vw'
  settingsDropdownContent.style.overflowX = 'hidden'

  // Create checkboxes for each setting
  const settingsCheckboxes = [{
    setting: 'toggleNewTabComments',
    label: 'Toggle New Tab Comments',
    description: 'Clicking on the comments of a post opens in a new tab, rather than opening in the current tab.'
  },
  {
    setting: 'toggleUserColors',
    label: 'Toggle User Colors',
    description: 'Applies a random color to every user based on their username to help distinguish people at a glance.'
  },
  {
    setting: 'toggleCommentCollapser',
    label: 'Toggle Comment Collapser',
    description: 'Collape a comment tree by triple clicking.'
  },
  {
    setting: 'toggleScrollToTopButton',
    label: 'Toggle Scroll to Top Button',
    description: 'Adds an up arrow at the bottom of the the page that sends you back to the top of the page.'
  },
  {
    setting: 'toggleGroupStars',
    label: 'Toggle Group Stars',
    description: 'Allows you to star groups, making them show at the top of the list for ease of access.'
  },
  {
    setting: 'toggleCommentTraveller',
    label: 'Toggle New Comment Traveller',
    description: 'Allows you to jump between new comments in a page, via two buttons.'
  },
  {
    setting: 'toggleMarkdownButtons',
    label: 'Toggle Markdown Buttons',
    description: 'Adds buttons below the comment box to automatically add markdown.'
  }
  ]

  settingsCheckboxes.forEach(({
    setting,
    label,
    description
  }) => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = setting
    checkbox.checked = GM_getValue(setting, true)

    const checkboxLabel = document.createElement('label')
    checkboxLabel.htmlFor = setting
    checkboxLabel.textContent = label
    checkboxLabel.title = description

    // Add event listener to store the checkbox value when it's changed
    checkbox.addEventListener('change', function () {
      GM_setValue(setting, this.checked)
    })
    settingsDropdownContent.appendChild(checkbox)
    settingsDropdownContent.appendChild(checkboxLabel)
    settingsDropdownContent.appendChild(document.createElement('br'))
  })

  // Create the apply button
  const applyButton = document.createElement('button')
  applyButton.innerText = 'Apply'
  applyButton.title = 'Click to apply settings (reloads page)'
  applyButton.addEventListener('click', function () {
    location.reload()
  })

  settingsDropdownContent.appendChild(applyButton)
  settingsDropdownContainer.appendChild(settingsDropdownContent)

  // Toggle the visibility of the dropdown content when the button is clicked
  settingsButton.addEventListener('click', function () {
    if (settingsDropdownContent.style.display === 'none') {
      settingsDropdownContent.style.display = 'block'
    } else {
      settingsDropdownContent.style.display = 'none'
    }
  })

  // Close the dropdown content when clicked outside of it
  window.addEventListener('click', function (event) {
    if (event.target === settingsButton) return
    if (!settingsDropdownContainer.contains(event.target)) {
      settingsDropdownContent.style.display = 'none'
    }
  })

  // Append the settings button and dropdown container to the page header
  const siteHeader = document.getElementById('site-header')
  siteHeader.appendChild(settingsButton)
  siteHeader.appendChild(settingsDropdownContainer)
}

// ---------------- Comment Traveller ----------------
// Gets a list of all new comments in a thread, and adds buttons to navigate between them quickly.
// This contains a lot of terrible CSS nonsense trying to make the buttons look and act in a way I thought would be nice, as a result its rather big and not the most readable thing I've made
// If you've got a passing knowledge of CSS and javascript and have input to improve this please offer it, this is far from my strong point.
function newCommentTraveller (backgroundDiv) {
  // Get all of the new comments in the thread
  const newComments = document.getElementsByClassName('comment is-comment-new')

  // Setup the buttons
  const btnGroup = document.querySelector('.btn-group')
  const commentCount = document.createElement('span')
  const upButton = document.createElement('button')
  const downButton = document.createElement('button')

  commentCount.innerHTML = `New Comments: ${newComments.length}&nbsp;&nbsp;` // &nbsp is a special kind of space, used to make move the buttons away from the number a little bit.

  setupButton(upButton, '↑', () => navigateComment('up'))
  setupButton(downButton, '↓', () => navigateComment('down'))

  // CSS
  commentCount.style.marginLeft = '10px'
  commentCount.style.fontSize = '0.6rem'
  commentCount.style.color = 'var(--foreground-secondary-color)'

  upButton.classList.add('btn', 'btn-sm', 'btn-light')
  upButton.style.fontSize = '0.6rem'
  upButton.style.color = 'var(--foreground-secondary-color)'
  upButton.title = 'Previous Comment'

  downButton.classList.add('btn', 'btn-sm', 'btn-light')
  downButton.style.fontSize = '0.6rem'
  downButton.style.color = 'var(--foreground-secondary-color)'
  downButton.title = 'Next Comment'

  backgroundDiv.style.backgroundColor = 'var(--background-input-color)'
  backgroundDiv.style.border = '1px solid var(--border-color)'
  backgroundDiv.style.color = 'var(--foreground-primary-color)'
  backgroundDiv.style.position = 'fixed'
  backgroundDiv.style.zIndex = 10000

  backgroundDiv.style.height = '27.667px' // Couldnt figure out how to gen this without hardcoding the value, makes it match the size of the existing buttons.
  backgroundDiv.style.paddingTop = '3px'
  backgroundDiv.style.paddingBottom = '3px'

  // Use flex to center buttons
  backgroundDiv.style.display = 'flex'
  backgroundDiv.style.alignItems = 'center'

  if (newComments.length > 0) { // Only shows the buttons when comments are detected.
    backgroundDiv.appendChild(commentCount)
    backgroundDiv.appendChild(upButton)
    backgroundDiv.appendChild(downButton)
    btnGroup.appendChild(backgroundDiv)
  }
}

function setupButton (button, text, onClick) {
  button.textContent = text
  button.style.backgroundColor = 'var(--background-input-color)'
  button.style.border = '1px solid var(--border-color)'
  button.style.color = 'var(--foreground-primary-color)'
  button.onclick = onClick
}

// Flash the *selected* comment orange for 500ms
function highlightComment (comment) {
  const originalBackgroundColor = comment.style.backgroundColor
  comment.style.backgroundColor = 'darkorange'
  comment.style.transition = 'background-color 1s ease-in-out'
  setTimeout(() => {
    comment.style.backgroundColor = originalBackgroundColor
    comment.style.transition = 'background-color 1s ease-in-out'
  }, 500)
}

// Move between comments
function navigateComment (direction) {
  // Get all new comments as an array
  const comments = Array.from(document.getElementsByClassName('comment is-comment-new'))

  // If current comment isnt set, sets it based on direction chosen (down will go to the first comment, up to the last)
  if (!window.currentCommentIndex && window.currentCommentIndex !== 0) {
    window.currentCommentIndex = direction === 'up' ? comments.length - 1 : 0

    // Current comment is set, so subtract or add one based on direction clicked
  } else {
    window.currentCommentIndex += direction === 'up' ? -1 : 1
  }
  // Essentially word wrap, if you click down at the last comment goes to the first comment, and vice versa
  if (window.currentCommentIndex < 0) {
    window.currentCommentIndex = comments.length - 1
  } else if (window.currentCommentIndex >= comments.length) {
    window.currentCommentIndex = 0
  }

  // Go to comment number currentCommentIndex (The number we've been adding and subtracting too above)
  comments[window.currentCommentIndex].scrollIntoView({ behavior: 'smooth' })
  highlightComment(comments[window.currentCommentIndex])
}

const backgroundDiv = document.createElement('div')
const homeButton = document.createElement('button')
const btnGroup = document.querySelector('.btn-group')

// Adds a space between the Expand All button and the custom buttons.
const blankspan = document.createElement('span')
blankspan.innerHTML = '&nbsp;'
try {
  btnGroup.appendChild(blankspan)
} catch (err) {
  // No btnGroup
}

const observer = new IntersectionObserver((entries) => {
  const entry = entries[0]
  if (!entry.isIntersecting && window.scrollY > btnGroup.getBoundingClientRect().top) {
    backgroundDiv.style.position = 'fixed'
    backgroundDiv.style.right = '30px'
    backgroundDiv.style.top = '10px'
    homeButton.style.position = 'fixed'
    homeButton.style.right = '10px'
    homeButton.style.top = '10px'
  } else {
    backgroundDiv.style.position = 'static'
    backgroundDiv.style.right = 'auto'
    backgroundDiv.style.top = 'auto'
    homeButton.style.position = 'static'
    homeButton.style.right = 'auto'
    homeButton.style.top = 'auto'
  }
})
try {
  observer.observe(btnGroup)
} catch (err) {
  // No btnGroup
}

// ---------------- Markdown ----------------
// Adds markdown buttons below the comment box, no more forgetting which order the brackets go for a link.
/* The feature is pretty sloppy, adding the markdown to the single comment box at the end of the page was easy but getting it to work on the
comment boxes that appear when you click reply was much harder, dynamically editing pages is much harder than I expected it to be.
I'll need to clean this up in the future once I have a fresh set of eyes, right now it probably has some left over snips of code from me trying
various things to get it working properly.
*/

class ButtonCreator {
  constructor (formInputSelector, formButtonContainerSelector) {
    this.formInputSelector = formInputSelector
    this.formButtonContainerSelector = formButtonContainerSelector
    this.newButtonContainer = null
  }

  addButtonToMenu (buttonText, before, after = '', options = {}) {
    const formInput = document.querySelector(this.formInputSelector)
    const newButton = document.createElement('button')
    const formButtonContainer = document.querySelector(this.formButtonContainerSelector)
    newButton.setAttribute('type', 'button')
    newButton.setAttribute('class', 'btn btn-link')
    newButton.textContent = buttonText
    newButton.classList.add('btn', 'btn-sm', 'btn-light')
    newButton.style.border = '1px solid var(--border-color)'
    newButton.style.color = 'var(--foreground-secondary-color)'
    newButton.style.flex = '0 0 auto'
    newButton.style.fontSize = '0.6rem'
    newButton.style.margin = '0.2em'
    newButton.style.minWidth = 'fit-content'
    newButton.addEventListener('click', () => this.buttonClickHandler(formInput, buttonText, before, after, options))

    if (this.newButtonContainer === null) {
      this.newButtonContainer = document.createElement('div')

      // Create a container for the new buttons if it doesn't exist
      this.newButtonContainer.id = 'markDownButtons'
      this.newButtonContainer.style.position = 'relative'
      this.newButtonContainer.style.top = '-30px' // Nonsense way to have the buttons beside the post button without adding to the same bar as the post button, when added to the post button it got thrown around and was messy in general. Probably better ways to handle this.
      this.newButtonContainer.style.alignItems = 'center'
      this.newButtonContainer.style.backgroundColor = 'var(--background-input-color)'
      this.newButtonContainer.style.border = '1px solid var(--border-color)'
      this.newButtonContainer.style.display = 'flex'
      this.newButtonContainer.style.flexWrap = 'wrap'
      this.newButtonContainer.style.justifyContent = 'center'
      this.newButtonContainer.style.padding = '4px' // Add gap between items.
      this.newButtonContainer.style.width = 'calc(100% - 13em)' // Leave space for the Post/Cancel buttons

      formButtonContainer.insertAdjacentElement('afterend', this.newButtonContainer)
    }
    // Add the new button to the existing container as a catch
    this.newButtonContainer.appendChild(newButton)
  }

  buttonClickHandler (formInput, buttonText, before, after, options) {
    const selectedText = formInput.value.substring(formInput.selectionStart, formInput.selectionEnd)
    let textToInsert

    if (options.isLink && this.isInsideBrackets(formInput.value, formInput.selectionEnd)) {
      alert('A link cannot be nested inside another link')
      return
    }

    if (options.requiresUserInput) {
      textToInsert = this.promptUserForInput(buttonText, options.label, selectedText)
      if (textToInsert === undefined) return // Cancels if user hits cancel.
    }

    const markdown = this.generateMarkdown(buttonText, before, after, selectedText, textToInsert)
    const currentValue = formInput.value
    formInput.value = currentValue.slice(0, formInput.selectionStart) + markdown + currentValue.slice(formInput.selectionEnd) // If I knew a way to do this while maintaining ctrl+z I would. I tried.

    const newCursorPos = formInput.selectionStart + markdown.length
    formInput.setSelectionRange(newCursorPos, newCursorPos)
  }

  isInsideBrackets (text, cursorPos) { // This is entirely nonsense and pointless but I made it work. If I never see a bracket again I'll be happy
    try {
      const beforeCursor = text.slice(0, cursorPos)
      const afterCursor = text.slice(cursorPos)
      const lastOpenBracketIndex = beforeCursor.lastIndexOf('[')
      const nextCloseBracketIndex = afterCursor.indexOf(']')
      const lastCloseBracketIndex = beforeCursor.lastIndexOf(']')
      const nextOpenParenIndex = text.indexOf('](', lastCloseBracketIndex)

      const isInBrackets = lastOpenBracketIndex != -1 && nextCloseBracketIndex != -1 && nextOpenParenIndex != -1
      const isInParentheses = lastCloseBracketIndex != -1 && nextOpenParenIndex != -1 && afterCursor.indexOf(')') != -1
      return isInBrackets || isInParentheses
    } catch (err) {
      console.log(err)
      return false
    }
  }

  promptUserForInput (buttonText, label, selectedText) {
    let userInput
    let url
    switch (buttonText) {
      case 'Link':
        if (!selectedText) {
          userInput = prompt(label)
          if (userInput === null) return
        }
        url = prompt('Enter the URL', '')
        if (url === null) return
        return { text: userInput, url }
      default:
        userInput = prompt(label)
        if (userInput === null) return
        return userInput
    }
  }

  generateMarkdown (buttonText, before, after, selectedText, textToInsert) {
    /*
    before = thing added before your text
    after = thing added after your text
    textToInsert = prompted insertion, eg URL for clickable text or language in a codeblock
    selectedText = current highlighted text or blank if no selection
    */
    switch (buttonText) {
      case 'Code Block':
        return `${before}${textToInsert}\n${selectedText}${after}`
      case 'Bullet List':
        const bulletLines = selectedText.split('\n')
        const bulletListItems = bulletLines.map((line) => `* ${line}`).join('\n')
        return `${bulletListItems}${after}`
      case 'Numbered List':
        const numberedLines = selectedText.split('\n')
        const numberedListItems = numberedLines.map((line, index) => `${index + 1}. ${line}`).join('\n')
        return `${numberedListItems}${after}`
      case 'Expandable':
        return `${before}${selectedText || '[SummaryHere]'}${after}`
      case 'Horizontal Rule':
        return `${before}${after}`
      case 'Link':
        const linkText = textToInsert.text || selectedText
        return `${before}${linkText}${after}${textToInsert.url})`
      default:
        if (!selectedText) { selectedText = ' ' } // Puts a space between things like the bold's ** when there's no text selected (so ** ** instead of ****)
        return `${before}${selectedText}${after}`
    }
  }
}

function markdownButtons () {
  const checkExist = setInterval(() => { // Full of messy nonsense as I tried to add the buttons to new comment boxes when reply is clicked without making duplicates. Can still sometimes break if you spam reply > cancel. If you don't do that it doesn't count as a bug though ;)
    const newFormButtons = document.querySelectorAll('.form-buttons:not(.markdown-buttons-added)')
    if (newFormButtons.length) {
      newFormButtons.forEach((newFormButton, index) => {
        if (!newFormButton.querySelector('#markDownButtons')) {
          newFormButton.classList.add('markdown-buttons-added') // Add identifier class
          const uniqueId = `form-buttons-${Date.now()}-${index}` // Add unique id
          newFormButton.id = uniqueId
          try {
            const buttonCreator = new ButtonCreator('.form-input', `#${uniqueId}`)
            buttonCreator.addButtonToMenu('Bold', '**', '**')
            buttonCreator.addButtonToMenu('Italic', '*', '*')
            buttonCreator.addButtonToMenu('Strikethrough', '~~', '~~')
            buttonCreator.addButtonToMenu('Inline Code', '`', '`')
            buttonCreator.addButtonToMenu('Code Block', '```', '\n```', { requiresUserInput: true, label: 'Enter language for syntax highlighting (optional):\nPopular languages: javascript, python, java, csharp, cpp, go, rust, php, swift, kotlin, ruby, shell, html, css, sql:' })
            buttonCreator.addButtonToMenu('Bullet List', '* ', '')
            buttonCreator.addButtonToMenu('Numbered List', '', '')
            buttonCreator.addButtonToMenu('Quote', '> ', '')
            buttonCreator.addButtonToMenu('Horizontal Rule', '---')
            buttonCreator.addButtonToMenu('Small', '<small>', '</small>')
            buttonCreator.addButtonToMenu('Expandable', '<details>\n<summary>', '</summary>\n[DetailedDescriptionHere]\n</details>')
            buttonCreator.addButtonToMenu('Link', '[', '](', { isLink: true, requiresUserInput: true, label: 'Text to make URL:' })
            // Can add more here with the format of Button text, thing that goes before text, thing that goes after text. Tildes supports full HTML so you can technically tons and tons of buttons just making the before and after opening and closing HTML. Use Small as an example.
          } catch (err) {
            // Log error details
            console.error(err)
          }
        }
      })
      clearInterval(checkExist)
    }
  }, 100)
}

function addButtonClickListeners () {
  const buttons = document.querySelectorAll('.btn-post-action[name="reply"]')
  if (buttons.length > 0) {
    buttons.forEach((button) => {
      button.addEventListener('click', markdownButtons())
    })
  }
}

function runMarkDown () {
  window.addEventListener('load', addButtonClickListeners) // Gens the markdown buttons for all future comment boxes (The ones that show up when you click reply)
  markdownButtons() // Gens the markdown buttons for the base comment box (Bottom of the page)
}

// ---------------- Run the stuff ----------------

if (toggleSettings) { addSettingsButton() } // Yes you can even turn the settings off if you'd rather set the bools manually and leave the header untouched.
if (toggleCommentTraveller) { newCommentTraveller(backgroundDiv) }
if (toggleScrollToTopButton) { addScrollToTopButton(homeButton) }
if (toggleUserColors) { applyConsistentColorToUserNames() }
if (toggleGroupStars) { addGroupStars() }
if (toggleMarkdownButtons) { runMarkDown() }
