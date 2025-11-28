import Ember from 'ember';
import Component from '@ember/component';
import config from 'frontend-cp/config/environment';

export default Component.extend({
    didInsertElement() {
        if (Ember.testing) {
            return;
        }

        injectMessenger(document, {});
    }
});

function injectMessenger(document, kayako) {
    window.kayako = kayako;

    /**
     * The ready queue to be used for holding
     * onReady methods.
     */
    kayako.readyQueue = [];

    /**
     * Pushing onready methods to the ready queue
     */
    kayako.ready = fn => kayako.readyQueue.push(fn);

    /**
     * Private kayako settings object generated when creating
     * the messenger tag. Ofcourse anyone can update it
     * since JS is not private itself :p
     */
    kayako._settings = {
        messengerUrl: config.messengerSupportUrl,
        apiUrl: config.messengerSupportApiUrl,
        socketInstance: config.messengerSupportInstanceName
    };

    /**
     * Creating a sandbox iframe to inject the kayako build
     * javascript file. That file will handle the actual
     * boot process of the messenger.
     */
    function createInlineIframe() {
        var frame = document.createElement('iframe');
        frame.id = 'kayako-messenger-frame';
        frame.style.border = 'none';
        frame.style.width = '100%';
        frame.style.height = '100%';
        frame.style.minHeight = 'initial';
        return frame;
    }

    /**
     * Creating the script tag to be injected to the
     * iframe. The methods will be sandboxed so no
     * conflicts.
     */
    function createScriptTag() {
        var script = document.createElement('script');
        script.async = true;
        script.type = 'text/javascript';
        script.src = kayako._settings.messengerUrl;
        return script;
    }

    /**
     * Creating the messenger container div. Inside
     * this div we will boot the messenger inside
     * an iframe.
     */
    function createMessengerContainer() {
        var div = document.createElement('div');
        div.id = 'kayako-messenger';
        div.style.position = 'fixed';
        div.style.right = 0;
        div.style.bottom = 0;
        div.style.width = 0;
        div.style.height = 0;
        return div;
    }

    /**
     * Fetch messenger settings from endpoint
     *
     * @param string endpoint
     * @param  callback
     */
    function fetchSettings(endpoint, callback) {
        var xhr = new window.XMLHttpRequest();
        xhr.open('GET', endpoint, true);
        xhr.setRequestHeader('X-API-Token', '440be73f-7a9a-492f-a88b-745e5affb049');
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var settings = JSON.parse(xhr.responseText).data;
                        APICache(config.messengerSupportApiUrl, 'settings/current').set(settings);
                        callback(null, settings);
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error('Failed to parse response JSON');
                        callback(true);
                    }
                } else {
                    // eslint-disable-next-line no-console
                    console.error(xhr.statusText);
                    callback(true);
                }
            }
        };
        xhr.onerror = function () {
            // eslint-disable-next-line no-console
            console.error(xhr.statusText);
            callback(true);
        };
        xhr.send(null); // initiate the call
    }

    /**
     * Cache API response in local storage
     *
     * @param apiURL
     * @param endpoint
     */
    function APICache(apiURL, endpoint) {
        var key = 'kayako:messenger:' + apiURL + ':' + endpoint;
        var expiry = 1000 * 60 * 5;

        return {
            set: function (data) {
                try {
                    var cachedContent = {
                        timestamp: (new Date()).valueOf(),
                        data: data
                    };
                    window.localStorage.setItem(key, JSON.stringify(cachedContent));
                } catch (e) {
                    // ignore, localStorage not supported, caching not possible
                }
            },
            retrieve: function () {
                try {
                    var stringifiedContent = window.localStorage.getItem(key);
                    if (!stringifiedContent) {
                        return null;
                    }
                    var cachedContent = JSON.parse(stringifiedContent);
                    if ((cachedContent.timestamp + expiry) > (new Date().valueOf())) {
                        return cachedContent.data;
                    }
                    window.localStorage.removeItem(key);
                    return null;
                } catch (e) {
                    return null;
                }
            }
        };
    }

    /**
     * Apply settings to initiate messenger
     *
     * @param err
     * @param settings
     */
    function loadSettings(err, settings) {
        var getReplyTimeLocale = function (replyTimeExpectation) {
            if (replyTimeExpectation === null) {
                return '';
            }
            var expectationToLocaleMap = {
                AUTO: '',
                ASAP: 'reply.asap',
                FEW_MINS: 'reply.in.few.minutes',
                FEW_HOURS: 'reply.in.few.hours'
            };
            return expectationToLocaleMap[replyTimeExpectation];
        };

        if (!err) {
            // we replace the settings
            window.kayako._settings.homeTitles = settings.home_titles;
            window.kayako._settings.homeSubtitles = settings.home_subtitles;
            window.kayako._settings.widgets = settings.metadata.widgets;
            window.kayako._settings.styles = settings.metadata.styles;
            window.kayako._settings.replyTimeLocale = getReplyTimeLocale(settings.reply_time_expectation);
            window.kayako._settings.teamName = settings.brand.name;
            window.kayako._settings.businessHour = settings.businesshour;
            window.kayako._settings.enableSuggestions = settings.enable_suggestions;
        }

        if (window.kayako && window.kayako.config) {
            // override _settings in [embed code] or [those from api] with locally defined customizations if any
            window.kayako._settings = mergeRecursive(window.kayako._settings, window.kayako.config);
        }

        insertIframe();
    }

    /**
     * Recursively merge properties of two objects, from source object to destination object
     * @param object destination
     * @param object source
     */
    function mergeRecursive(destination, source) {
        for (var prop in source) {
            if (destination.hasOwnProperty(prop) && destination[prop].constructor === Object && source[prop].constructor === Object) {
                destination[prop] = mergeRecursive(destination[prop], source[prop]);
            } else {
                destination[prop] = source[prop];
            }
        }
        return destination;
    }

    /**
     * The initial messenger boot up function
     */
    function boot() {
        var apiUrl = config.messengerSupportApiUrl;
        var settingsCache = APICache(apiUrl, 'settings/current');
        var settings = settingsCache.retrieve();
        if (settings) {
            loadSettings(false, settings);
            return;
        }
        var settingsEndpoint = apiUrl + '/messenger/settings/current?include=locale_field,brand,business_hour,businesshour_holiday';
        fetchSettings(settingsEndpoint, loadSettings);
    }

    /**
     * Insert the messenger iframe in the application
     */
    function insertIframe() {
        /**
         * Selecting the script tag where to start inserting
         * elements
         */
        var parent = document.body.getElementsByTagName('script')[0];

        /**
         * Creating iframe
         */
        var iframe = createInlineIframe();

        /**
         * Creating messenger container. A top level div
         * is required to maintain the size of the
         * messenger.
         */
        var messengerContainer = createMessengerContainer();

        /**
         * Appending messenger container
         */
        parent.parentNode.insertBefore(messengerContainer, parent);

        /**
         * Appending iframe
         */
        messengerContainer.appendChild(iframe, parent);

        iframe.contentWindow.document.open('text/html', 'replace');
        iframe.contentWindow.document.write('<!DOCTYPE html>');
        iframe.contentWindow.document.write('<html>');
        iframe.contentWindow.document.write('<head></head>');
        iframe.contentWindow.document.write('<body></body>');
        iframe.contentWindow.document.write('</html>');
        iframe.contentWindow.document.body.appendChild(createScriptTag());
        iframe.contentWindow.document.close();
    }

    //initialize messenger
    boot();
}

