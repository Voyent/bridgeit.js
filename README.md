bridgeit.js
===========

BridgeIt is the easiest way for you to add powerful native capabilities to your HTML5 applications. A simple JavaScript API gives you access to native features like the camera, microphone, address book and more…

### Web Site
Find everything you need at [bridgeit.mobi](http://bridgeit.mobi).

### Demos

* [jQuery Mobile BridgeIt Demo](http://bridgeit.github.io/demo-jqm/)
* [Vanilla JavaScript Mobile BridgeIt Demo](http://bridgeit.github.io/demo-vanilla/)

### Getting Started With BridgeIt
1) Add bridgeit.js to your page.

    <head>
        ...
        <script type="application/x-javascript" src="http://api.bridgeit.mobi/bridgeit/bridgeit.js"></script>
    </head>

2) Attach a BridgeIt call/callback to some action element on your page.  For instance, a button to retrieve a contact from the address book...

    <a type="button" onclick="bridgeit.fetchContact('myId','callback');">
       Fetch a Contact
    </a>

3) Load your page in a supported mobile device.  When you activate the native feature in your page you will be prompted to install the BridgeIt native application (if you don't already have it), and presto, your application is now BridgeIt-enabled.

### Native Applications
The BridgeIt native application must be installed on devices that access your application, but it is not necessary for BridgeIt to be pre-installed for your application to work.  BridgeIt is designed to initiate the installation of the native BridgeIt application on the users mobile device if it is not already installed.  If you prefer to install it manually, you can get the native application for your device from your favourite app store. 
* [Apple App Store](https://itunes.apple.com/app/bridgeit/id727736414)
* [Google Play](https://play.google.com/store/apps/details?id=mobi.bridgeit)
* Window Phone
