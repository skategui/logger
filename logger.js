let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB
let open = indexedDB.open("NetworkLoggerDatabase", 1)
let requestHeaders = []

open.onupgradeneeded = () => {
    let database = open.result
    database.createObjectStore("logs", { keyPath: "id", autoIncrement: true })
}

open.onsuccess = () => {
    let oldXHR = window.XMLHttpRequest.prototype.open

    window.XMLHttpRequest.prototype.open = function (method, url, async) {
        this.addEventListener('load', (event) => {
            console.log('event', event)

            let database = open.result
            let transaction = database.transaction("logs", "readwrite")
            let store = transaction.objectStore("logs")

            let canRecord = localStorage.getItem('canRecord')
            console.log('canRecord', canRecord)

            if (canRecord == 'true') {
                const today = new Date();
                let h = today.getUTCHours();
                let m = today.getUTCMinutes();
                let s = today.getUTCSeconds();
                h = checkTime(h);
                m = checkTime(m);
                s = checkTime(s);

                data = {
                    payload: getQueryParams(this.responseURL),
                    requestHeaders: requestHeaders,
                    createdAt: today,
                    createdAtFormatted: h + ":" + m + ":" + s,
                    createdAtRelative: today,
                    method: method,
                    url: url,
                    async: async,
                    response: this.response,
                    responseText: this.responseText,
                    responseType: this.responseType,
                    responseURL: this.responseURL,
                    responseXML: this.responseXML,
                    status: this.status,
                    statusText: this.statusText,
                    allResponseHeaders: this.getAllResponseHeaders(),
                }

                store.put(data)

                console.log('requestHeaders', requestHeaders)
                requestHeaders = []
            }
        })

        return oldXHR.apply(this, arguments)
    }

    let oldXHR2 = window.XMLHttpRequest.prototype.setRequestHeader

    window.XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        this.addEventListener('load', (event) => {
            console.log('catching header...')
            console.log('header', header)
            console.log('value', value)
            console.log('event', event)
            requestHeaders.push({ header: header, value: value })
        })

        return oldXHR2.apply(this, arguments)
    }
}

function checkTime(i) {
    if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
    return i;
}

function getQueryParams(url) {
    const paramArr = url.slice(url.indexOf('?') + 1).split('&');
    const params = {};

    paramArr.map(param => {
        const [key, val] = param.split('=');
        params[key] = decodeURIComponent(val);
    })

    console.log('parsed params', params)
    return params;
}