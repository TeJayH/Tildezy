// ==UserScript==
// @name          Tildezy
// @namespace     https://github.com/TeJayH/Tildezy/
// @version       1.1.1
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

// ---------------- Toggles ----------------
// Gets values from storage if they exist, else sets everything to true, enabling all functiosn of script.
const toggleNewTabComments = GM_getValue('toggleNewTabComments', true);
const toggleUserColors = GM_getValue('toggleUserColors', true);
const toggleCommentCollapser = GM_getValue('toggleCommentCollapser', true);
const toggleScrollToTopButton = GM_getValue('toggleScrollToTopButton', true);
const toggleGroupStars = GM_getValue('toggleGroupStars', true);
const toggleSettings = GM_getValue('toggleSettings', true);

/* Manual overrides if you dont want the settings button
const toggleNewTabComments = true;
const toggleUserColors = true;
const toggleCommentCollapser = true;
const toggleScrollToTopButton = true;
const toggleGroupStars = true;
const toggleSettings = true
*/


// ---------------- Color Users ----------------
// Function to generate a random color based on hashed username
// Ensures whenever you see a user they consistently have the same color. Also makes sure color is not too bright or dark to read.
function getConsistentColor(username) {
    let hash = 0;
    if (username.startsWith('@')) {
        username = username.substring(1); // Remove the '@' symbol from the hash for consistent coloring.
    }
    if (username.startsWith('/u/')) {
        username = username.substring(3); // Remove the '/u/' symbol from the hash for consistent coloring.
    }

    let color;
    let brightness;
    let darkness;

    // Calculate a hash value of the username
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
        hash ^= 0xFFFFAA;
        hash |= 0;
    }

    // Convert the hash value to RGB values
    const r = ((hash & 0xFF0000) >> 16);
    const g = ((hash & 0x00FF00) >> 8);
    const b = ((hash & 0x0000FF) >> 0);

    // Convert RGB values to hexadecimal color code
    color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    // Calculate brightness with magic math.
    brightness = (r * 299 + g * 587 + b * 114) / 1000;
    darkness = (r + g + b) / 3;

    // Check if the brightness or darkness is out of the desired range
    //Adjust the values however you want, if you make the possible range too small you may near infinite loop while it tries over and over to generate colors for people
    const brightnessThreshold = 200;
    const darknessThreshold = 50;
    if (brightness > brightnessThreshold || darkness < darknessThreshold || brightness < darknessThreshold) {
        // Append an underscore to the username and recursively call the function again to generate a fresh color
        username += '_';
        return getConsistentColor(username);
    }
    return color;
}

// function to loop the usernames on the page, compileing names into maps then applies color to those maps.
// Idea behind the mapping is that coloring all of a users comments at once skips the need to hash their name and calculate the color over and over, should be more efficient, but I'm dumb so who knows.
function applyConsistentColorToUserNames() {
    const userLinks = document.getElementsByClassName('link-user');
    const userMap = {};

    // Group user links by username
    for (let i = 0; i < userLinks.length; i++) {
        const link = userLinks[i];
        const username = link.textContent;
        if (!userMap.hasOwnProperty(username)) {
            userMap[username] = [];
        }
        userMap[username].push(link);
    }

    // Apply consistent color to all instances of each username
    for (const username in userMap) {
        if (userMap.hasOwnProperty(username)) {
            const color = getConsistentColor(username);
            const userInstances = userMap[username];
            for (let i = 0; i < userInstances.length; i++) {
                const link = userInstances[i];
                link.style.color = color;
            }
        }
    }
}


// ---------------- Comment Collapse ----------------

// Function to toggle collapse a comment
function toggleCommentCollapse(event) {
    event.stopPropagation();
    const comment = event.target.closest('.comment');
    comment.classList.toggle('is-comment-collapsed');
    if (window.getSelection) {
        window.getSelection().removeAllRanges(); //Clears selection that happens if your triple click is on text.
    } else if (document.selection) {
        document.selection.empty();
    }
}

// Function to handle click event on comments (to trigger the collapse)
function handleCommentClicks(event) {
    if (event.detail === 3) { //Change amount of clicks required to toggle a comment 3 because you sometimes doubleclick a word to select it for copying
        toggleCommentCollapse(event);
    }
}

if (toggleCommentCollapser) {
    const commentsContainer = document.querySelector('#comments');
    if (commentsContainer) {
        commentsContainer.addEventListener('click', (event) => {
            const target = event.target;
            const isCommentHeader = target.matches('.comment-header');
            const isCommentText = target.matches('.comment-text');
            if (isCommentHeader || isCommentText || target.closest('.comment-header') || target.closest('.comment-text')) {
                handleCommentClicks(event);
            }
        });
    }
}


// ---------------- Group Stars ----------------
// Function to handle clicking on a star
function handleStarClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const starElement = event.target;
    const groupLink = starElement.nextSibling;
    if (groupLink) {
        const groupName = groupLink.getAttribute('href');
        const starredGroups = GM_getValue('starredGroups', []);
        if (starredGroups.includes(groupName)) {
            // Group is already starred, remove it
            const index = starredGroups.indexOf(groupName);
            if (index !== -1) {
                starredGroups.splice(index, 1);
                GM_setValue('starredGroups', starredGroups);
            }
            starElement.textContent = '☆';
            starElement.style.color = '';
        } else {
            // Group is not starred, add it
            starredGroups.push(groupName);
            starredGroups.sort(); // Sort alphabetically
            GM_setValue('starredGroups', starredGroups);
            starElement.textContent = '★';
            starElement.style.color = 'yellow';
        }
        rearrangeGroupLinks();
    }
}

// Function to check if a group is starred
function isGroupStarred(groupName) {
    const starredGroups = GM_getValue('starredGroups', []);
    return starredGroups.includes(groupName);
}

// Function to rearrange group links based on star status
function rearrangeGroupLinks() {
    const groupContainer = document.querySelector('.nav-group-list');
    if (groupContainer) {
        const groupLinks = Array.from(groupContainer.querySelectorAll('li'));
        const starredGroups = [];
        const unstarredGroups = [];

        groupLinks.forEach((groupItem) => {
            const groupLink = groupItem.querySelector('.link-group');
            const groupName = groupLink.getAttribute('href');
            const isStarred = isGroupStarred(groupName);

            if (isStarred) {
                starredGroups.push(groupItem);
            } else {
                unstarredGroups.push(groupItem);
            }
        });

        starredGroups.sort((a, b) => {
            const groupNameA = a.querySelector('.link-group').getAttribute('href').toLowerCase();
            const groupNameB = b.querySelector('.link-group').getAttribute('href').toLowerCase();
            if (groupNameA < groupNameB) return -1;
            if (groupNameA > groupNameB) return 1;
            return 0;
        });

        unstarredGroups.sort((a, b) => {
            const groupNameA = a.querySelector('.link-group').getAttribute('href').toLowerCase();
            const groupNameB = b.querySelector('.link-group').getAttribute('href').toLowerCase();
            if (groupNameA < groupNameB) return -1;
            if (groupNameA > groupNameB) return 1;
            return 0;
        });

        groupLinks.forEach((groupItem) => {
            groupItem.parentNode.removeChild(groupItem);
        });

        starredGroups.forEach((groupItem) => {
            groupContainer.appendChild(groupItem);
        });

        unstarredGroups.forEach((groupItem) => {
            groupContainer.appendChild(groupItem);
        });
    }
}


// Function to add clickable stars to the group links
function addGroupStars() {
    const groupItems = document.querySelectorAll('.nav-item');
    const groups = Array.from(groupItems).map((groupItem) => {
        const groupLink = groupItem.querySelector('.link-group');
        if (groupLink) { // Avoids a null when logged in.
            const groupName = groupLink.getAttribute('href');
            const isStarred = isGroupStarred(groupName);
            const starElement = document.createElement('span');
            starElement.classList.add('star');
            starElement.style.cursor = 'pointer';
            starElement.textContent = isStarred ? '★' : '☆';
            starElement.addEventListener('click', handleStarClick);
            starElement.style.color = isStarred ? 'yellow' : '';

            groupItem.insertBefore(starElement, groupLink);
        }
    });

    // Sort the group list
    sortGroupList();
}

function sortGroupList() {
    const groupList = document.querySelector('.nav-group-list');
    if (!groupList) {
        return;
    }
    const groupItems = Array.from(groupList.children);

    groupItems.sort((a, b) => {
        const aIsStarred = a.querySelector('.star').textContent === '★';
        const bIsStarred = b.querySelector('.star').textContent === '★';
        const aText = a.querySelector('.link-group').textContent.toLowerCase();
        const bText = b.querySelector('.link-group').textContent.toLowerCase();

        if (aIsStarred && !bIsStarred) {
            return -1;
        } else if (!aIsStarred && bIsStarred) {
            return 1;
        } else {
            return aText.localeCompare(bText);
        }
    });
    groupItems.forEach((item) => groupList.appendChild(item));
}


// ---------------- New Tab Comments button ----------------
if (toggleNewTabComments) {
    document.querySelectorAll('span').forEach(function(span) {
        if (span.innerText.toLowerCase().includes('comment')) {
            var anchor = span.closest('a');
            if (anchor) {
                anchor.addEventListener('click', function(event) {
                    event.preventDefault();
                    window.open(this.href, '_blank');
                });
            }
        }
    });
}


// ---------------- Scroll to top ----------------
// Function to scroll to the top of the page
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// Function to add a scroll-to-top button to the footer
function addScrollToTopButton() {
    var scrollToTopButton = document.createElement('button');
    scrollToTopButton.textContent = '↑ Return to Top ↑';
    scrollToTopButton.setAttribute('id', 'scrollToTopButton');
    scrollToTopButton.style.marginBottom = '15px';

    // Apply styles to the button
    scrollToTopButton.style.backgroundColor = 'var(--background-input-color)';
    scrollToTopButton.style.border = '1px solid var(--border-color)';
    scrollToTopButton.style.color = 'var(--foreground-primary-color)';

    var themeSelection = document.querySelector('.site-footer-theme-selection');
    themeSelection.parentNode.insertBefore(scrollToTopButton, themeSelection);
    scrollToTopButton.addEventListener('click', scrollToTop);
}


// ---------------- Settings ----------------
// Probably a million ways to do this way better but I'm trash when html and css enter the mix.
function addSettingsButton() {
    // Create the settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'btn btn-sm btn-link site-header-settings-button';
    settingsButton.innerText = 'Tildezy Settings';
    settingsButton.title = 'Click to open settings';
    settingsButton.style.float = 'right';

    // Create the settings dropdown container
    const settingsDropdownContainer = document.createElement('div');
    settingsDropdownContainer.className = 'site-header-settings-dropdown';
    settingsDropdownContainer.style.position = 'relative';
    settingsDropdownContainer.style.float = 'right';
    settingsDropdownContainer.style.paddingTop = '25px';

    // Create the settings dropdown content
    const settingsDropdownContent = document.createElement('div');
    settingsDropdownContent.className = 'dropdown-content';
    settingsDropdownContent.style.display = 'none'; // Hide the dropdown by default
    settingsDropdownContent.style.position = 'absolute';
    settingsDropdownContent.style.backgroundColor = 'var(--background-secondary-color)';
    settingsDropdownContent.style.padding = '10px';
    settingsDropdownContent.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    settingsDropdownContent.style.zIndex = '999';
    settingsDropdownContent.style.whiteSpace = 'nowrap';
    settingsDropdownContent.style.right = '0';
    settingsDropdownContent.style.maxWidth = '50vw';
    settingsDropdownContent.style.overflowX = 'hidden';

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
        }
    ];

    settingsCheckboxes.forEach(({
        setting,
        label,
        description
    }) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = setting;
        checkbox.checked = GM_getValue(setting, true);

        const checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = setting;
        checkboxLabel.textContent = label;
        checkboxLabel.title = description;

        // Add event listener to store the checkbox value when it's changed
        checkbox.addEventListener('change', function() {
            GM_setValue(setting, this.checked);
        });
        settingsDropdownContent.appendChild(checkbox);
        settingsDropdownContent.appendChild(checkboxLabel);
        settingsDropdownContent.appendChild(document.createElement('br'));
    });

    // Create the apply button
    const applyButton = document.createElement('button');
    applyButton.innerText = 'Apply';
    applyButton.title = 'Click to apply settings (reloads page)';
    applyButton.addEventListener('click', function() {
        location.reload();
    });

    settingsDropdownContent.appendChild(applyButton);
    settingsDropdownContainer.appendChild(settingsDropdownContent);

    // Toggle the visibility of the dropdown content when the button is clicked
    settingsButton.addEventListener('click', function() {
        if (settingsDropdownContent.style.display === 'none') {
            settingsDropdownContent.style.display = 'block';
        } else {
            settingsDropdownContent.style.display = 'none';
        }
    });

    // Close the dropdown content when clicked outside of it
    window.addEventListener('click', function(event) {
        if (event.target === settingsButton) return;
        if (!settingsDropdownContainer.contains(event.target)) {
            settingsDropdownContent.style.display = 'none';
        }
    });

    // Append the settings button and dropdown container to the page header
    const siteHeader = document.getElementById('site-header');
    siteHeader.appendChild(settingsButton);
    siteHeader.appendChild(settingsDropdownContainer);
}


// ---------------- Run the stuff ----------------

if (toggleSettings){addSettingsButton();} // Yes you can even turn the settings off if you'd rather set the bools manually and leave the header untouched.
if (toggleScrollToTopButton){addScrollToTopButton();}
if (toggleUserColors){applyConsistentColorToUserNames();}
if (toggleGroupStars){addGroupStars();}
