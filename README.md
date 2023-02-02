# Discord Chat Replay
Rewind past Discord chat activity in realtime.

## Usability Status
Tampermonkey script

## Features
- Chat replay with speed multiplier
- Split view panel support

## How to use
Load as Tampermonkey script. In browser console:

**Start Replays**
```js
chatReplay.startReplays(<Main chat message URL>, <Split panel message URL (Optional)> | undefined, replaySpeed)
```

**Stop Replays**
```js
chatReplay.stopReplays()
```

## Demo
https://user-images.githubusercontent.com/28769707/216288166-a9ef319d-2400-4941-92ec-0eaa3c774be4.mp4

## ChatGPT Documentation
This script is a Tampermonkey script that modifies the behavior of a web page in a browser. The script adds a `ChatReplayer` class to the page that allows to play chat messages.

It first sets up logging functions for different log levels (_log, log, info, warn, error) that log messages with the tag "[ChatReplay]" and the provided arguments.

Then it defines some utility functions, such as:

`getElementByXpath`: a function that finds the first element that matches the provided XPath.  
`sleepAsync`: a function that creates a delay.  

After that, it defines some constant XPath selectors to locate elements in the page.  

Finally, the `ChatReplayer` class is defined, with methods that control the playback of chat messages, including:  

- `init`: this method sets up the chat scroller and waits for elements to be ready.
- `initChatScroller`: this method locates the chat scroller and thread scroller elements.
- `getChatElement`: this method finds the chat element by link.
- `getChatTime`: this method gets the time of a chat.
- `getNextChat`: this method finds the next chat element.

This script appears to be a Tampermonkey user script for Discord. Tampermonkey is a browser extension that allows you to execute JavaScript code on web pages. This script specifically modifies the behavior of Discord in a web browser.

The script starts by creating a series of functions to log different types of messages to the JavaScript console. These functions are tagged loggers and include log(), info(), warn(), and error().

Then, the script defines some utility functions. One function, "getElementByXpath", allows you to get an HTML element from the page using an XPath expression. Another function, "sleepAsync", allows you to pause the execution of the script for a specified number of milliseconds.

After that, the script defines two XPath expressions that are used to locate the chat area in Discord.

The bulk of the script is an implementation of a class called ChatReplayer. The ChatReplayer class is responsible for replaying chat logs in Discord. It has a constructor function that calls the init() function and sets some initial values. The init() function waits until the chat area is loaded on the page and then sets the "loaded" property to true.

The ChatReplayer class also has functions to get information about individual chat messages, such as the time a message was sent, the element that represents a message, and the next message in the chat log.

This script does not actually start the chat replay process, it only provides the infrastructure for it. To actually use this script, you would need to write additional code to interact with the ChatReplayer class and start the replay process.
