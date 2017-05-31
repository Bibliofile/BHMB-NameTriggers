/*jshint
    esversion: 6,
    browser: true,
    unused: strict,
    undef: true,
    devel: true
*/

/*globals
    MessageBot
*/

MessageBot.registerExtension('bibliofile/name_triggers', function(ex, world) {
    function getMessages() {
        return world.storage.getObject('biblio_name_triggers_messages', []);
    }
    function getPrefs() {
        return world.storage.getObject('biblio_name_triggers_preferences', { exactMatch: false });
    }

    function listener(player) {
        var exact = getPrefs().exactMatch;

        getMessages().forEach(function(msg) {
            var target = msg.trigger.toLocaleUpperCase();

            if (exact && player.getName() == target) {
                ex.bot.send(msg.message, { name: player.getName(), ip: player.getIP() });
            }
            if (!exact && player.getName().includes(target)) {
                ex.bot.send(msg.message, { name: player.getName(), ip: player.getIP() });
            }
        });
    }
    world.onJoin.sub(listener);

    ex.uninstall = function() {
        world.onJoin.unsub(listener);
        world.storage.clearNamespace('biblio_name_triggers');
    };

    // Browser only
    if (ex.isNode || !ex.bot.getExports('ui')) return;

    var ui = ex.bot.getExports('ui');
    var tab = ui.addTab('Name Triggers', 'messages');
    tab.innerHTML = '<template> <div class="column is-half-tablet is-one-third-desktop"> <div class=box> <label> When the player&apos;s name contains <input class="input t"> </label> <label> say <input class="input m"> </label> <br> <a>Delete</a> </div> </div> </template> <div class="container is-fluid"> <section class="is-small section"> <span class="button is-primary is-pulled-right">+</span> <h3>These are checked when a player joins the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <label>Exact name match: <input class=checkbox type=checkbox></label> </section> <div class="columns is-multiline"style="border-top:1px solid #000"></div> </div> ';

    var container = tab.querySelector('.columns');
    if (getPrefs().exactMatch) {
        tab.querySelector('input').checked = true;
    }
    getMessages().forEach(addMessage);

    function addMessage(msg) {
        ui.buildTemplate(tab.querySelector('template'), container, [
            {selector: '.m', value: msg.message},
            {selector: '.t', value: msg.trigger}
        ]);
    }

    // Deleting messages
    tab.addEventListener('click', function(event) {
        if (event.target.tagName != 'A') return;
        event.stopPropagation();

        ui.alert('Really delete this message?', [
            { text: 'Delete', style: 'is-danger' },
            { text: 'Cancel' }
        ], function(result) {
            if (result == 'Delete') {
                event.target.parentElement.remove();
                save();
            }
        });
    });

    // Adding messages
    tab.querySelector('.button').addEventListener('click', function() {
        addMessage({trigger: '', message: ''});
    });

    tab.addEventListener('change', save);
    function save() {
        var messages = [];
        Array.from(container.children).forEach(function(child) {
            messages.push({
                message: child.querySelector('.m').value,
                trigger: child.querySelector('.t').value
            });
        });
        world.storage.set('biblio_name_triggers_messages', messages);

        world.storage.set('biblio_name_triggers_preferences', {
            exactMatch: tab.querySelector('input').checked
        });
    }

    ex.uninstall = (function(orig) {
        return function() {
            orig();
            ui.removeTab(tab);
        };
    }(ex.uninstall));
});
