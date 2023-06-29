# Tildezy

Howdy, this is Tildzy the general perpose userscript that adds features to https://tildes.net/ 

## Features

### Open Comments in New Tab

- Makes opening the comments to a post open in a new tab, rather than opening in the current tab.
![Image of link named "56 comments" with a mouse cursor hovering over it ready to click](https://i.imgur.com/ndAFyTs.png)

### User Colors

- Applies a random color to every user based on their username to help distinguish people at a glance.
- Color is consistent so you can learn to rely on it, e.g. You see Joe is pink, every time you see Joe he will be pink
![Image of the username "Deimos", colored Yellow.](https://i.imgur.com/RRn1m3Z.png)

![Image of the username "mycketforvirrad", colored Green.](https://i.imgur.com/7qFZbqZ.png)

### Comment Collapser

- Collapse/Expand a comment tree by triple-clicking anywhere on a comment.
- Triple click was chosen because you'd sometimes doubleclick a word to copy it. Amount of clicks required can be changed on line 134

### Scroll to Top Button

- Adds a button at the bottom of the page which sends you back to the top of the page.
![Image of a button that says "↑ Return to Top ↑".](https://i.imgur.com/dPolQ26.png)
### Group Stars/Favourites

- Allows you to star groups, making them show at the top of the list for ease of access.
![Image of groups list with three groups starred moving them to the top of the list.](https://i.imgur.com/SBwtlhH.png)
### New Comment Traveller

- Allows you to instantly jump between new comments in a thread.
![Image of new comments section with up and down button.](https://i.imgur.com/wPECN5c.png)
### New Comment Traveller

- Adds buttons below every comment box to automatically insert various markdown actions. Tildes supports full HTML inside comments, so I've made it easy to insert extra buttons for whatever features you'd want. New buttons can be inserted at line 762
![Image of new markdown buttons below a comment box.](https://i.imgur.com/jhRBDLo.png)

### Settings

- Allows on the fly enabling and disabling of features based on user preference.
![Image of settings menu to enable and disable features.](https://i.imgur.com/CU8S4VA.png)

## Installation

To install and use the userscript with Violentmonkey, follow these steps:

1. Install the [Violentmonkey](https://github.com/violentmonkey/violentmonkey#violentmonkey) or [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on Tidezy.user.js above,then click Raw. [Or click this text](https://raw.githubusercontent.com/TeJayH/Tildezy/main/Tildezy.user.js)

3. Select "Install" for Tampermonkey or "Confirm Install" for Violentmonkey.

![Image of Tampermonkeys install button.](https://i.imgur.com/CrsQs8x.png)

![Image of Violentmonkeys Confirm Install button.](https://i.imgur.com/3Fw240X.png)

4. *(Optional)* Remove the "// @downloadURL" and "// @updateURL" lines from the script to disable automatic updates, some people do not like their scripts to update, this will stop that for them.

## Contributing

Contributions are welcome! If you have any suggestions, bug reports, or feature requests, please open an issue or submit a pull request. 

I don't see this being a constantly growing or updating script as I mostly just added the features I wanted in the site, but if a good idea appears it'd be a waste to not implement it.

## License

This userscript is licensed under the [GNU GPLv3](LICENSE).
