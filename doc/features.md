# Home features

## Navigation

Describes ability to navigate between apps and components from anywhere inside Cozy.

### Topbar

- current app w/ contextual menu
  - close app
- apps switcher
  - default back to dashboard
  - sort  favorites apps at top
  - w/ indicator for running apps
- user menu
  - quick access to Settings
  - quick access to Help
  - logout
- Notifications panel trigger w/ counter
- quick actions: an app can declares a route that can be triggered from the topbar directly (e.g write a new mail, create an event…). It consists of a simple button in the topbar that deploy a popup w/ the iframed route view
- auto-masking feature

### Shortcuts
- cycle between launched apps
- back to dashboard
- open app switcher + arrows navigation
- quick launch app (w/ autocomplete)


## Organisation

Formerly the Dashboard that display apps and informations.


### Option 1: Groups

- apps can be organized in a grid
- apps can be grouped in a cell that can be expanded
- the grid re-adapt itself (masonry?)
- cells can be drag/dropped to be reorganized
- a lateral bar display icons that can be used filter apps
- a counter can be associated to an app

### Option 2: Expanded topbar

When accessing the Cozy w/o any app URL (i.e. to the dashboard), the topbar in expanded to the whole viewport to display the 6 more used apps, and the user never come back again to this view: it's just a wrapper for a first access. The rest of the navigation between apps will be only using the app switcher component.

It may also dipslay widgets (see below)

### Widgets

- apps can provides widgets to display information
- widget can occupy one or more cells (horiz/vertically)


## Notifications

The way notifications can be displayed across *all* Cozy.

- apps can push notifications in a global bus that's displayed in Home
- 2 kind of notifications
  - info: display a tip that disappear after a given timeout
  - alert: like info but remains in the notification panel for a later use
- notification can embed an action feedback when clicked
- notification can exposes actions displayed as button (e.g. trigger an update)
- notification in panel display
  - app icon (?)
  - a title
  - a date (can be relative if <24h)
  - a short description
  - a close button
  - (opt.) actions buttons


# Built-in apps

## Settings

Settings offers a way to customize the Cozy plateform. It exposes a provider API to let apps developers to hook their own settings groups inside the system settings app (e.g. let the user configure its domain name through the cozy-management app).


## Help / Support

Help app is the help center. It offers different help panels, contact form, news feeds, changelogs…


## Status monitor

Status monitor is a management app that let user consults its Cozy usage, display graphs…


## Market

The Market app is a marketplace and an app management center. It let user install apps from a registry and consult which apps are installed. User can also reinstall / uninstall / consult logs for installed apps.

It may be built on a distributed framework to let third-parties develop their own market place that furbish all functionnalities to lets user manager their apps ecosystem.


# Home Workshop

To determine users expectations about Home, Dashboard, Navigation and so on, we ask the 3 following questions:

1. Why do you open your Cozy daily?
2. How do you switch and interact between your apps?
3. What kind of information/data do you use often?
