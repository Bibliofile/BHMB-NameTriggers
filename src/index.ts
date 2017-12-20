import { MessageBot, Player } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'

interface Message {
  message: string
  trigger: string
}

interface Preferences {
  exactMatch: boolean
}

import html from './tab.html'

function findParentWithClass(element: HTMLElement, className: string): HTMLElement {
  if (element.classList.contains(className)) return element
  return findParentWithClass(element.parentElement!, className)
}

MessageBot.registerExtension('bibliofile/name_triggers', function (ex, world) {
  const getMessages = () => ex.storage.get<Message[]>('messages', [])
  const getPreferences = () => ex.storage.get<Preferences>('preferences', { exactMatch: false })

  function listener(player: Player) {
    const { exactMatch } = getPreferences()

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
    world.onJoin.unsub(listener)
  }

  // Browser only
  const ui = ex.bot.getExports('ui') as UIExtensionExports | undefined
  if (!ui) return;

  const tab = ui.addTab('Name Triggers', 'messages');
  tab.innerHTML = html

  const exactBox = tab.querySelector('input[type=checkbox]') as HTMLInputElement
  const container = tab.querySelector('.messages-container') as HTMLDivElement

  if (getPreferences().exactMatch) {
    exactBox.checked = true
  }

  const addMessage = ({ trigger, message }: Message) => {
    ui.buildTemplate(tab.querySelector('template')!, container, [
      { selector: '[data-target=trigger]', value: trigger },
      { selector: '[data-target=message]', value: message }
    ]);
  }

  // Deleting messages
  tab.addEventListener('click', event => {
    const target = event.target as HTMLElement
    if (!target.matches('.is-danger')) return

    findParentWithClass(target, 'box').remove()
    save()
  })

  // Adding messages
  tab.querySelector('.is-adding-message')!.addEventListener('click', () => {
    addMessage({ trigger: '', message: '' })
  })

  const save = () => {
    const messages: Message[] = [];
    Array.from(container.children).forEach(child => {
      messages.push({
        message: (child.querySelector('[data-target=message]') as HTMLInputElement).value,
        trigger: (child.querySelector('[data-target=trigger]') as HTMLInputElement).value
      })
    })

    ex.storage.set('messages', messages)

    ex.storage.set('preferences', {
      exactMatch: exactBox.checked
    })
  }

  tab.addEventListener('change', save)

  ex.remove = (orig => () => {
    orig()
    ui.removeTab(tab)
  })(ex.remove)

  getMessages().forEach(addMessage);
});
