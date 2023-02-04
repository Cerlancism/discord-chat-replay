// ==UserScript==
// @name         Discord Chat Replay
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Rewind past Discord Chat activity in realtime.
// @author       Cerlancism
// @match        https://discord.com/channels/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=discord.com
// ==/UserScript==

//@ts-check

(function ()
{
    'use strict';
    // Your code here...
    //#region Tagged Loggers
    /**
     * @param {any[]} args
     */
    function _log(logger = console.log, ...args)
    {
        logger("[ChatReplay]", ...args)
    }
    /**
     * @param {any[]} args
     */
    function log(...args)
    {
        _log(console.log, ...args)
    }
    /**
     * @param {any[]} args
     */
    function info(...args)
    {
        _log(console.info, ...args)
    }
    /**
     * @param {any[]} args
     */
    function warn(...args)
    {
        _log(console.warn, ...args)
    }
    /**
     * @param {any[]} args
     */
    function error(...args)
    {
        _log(console.error, ...args)
    }
    //#endregion
    info("Loaded Script")

    //#region Global General Utils
    const getElementByXpath = unsafeWindow['getElementByXpath'] = function (/** @type {string} */ path)
    {
        return /** @type {Element} */ (document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
    }
    const sleepAsync = unsafeWindow['sleepAsync'] = async function (/** @type {number} */ timeMS)
    {
        return new Promise((resolve) =>
        {
            setTimeout(resolve, timeMS)
        })
    }
    //#endregion

    const MainChatXpath = `//*[@id="app-mount"]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div/div[3]/div[2]/main/div[1]/div[1]`
    const SplitChatXpath = `//*[@id="app-mount"]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div/div[6]/div[2]/section/div[1]/div`

    // Chat Replay Controller Implementation
    class ChatReplayer
    {
        loaded = false
        realTimeStart = null
        replaySpeed = 1

        /**
         * @type {Element}
         */
        currentChatElement = null
        /**
         * @type {Element}
         */
        currentThreadElement = null

        constructor()
        {
            log("Created ChatReplayer")
            this.init()
        }

        async init()
        {
            while (!this.initChatScroller())
            {
                log("Waiting Elements")
                await sleepAsync(1000)
            }
            this.loaded = true
            log("Initialised")
        }

        initChatScroller()
        {
            this.chatScroller = getElementByXpath(MainChatXpath)
            this.threadScroller = getElementByXpath(SplitChatXpath)
            if (this.chatScroller && !this.threadScroller)
            {
                warn("No Thread Split")
            }
            return !!this.chatScroller
        }

        /**
         * @param {string} link
         * @returns {Element}
         */
        getChatElement(link)
        {
            const splits = link.split("/")
            const [id, channel, ...rest] = splits.reverse()
            const element = document.querySelector(`#chat-messages-${channel}-${id}`)

            if (element && element.tagName === "LI")
            {
                return element
            }
            else
            {
                error("Chat element not found", link)
                return null
            }
        }

        /**
         * 
         * @param {Element} element 
         * @returns 
         */
        getChatTime(element)
        {
            const dateData = element.querySelector("time").getAttribute("datetime")
            return new Date(dateData)
        }

        /**
         * @param {Element} element 
         * @returns {Element}
         */
        getNextChat(element)
        {
            let sibling = (element.nextElementSibling)

            if (sibling && sibling.tagName === "LI")
            {
                return sibling
            }
            else if (sibling)
            {
                // log("getNextChat - Skipping Non <li> element", sibling.tagName)
                return this.getNextChat(sibling)
            }
            else
            {
                if (!element.previousElementSibling && element.parentElement.tagName === "DIV")
                {
                    // log("getNextChat - Jumping out wrapper", element, element.parentElement)
                    return this.getNextChat(element.parentElement)
                }
                else
                {
                    // warn("getNextChat - No more chat", element)
                    return element
                }
            }
        }

        /**
         * @param {Element} scroller
         * @param {Element} element 
         */
        scrollToChat(scroller, element)
        {
            const distance = (48 + scroller.clientHeight) - element.getBoundingClientRect().top - element.clientHeight
            const y = -distance + 30
            scroller.scrollBy({ behavior: "smooth", top: y })
            return y
        }

        /**
         * @param {string} link
         * @param {number} speed
         */
        replayFromChat(link, speed)
        {
            const element = this.getChatElement(link)

            if (!element)
            {
                throw `Chat element not found ${link}`
            }

            const timeStart = this.getChatTime(element)

            if (!this.realTimeStart)
            {
                this.realTimeStart = new Date()
                this.replaySpeed = speed
                this.chatTimeStart = timeStart
                log("Started Main", { realTime: this.realTimeStart })
                this.initChatScroller()
            }

            log("Started Chat Update", { chatStart: timeStart })

            return { timeStart, speed, element }
        }

        /**
         * @param {string} chatLink
         * @param {string} [threadLink]
         */
        startReplays(chatLink, threadLink, speed = 1)
        {
            log("Replaying", { chatLink, threadLink, speed })
            const chatReplay = this.replayFromChat(chatLink, speed)
            this.currentChatElement = chatReplay.element
            if (threadLink)
            {
                const threadReplay = this.replayFromChat(threadLink, speed)
                this.currentThreadElement = threadReplay.element
                this.scrollToChat(this.threadScroller, this.currentThreadElement)
                this.update()
                return { chatReplay, threadReplay }
            }
            else
            {
                this.scrollToChat(this.chatScroller, this.currentChatElement)
                this.update()
                return { chatReplay }
            }
        }

        stopReplays()
        {
            this.realTimeStart = null
        }

        chatUpdateRoutine()
        {
            this.updateRoutine(() => this.currentChatElement, (/** @type {Element} */ value) => this.currentChatElement = value, this.chatScroller)
        }

        threadUpdateRoutine()
        {
            this.updateRoutine(() => this.currentThreadElement, (/** @type {Element} */ value) => this.currentThreadElement = value, this.threadScroller)
        }

        /**
         * @param {() => Element} getter
         * @param {{(value: Element): Element;}} setter
         * @param {Element} scroller
         */
        updateRoutine(getter, setter, scroller)
        {
            let nextElement, nextTime
            do
            {
                const current = getter()
                nextElement = this.getNextChat(current)

                if (nextElement.tagName !== "LI")
                {
                    warn("Skipping update routine", "No LI next element")
                    break
                }

                if (current === nextElement)
                {
                    log("Breaking at same element")
                    break
                }

                nextTime = this.getChatTime(nextElement)
                if (this.chatTimeCurrent.getTime() >= nextTime.getTime())
                {
                    // log("Chat Scroll", nextTime)
                    setter(nextElement)
                    this.scrollToChat(scroller, nextElement)
                    continue
                }
                else
                {
                    break
                }
            }
            while (true)
        }

        update()
        {
            if (!this.realTimeStart)
            {
                log("Replay Stopped")
                return
            }
            const currentRealTime = new Date()
            this.realTimeElapsedMS = currentRealTime.getTime() - this.realTimeStart.getTime()
            this.chatTimeCurrent = new Date(this.chatTimeStart.getTime() + this.realTimeElapsedMS * this.replaySpeed)

            if (this.chatTimeCurrent.getTime() >= currentRealTime.getTime())
            {
                log("Replay reached current time")
                this.realTimeStart = null
                return
            }

            if (this.currentChatElement)
            {
                this.chatUpdateRoutine()
            }
            if (this.currentThreadElement)
            {
                this.threadUpdateRoutine()
            }

            requestAnimationFrame(() => this.update())
        }
    }

    // Global Variable Replay Controller
    unsafeWindow['chatReplay'] = new ChatReplayer();
})();