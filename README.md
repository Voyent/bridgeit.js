voyent.js
===========

Voyent.js combined with the BridgeIt utility application is the easiest way for you to add powerful native capabilities to your HTML5 applications. A simple JavaScript API gives you access to native features like the camera, microphone, address book and more…

### Web Site
Find everything you need at [bridgeit.mobi](http://bridgeit.mobi).

### Demos

* [jQuery Mobile BridgeIt Demo](http://bridgeit.github.io/demo-jqm/)
* [Vanilla JavaScript Mobile BridgeIt Demo](http://bridgeit.github.io/demo-vanilla/)

### Getting Started With Voyent & BridgeIt
1) Add voyent.js to your page.
```html
<head>
    ...
    <script src="../bower_components/voyent.js/src/voyent.js"></script>
</head>
```
2) Attach a Voyent call/callback to some action element on your page.  For instance, a button to retrieve a contact from the address book...
```html
<a type="button" onclick="voyent.fetchContact('myId','callback');">
    Fetch a Contact
</a>
```
3) Load your page in a supported mobile device.  When you activate the native feature in your page you will be prompted to install the BridgeIt utility app (if you don't already have it), and presto, your application is now Voyent-enabled.

### Native Applications
The BridgeIt utility app must be installed on devices that access your application, but it is not necessary for BridgeIt to be pre-installed for your application to work. Voyent is designed to initiate the installation of the BridgeIt utility app on the users mobile device if it is not already installed.  If you prefer to install it manually, you can get the utility app for your device from your favourite app store. 
* [Apple App Store](https://itunes.apple.com/app/bridgeit/id727736414)
* [Google Play](https://play.google.com/store/apps/details?id=mobi.bridgeit)
* [Window Phone](http://www.windowsphone.com/en-ca/store/app/bridgeit/b9a1b29f-2b30-4e5d-9bf1-f75e773d74e1)
