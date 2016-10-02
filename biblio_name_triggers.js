/*jshint
    esversion: 6,
    browser: true
*/

/*globals
    MessageBotExtension
*/

var biblio_name_triggers = MessageBotExtension('biblio_name_triggers');

(function(ext) {
    ext.setAutoLaunch(true);
    ext.uninstall = function() {
        //Remove the tab
        ext.ui.removeTab(ext.tab);

        //Remove saved messages
        ext.storage.clearNamespace(ext.id);

        //Remove listeners
        ext.hook.remove('world.join', nameCheck);
    };

    //Setup
    var messages = ext.storage.getObject(ext.id + '_messages', []);

    ext.tab = ext.ui.addTab('Name Triggers', 'messages');


    var style = "<style>.name_triggers_box input { width: calc(100% - 10px);border: 2px solid #666;} #name_triggers_msgs { padding-top: 8px; margin-top: 8px; border-top: 1px solid; height: calc(100vh - 180px);}</style>";
    var template = '<template id="' + ext.id + '_template" style="display:none;"><div class="third-box name_triggers_box"><label>When the player\'s name contains </label><input class="t" value=""/><label> say </label><input class="m" value=""/><br> <a>Delete</a></div></template>';

    ext.tab.innerHTML = style + template + '<h3 style="margin: 0 0 5px 0;">These are checked when a player joins the server.</h3><span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="top-right-button add">+</span><div id="name_triggers_msgs"></div>';

    //IE 9 fix
    (function(template) {
        var content = template.childNodes;
        var fragment = document.createDocumentFragment();

        for (var i = 0; i < content.length; i++) {
            fragment.appendChild(content[i]);
        }

        template.content = fragment;
    }(ext.tab.querySelector('template')));

    var container = ext.tab.querySelector('#name_triggers_msgs');

    //Load saved config
    messages.forEach(addMessage);

    ext.saveConfig = function() {
        messages = [];
        Array.from(container.children).forEach(function(child) {
            messages.push({
                message: child.querySelector('.m').value,
                trigger: child.querySelector('.t').value
            });
        });
        ext.storage.set(ext.id + '_messages', messages);
    };

    //To add a message to the page. obj must be in the format {trigger: 'something', message: 'something'}
    function addMessage(obj) {
        ext.ui.buildContentFromTemplate('#' + ext.id + '_template', '#name_triggers_msgs',
        [
            {selector: '.m', value: obj.message},
            {selector: '.t', value: obj.trigger}
        ]);

        ext.tab.querySelector('#name_triggers_msgs > div:last-of-type a').addEventListener('click', deleteMessage);
    }

    function deleteMessage(event) {
        ext.ui.alert('Really delete this message?',
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
    ext.tab.querySelector('.add').addEventListener('click', function() {
        addMessage({trigger: '', message: ''});
    });

    //Save config when messages changed
    container.addEventListener('change', ext.saveConfig);

    function send(msg, name, ip) {
        ext.bot.send(
            msg.replace(/{{NAME}}/g, name)
                .replace(/{{name}}/g, name.toLocaleLowerCase())
                .replace(/{{Name}}/g, name[0] + name.substr(1).toLocaleLowerCase())
                .replace(/{{ip}}/gi, ip)
        );
    }

    function nameCheck(name, ip) {
        messages.forEach(function(msg) {
            if (name.toLocaleUpperCase().includes(msg.trigger.toLocaleUpperCase())) {
                send(msg.message, name, ip);
            }
        });
    }

    ext.hook.listen('world.join', nameCheck);
}(biblio_name_triggers));
