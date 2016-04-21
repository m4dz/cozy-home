# Inter-app communication

When dealing with data transfer and sharing inside Cozy, we focus to the Inter-applications communication to ensure data-flows can be controlled and securized through permissions.

Product team have [identified some use cases](https://bimestriel.framapad.org/p/communication-inter-apps) that represents different kind of communication. We have technically decoupled them in 3 main families:

1. The user is redirected to another app to perform an action (pick, create, ...), eventually some Data is passed along. When the action is done, the user comes back to the first app. It's a back and forth communication
2. The user is redirected to another app but isnt expected to come back to the first. Data can be passed along, it's a single way to pass data
3. Data needs to be accessed in read-only mode: permission in read-only (RO) given to the app at installation

_1_ and _2_ are two forms of intents, probably defined using our own API inspired by standards (see Annexes/Intent APIs). The only difference is in the case of _1_, we expect a _returnValue_ from app B.
Note : the return value can be only "ok, it's done" (_1a_), an actual value (_1b_) or a "pointer" to some data (_1c_).

_3_ is a set of permissions given at installation. To allow the user to better manage what's going on, we will need to support a RO mode.

## Current status

As a reminder, when an app ask for the permission of a docType, it is granted all permissions (read / write / list) on it.

Regarding binary permissions, all apps can be considered to have the permission to read and create a binary (as they could create a fake doc and then use the binary API). So knowing the {id & rev} of a Binary, is equivalent to having access to it.  

Moreover, we have a very crude implementation of _2_, with the homeWindow.postMessage('intent', {goto}) and a decent implementation of _1b_ through the work done in the "pictures picker" modal. In both cases, a lot of thing is hardcoded : ie, Mail needs to know the url to display a contact in the contact app and the modal picker is implemented by home. Moreover these APIs are poorly documented and not included in the sdk.

What we lack is the ability for home to act as a repartitor of intents, so emails could say which  also implies that an app should be able to declare what it can handle.

## Use Cases

### Create a data

e.g.:
- Mails -> Contacts: create a new contact
- Mails -> Files: save an attachment

**Intent**: This case is a back and forth communication with a "done" return (_1a_) : App _A_ (Mails) ask for an app with write permission on the data type (Contacts, Files) to `save` the data.

Home opens the target app as a dialog to let user validate the saving action.

### Transparent creation

- Contacts -> Calendar: creates a birthday event from a contact
- Mails -> Calendar: creates an event from an ICS file
- Mails -> Calendar: creates an event from an email body (SNCF, etc)

Those 3 exemples can be divided in 2 ways of communication:

1. **RO access**: App _A_ (Calendar) asks for permission to read-only Contacts data, so it parses them and extract birthdays. It's its responsibility to ensure the data is always consistent (so subscribe to contacts changes to updates its events). This permission is asked at app install.
2. **Intent**: We believe the two last creations should not be transparent but instead result from an action of the user in the email app (like a big [make me an event] button.). So we come back to the use case above.
However, for this case, email would also need the ability to make sure the events it asked creation of still exists (may be we should just remove permissions on DS exists API)

**@TODO** : Can we find an use case where it does not make sense for an app to have access to some docType but still needs the ability to create it (and manage only its created) without user action ? (when formulated like that, it sounds more like a WO permission ...)  

**Annexe** : Concerning the creation from a body content, see section about the intelligent editor below.

### Search and pick

e.g.:
- Contacts <- Files: get an avatar from an image file
- Mails <- Files: pick a file to attach to a draft
- Calendar <- Contacts: auto-complete contacts list (when adding attendees)

Here again, there's 2 kind of communication:

1. **Intent**: picking is just a back and forth commnication when app _A_ (Contacts or Mails) ask for a resource to be `pick`ed.

For the avatar, case, we can chain intents : ie. Contacts ask not for a `image`, but for a `cropped-image`, home (or another app _C_) handles `cropped-image`  and fire a `pick image`, when the image is picked, home show the cropping UI, and then respond to the original intent. It can be either a _1b_ or _1c_.

The pick file to attach is interesting as it is an instance of _1c_, ie the file app could just return the `{id, rev, some metadata}` of the picked binary. Then email can add it to the draft `Message` without needing to move the actual file around.

2.**RO access**: (_3_) App _A_ (Calendar) asks for contact read-only permission, so it can have access to all contacts to build the autocomplete list.

### Transparent get

e.g.:
- Mails <- Contacts: display avatar for a given email address
- _any_ <- Bank: get a balance from a given account

Those 2 examples are just **RO access** permission (_3_).
In the first case, it makes sense for Mail application have RO access to contacts.

In the second case, its more complicated as the requester app wants to access to a computed result instead of a document. There is two solutions from which the responder app (Bank) have to choose :
1. Create and maintain a BanKAccountTotal docType
2. Provide some part of its source code to be included as a service of the DS. Services of the DS should be given a clear Name and Description and have associated permissions (as was done with mail sending to / from user).

In the future, we could also imagine expanding the notion of service to apps, ie. an app could declare some of its server routes as services in its manifest, but without proper supervision, it means a poorly coded app with a service could leak its permissions to other apps.

### Transition between apps

e.g.:
- Mails -> Contacts: open a contact
- _any_ -> Mails: open a mail in composer
- search -> _any_: open a search result in a dedicated app

All of the kind of communications are just `open` **Intent** (_2_).

# Annexes

## Code samples


```coffee
# Calendar / package.json
"intent": [
    {
        name: 'open',
        docType: 'binary'
        mime: 'text/calendar',
        disposition: "inline"
    },
    {
        name: 'open'
        docType: 'event'
        disposition: "window"
    }
]

# Calendar / index.html
cozysdk.setIntentHandler (intent) ->
    if intent.type is 'open' and intent.data.mime is 'text/calendar'
        importICS intent.data.blob
    else if intent.type is 'open' and intent.data.docType is 'event'
        app.router.navigate "events/#{intent.data.id}"

# Mail
cozysdk.setIntentHandler (intent) ->
    if intent.type is 'new' and intent.data.docType is 'message'
        app.currentlyEditedMessage = new Message(intent.data)
        app.router.navigate 'compose/new'

# Mails try find an app to open a binary (home handles fetching binary's mime)
cozysdk.startActivity 'cozy.io/activities/open',
    docType: 'binary'
    id: 'idofattachmentbinary'
    # or with a blob
    blob: 'base64attachment'

# Any want to create an event (probably handled by cozy-calendar)
cozysdk.startActivity 'cozy.io/activities/new',
    docType: 'event'
    start: '...'
    end: '...'

# Mails want to save an ics binary, home offers to pick between file & calendar
cozysdk.startActivity 'cozy.io/activities/save',
    docType: 'binary'
    id: 'idofattachmentbinary'


cozysdk.startActivity 'cozy.io/activities/new',
    docType: 'event'
    start: '...'
    end: '...'

# Mails
cozysdk.startActivity 'http://cozy.io/activities/new',
    docType: 'contact'
    fn: 'Bob'
    email: ''

cozysdk.startActivity 'http://cozy.io/activities/new',
    docType: 'file'
    binaries: {id: 'idofmailattachmentbinary'}

```


## Intent APIs

There was two competing standard for intents on the web :

- [Web Intents](http://webintents.org/) , Google project, used in chrome, focus on web pages.
    - *pro* use extensible semantic intent names
    - *con* the app/webpage needs to be open once to know which intents it
    handles.

```javascript
// register in HTML
<intent action="https://webintent.org/edit" type="image/*"
        href="image/edit.html" disposition="inline">
// handle in image/edit.html
window.intent?.data.blob
window.intent.postResult()

intent = new Intent('https://webintent.org/edit', "image/jpg", {blob: "939293..."})
window.startActivity(intent, onsuccess, onfailure)
```


- [Web Activities](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS/API/Web_Activities) , Firefox project, used in Firefox OS, focus on integrated web apps
    - *pro* define intent handling in manifest

```javascript
// handling in manifest
intent:
    "edit":
        href:"./image/edit.html"
        disposition: "inline"
        returnValue: true
        filter: { type: ["image/*"]
// handling in image/edit.html
navigator.setMessageHandler('activity', function(actRequest){
    actRequest.source.blob
    actRequest.postResult({})
})
// using
activity = new Activity({
  name: "edit",
  data: { type: "image/jpeg", blob:"90932.." }
});
activity.onsuccess = /*and*/ activity.onerror =
```

Now both are dead and none is used.

In the end, we will probably end up defining our own, which should be close to webactivities as it match our use case better (applications, allow to back and forth between already open applications, ect ..)

As an example to be debated :
```coffee
# Intent registering : intents are defined in package.json
intent: [IntentDefinition]
IntentHandlingDefinition = {
    name: "http://cozy.io/activities/xxx"
    disposition: "inline" or "window" # display in-popup or open app
    returnValue: # does this intent returns something (2) or not (1)
    href: # which page of the application should we open. Default to index.
    filter:
        field1: "value" # intent.data.field1 should equal "value"
        field2: ["A", "B"] # intent.data.field2 should be A or B
        field3: "image/*" # intent.data.field3 should start with image/ {???}
}

# Intent handling
cozysdk.setIntentListener (intent) ->
    console.log intent.name, intent.data, intent.returnValue
    if intent.returnValue
        intent.done err, result
    # or with promises
    return new Promise(...)

# Intent calling
cozysdk.startActivity name, data, callback
# or with promises
pResult = cozysdk.startActivity name, data
# or if we dont expect result
cozysdk.startActivity name, data  
```


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
