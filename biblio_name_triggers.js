/*jshint
    esversion: 6,
    browser: true
*/

/*globals
    MessageBotExtension
*/

var biblio_name_triggers = MessageBotExtension('biblio_name_triggers');

(function(ex) {
    ex.setAutoLaunch(true);
    ex.uninstall = function() {
        //Remove the tab
        ex.ui.removeTab(ex.tab);

        //Remove saved messages
        ex.storage.clearNamespace(ex.id);

        //Remove listeners
        ex.hook.remove('world.join', nameCheck);
    };

    //Setup
    var messages = ex.storage.getObject(ex.id + '_messages', []);
    var preferences = ex.storage.getObject(ex.id + '_preferences', {exactMatch: false});

    ex.tab = ex.ui.addTab('Name Triggers', 'messages');

    ex.tab.innerHTML = '<style>#name_triggers_msgs{padding-top: 8px; margin-top: 8px; border-top: 1px solid;}</style><template id="biblio_name_triggers_template" style="display:none;"> <div class="column is-one-third-desktop is-half-tablet"> <div class="box"> <label> When the player&apos;s name contains <input class="input t" value=""/> </label> <label> say <input class=" input m" value=""/> </label> <br><a>Delete</a> </div></div></template><div class="container is-fluid"> <section class="section is-small"> <span class="button is-primary is-pulled-right">+</span> <h3>These are checked when a player joins the server.</h3> <span>You can use{{Name}},{{NAME}},{{name}}, and{{ip}}in your message.</span> <label>Exact name match: <input class="checkbox" type="checkbox"/></label> </section></div><div id="name_triggers_msgs" class="columns is-multiline"></div>';
    var container = ex.tab.querySelector('#name_triggers_msgs');

    //Load saved config
    messages.forEach(addMessage);
    if (preferences.exactMatch) {
        ex.tab.querySelector('input').checked = true;
    }

    ex.saveConfig = function() {
        messages = [];
        Array.from(container.children).forEach(function(child) {
            messages.push({
                message: child.querySelector('.m').value,
                trigger: child.querySelector('.t').value
            });
        });
        preferences.exactMatch = ex.tab.querySelector('input').checked;

        ex.storage.set(ex.id + '_preferences', preferences);
        ex.storage.set(ex.id + '_messages', messages);
    };

    //To add a message to the page. obj must be in the format {trigger: 'something', message: 'something'}
    function addMessage(obj) {
        ex.ui.buildContentFromTemplate('#' + ex.id + '_template', '#name_triggers_msgs',
        [
            {selector: '.m', value: obj.message},
            {selector: '.t', value: obj.trigger}
        ]);

        ex.tab.querySelector('#name_triggers_msgs > div:last-of-type a').addEventListener('click', deleteMessage);
    }

    function deleteMessage(event) {
        ex.ui.alert('Really delete this message?',
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
    ex.tab.querySelector('.button').addEventListener('click', function() {
        addMessage({trigger: '', message: ''});
    });

    //Save config when messages changed
    ex.tab.addEventListener('change', ex.saveConfig);

    function send(msg, name, ip) {
        ex.bot.send(
            msg.replace(/{{NAME}}/g, name)
                .replace(/{{name}}/g, name.toLocaleLowerCase())
                .replace(/{{Name}}/g, name[0] + name.substr(1).toLocaleLowerCase())
                .replace(/{{ip}}/gi, ip)
        );
    }

    function nameCheck(name, ip) {
        messages.forEach(function(msg) {
            if (preferences.exactMatch && name.toLocaleUpperCase() == msg.trigger.toLocaleUpperCase()) {
                send(msg.message, name, ip);
            }
            if (!preferences.exactMatch && name.toLocaleUpperCase().includes(msg.trigger.toLocaleUpperCase())) {
                send(msg.message, name, ip);
            }
        });
    }

    ex.hook.listen('world.join', nameCheck);
}(biblio_name_triggers));
