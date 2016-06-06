/*jshint
    esversion: 6,
    browser: true
*/

/*globals
    MessageBotExtension
*/

var biblio_name_triggers = MessageBotExtension('biblio_name_triggers');

(function() {
    //Setup
    var _this = this;

    try {
        this.messages = JSON.parse(localStorage.getItem(this.id + '_messages' + window.worldId));
    } catch(e) {
        this.messages = [];
    } finally {
        if (this.messages === null) {
            this.messages = [];
        }
    }
    var currentID = 0;
    var template = '<label>When the player\'s name contains </label><input class="t" value="{{trigger}}"/><label> say </label><input class="m" value="{{message}}"/><br> <a>Delete</a>';

    this.addTab('Name Triggers', 'name_triggers', "msgs");

    var tab = document.querySelector('#mb_' + this.id + '_name_triggers');

    tab.innerHTML = '<h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span><div id="name_triggers_Msgs"></div>';

    var container = tab.querySelector('#name_triggers_Msgs');



    this.debug = function() {
        return container;
    };

    //When uninstalled, remove messages and tab
    this.uninstall = function() {
        //Remove the tab
        _this.ui.removeTab(_this.id + '_name_triggers');

        //Remove stored messages
        Object.keys(localStorage).forEach(function(key) {
            if (key.indexOf(_this.id + '_messages')) {
                localStorage.removeItem(key);
            }
        });
    };

    //Load saved config
    this.messages.forEach(addMessage);

    this.saveConfig = function() {
        // console.log('Saving config.', container.children.length);
        _this.messages = [];
        Array.from(container.children).forEach(function(child) {
            _this.messages.push({
                message: child.querySelector('.m').value,
                trigger: child.querySelector('.t').value
            });
        });
        localStorage.setItem(_this.id + '_messages' + window.worldId, JSON.stringify(_this.messages));
    };

    //To add a message to the page. obj must be in the format {trigger: 'something', message: 'something'}
    function addMessage(obj) {
        var div = document.createElement('div');
        div.classList.add('msg');
        div.id = nextID();
        div.innerHTML = template.replace(/{{trigger}}/g, obj.trigger).replace(/{{message}}/g, obj.message);

        container.appendChild(div);

        div.querySelector('a').addEventListener('click', deleteMessage);
    }

    function deleteMessage(event) {
        bot.ui.alert('Really delete this message?',
                    [
                        {text: 'Delete', style: 'danger', thisArg: event.target.parentElement, action: function() {
                            this.remove();
                            biblio_name_triggers.saveConfig();
                        }},
                        {text: 'Cancel'}
                    ]);
        event.stopPropagation();
    }

    //Adds an empty message to the page.
    function addEmptyMessage() {
        addMessage({trigger: '', message: ''});
    }

    //Gets the next ID to uniquely identify a message.
    function nextID() {
        return 'name_triggers_' + currentID++;
    }

    //Wait for user input
    tab.querySelector('.add').addEventListener('click', addEmptyMessage);
    container.addEventListener('change', this.saveConfig);

    this.send = function(msg, data) {
        _this.core.send(
            msg.replace(/{{NAME}}/g, data.name)
                .replace(/{{name}}/g, data.name.toLocaleLowerCase())
                .replace(/{{Name}}/g, data.name[0] + data.name.substr(1).toLocaleLowerCase())
                .replace(/{{ip}}/gi, data.ip)
        );
    }

    this.addJoinListener('name_triggers', function(data) {
        // console.log(data);
        _this.messages.forEach(function(msg) {
            if (data.name.indexOf(msg.trigger.toLocaleUpperCase()) != -1) {
                _this.send(msg.message, data);
            }
        });
    });
}.call(biblio_name_triggers));
