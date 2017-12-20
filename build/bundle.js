(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@bhmb/bot')) :
	typeof define === 'function' && define.amd ? define(['@bhmb/bot'], factory) :
	(factory(global['@bhmb/bot']));
}(this, (function (bot) { 'use strict';

var html = "<template>\r\n  <div class=\"box\">\r\n    <div class=\"columns\">\r\n      <div class=\"column is-narrow\">\r\n        <p class=\"has-text-weight-bold\">Name</p>\r\n      </div>\r\n      <div class=\"column is-2-desktop\">\r\n        <input class=\"input is-small\" data-target=\"trigger\">\r\n      </div>\r\n      <div class=\"column is-narrow\">\r\n        <p class=\"has-text-weight-bold\">Message</p>\r\n      </div>\r\n      <div class=\"column\">\r\n        <textarea class=\"textarea is-small is-fluid\" data-target=\"message\"></textarea>\r\n      </div>\r\n      <div class=\"column is-narrow\">\r\n        <button class=\"button is-small is-danger is-outlined\" data-do=\"delete\">Delete</button>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</template>\r\n\r\n<div class=\"container is-widescreen\">\r\n  <section class=\"section is-small\">\r\n    <span class=\"button is-primary is-adding-message\" title=\"Add message\">+</span>\r\n    <h3 class=\"title is-4\">Name Triggers</h3>\r\n    <label>Exact match: <input type=\"checkbox\"></label>\r\n    <ul>\r\n      <li>The name will be checked when a player joins the server.</li>\r\n      <li>If exact match is turned on, the player's name must match exactly, otherwise it need only contain the name listed here.</li>\r\n      <li>{{NAME}}, {{Name}}, and {{name}} in the message will be replaced with the user's name.</li>\r\n    </ul>\r\n  </section>\r\n\r\n  <div class=\"messages-container\"></div>\r\n</div>\r\n";

function findParentWithClass(element, className) {
    if (element.classList.contains(className))
        return element;
    return findParentWithClass(element.parentElement, className);
}
bot.MessageBot.registerExtension('bibliofile/name_triggers', function (ex, world) {
    const getMessages = () => ex.storage.get('messages', []);
    const getPreferences = () => ex.storage.get('preferences', { exactMatch: false });
    function listener(player) {
        const { exactMatch } = getPreferences();
        for (const { trigger, message } of getMessages()) {
            const target = trigger.toLocaleUpperCase();
            if (exactMatch && player.name == target) {
                ex.bot.send(message, { name: player.name, ip: player.ip });
            }
            if (!exactMatch && player.name.includes(target)) {
                ex.bot.send(message, { name: player.name, ip: player.ip });
            }
        }
    }
    world.onJoin.sub(listener);
    ex.remove = () => {
        world.onJoin.unsub(listener);
    };
    // Browser only
    const ui = ex.bot.getExports('ui');
    if (!ui)
        return;
    const tab = ui.addTab('Name Triggers', 'messages');
    tab.innerHTML = html;
    const exactBox = tab.querySelector('input[type=checkbox]');
    const container = tab.querySelector('.messages-container');
    if (getPreferences().exactMatch) {
        exactBox.checked = true;
    }
    const addMessage = ({ trigger, message }) => {
        ui.buildTemplate(tab.querySelector('template'), container, [
            { selector: '[data-target=trigger]', value: trigger },
            { selector: '[data-target=message]', value: message }
        ]);
    };
    // Deleting messages
    tab.addEventListener('click', event => {
        const target = event.target;
        if (!target.matches('.is-danger'))
            return;
        findParentWithClass(target, 'box').remove();
        save();
    });
    // Adding messages
    tab.querySelector('.is-adding-message').addEventListener('click', () => {
        addMessage({ trigger: '', message: '' });
    });
    const save = () => {
        const messages = [];
        Array.from(container.children).forEach(child => {
            messages.push({
                message: child.querySelector('[data-target=message]').value,
                trigger: child.querySelector('[data-target=trigger]').value
            });
        });
        ex.storage.set('messages', messages);
        ex.storage.set('preferences', {
            exactMatch: exactBox.checked
        });
    };
    tab.addEventListener('change', save);
    ex.remove = (orig => () => {
        orig();
        ui.removeTab(tab);
    })(ex.remove);
    getMessages().forEach(addMessage);
});

})));
