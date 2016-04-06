# Inter-app communication

When dealing with data transfer and sharing inside Cozy, we focus to the Inter-applications communication to ensure data-flows can be controlled and securized through permissions.

Product team have [identified some use cases](https://bimestriel.framapad.org/p/communication-inter-apps) that represents diffrent kind of communication. We have technically decoupled them in 3 main families:

1. Data is requested from an app to another: it's a back and forth communication
2. Data is passed from an app to another: it's a single way to pass data
3. Data needs to be accessed in read-only mode: it's a given permission in RO given to the app at installation

_1_ and _2_ are two forms of intents, probably defined using the [Web Activities spec](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/API/Web_Activities).
_3_ is a set of permissions given at installation. Those permissions can be later finely grained using a dedicated app that acts like a _permissions proxy manager_ (see below).


## Use Cases

### Create a data

e.g.:
- Mails -> Contacts: create a new contact
- Mails -> Files: save an attachment

**Intent**: This case is a back and forth communication: App _A_ (Mails) ask for an app with write permission on the data type (Contacts, Files) to `save` the data. It open a dialog to let user validate the saving action.


### Transparent creation

e.g.:
- Contacts -> Calendar: creates a birthday event from a contact
- Mails -> Calendar: creates an event from an ICS file
- Mails -> Calendar: creates an event from an email body (SNCF, etc)

Those 3 exemples can be divided in 2 ways of communication:

1. **RO access**: App _A_ (Calendar) asks for permission to read-only Contacts data, so it parses them and extract birthdays. It's its responsibility to ensure the data is always consistent (so subscribe to contacts changes to updates its events). This permission is ask at app install.
2. **Intent**: Creates an event from a content, it's just similar to the use case above. Concerning the creation from a body content, see section about the intelligent editor below.


### Search and pick

e.g.:
- Contacts <- Files: get an avatar from an image file
- Mails <- Files: pick a file to attach to a draft
- Calendar <- Contacts: auto-complete contacts list (when adding attendees)

Here again, there's 2 kind of communication:

1. **Intent**: picking is just a back and forth commnication when app _A_ (Contacts or Mails) ask for a resource to be `pick`ed. The ressource can be transmitted as value (i.e. `returnValue: true`, case of avatar picking) or as a pointer (i.e. `returnValue: false`, case of adding a URL link to the email draft that point to the file). There's an edge case when we want to consume the data not as-it, but post-process it (e.g. we'll want to crop the avatar in a square size before adding it to the contact document). In this case, we can chain _intents_, so the first one is `pick` (which is handled by Files) and then a second one is `crop` (on `pick` success), which can be handled by a built-in component.
2.**RO access**: App _A_ (Calendar) asks for contact read-only permission, so it can have access to all contacts to build the autocomplete list.


### Transparent get

e.g.:
- Mails <- Contacts: display avatar for a given email address
- _any_ <- Bank: get a balance from a given account

Those 2 examples are just **RO access** permission. There's a little difference as the requester app may want to access to a computed result instead of a stored data. In this case, responser app (Bank) may exposes a public API (through a Data-System service) and its access in read-only mode can be asked by the requester app to access the API.


### Transition between apps

e.g.:
- Mails -> Contacts: open a contact
- _any_ -> Mails: open a mail in composer
- search -> _any_: open a search result in a dedicated app

All of the kind of communications ar just `open` **Intent**.


## Components

### Permissions proxy manager

Permissions are asked by application when installing. We can imagine provide an app, a _permission proxy manager_, that let user determines finely which permissions he want to let the application have. Each permission can exists in two flavors on a given docType/API service:
- read-only
- read-write
and each of them can be:
- asked one time at install (`always`)
- asked at each access try (`once`)
- always refused (`refused`)

This way, user can have a large control of which application can access to what content.

About getting content, we can also image fallbacks. Say App _A_ (Calendar) want to display information about a content managed by app _B_ (Contacts). App _A_ ask at install for permission to **read-only** app _B_ data type. If user refuses this permission, App _A_ can fallback the display info (which so cannot be read) to an `open` **intent**, so App _B_ will be opened to display the data.

### Intelligent editor

About parsing / editing content, we have in mind to build an intelligent editor which can embed data markers, so user can add Task, Note, Contact, Event, etc hot-links inside the content. This kind of editor can be deployed in any Cozy app that want to have this rich editing features.

Say, we can also imagine using it to _display_ content, which in fact is just editor in _read-only_ mode. It can provides an API for plugins that can increase the data markers offered, such as a date parser.

E.g.: we use the intelligent editor to display body mail content. If the editor can detect a date, or a contact in the content, it then display extra actions, such as _jump to the contact_ (**intent** `open`) or create the contact or the event (**intent** `save`).
