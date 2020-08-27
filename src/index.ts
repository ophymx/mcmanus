import * as mineflayer from 'mineflayer';
import { promises } from 'fs';
import * as mcrealms from './mcrealms';
import { exit } from 'process';

interface LoginDetails {
  host?: string
  port?: number
  realm?: string
  username: string
  password: string
}

function mcmanus(options: mineflayer.BotOptions): Promise<void> {
  options.logErrors = true;
  options.version = mcrealms.MC_VERSION;

  const bot = mineflayer.createBot(options);

  return new Promise((resolve, reject) => {
    bot.on('chat', (username: string, message: string, translate: string, jsonMsg: string, matches: string[]): void => {
      if (username == bot.username) {
        return;
      }
      const command = message.trim().split(" ");
      if (command[0].toLowerCase() !== "mcmanus") {
        return;
      }
      if (command.length === 1) {
        bot.chat("what?");
        return;
      }
      switch (command[1]) {
        case "coords":
          bot.chat(bot.player.entity.position.floored().toString());
          break;
        case "echo":
          bot.chat(command.slice(2).join(" "));
          break;
        case "help":
          bot.chat("coords | echo | help");
          break;
        default:
          bot.chat("wat? " + message);
          break;
      }
    });
  
    bot.on('login', () => console.log('logged in'));
  
    bot.on('kicked', (reason, loggedIn) => {
      console.log(reason, loggedIn)
      reject(reason);
    });
  
    bot.on('error', err => {
      console.log(err);
      reject(err);
    });
  });

}

promises.readFile('mcmanus.json')
  .then((buffer) => JSON.parse(buffer.toString()))
  .then((login) => {
    if (login.realm) {
      return mcrealms.login(login.username, login.password)
      .then((client) => client.worlds()
        .then((worlds) => {
          const server = worlds.servers.find(server => server.name === login.realm)
          if (server) {
            return client.join(server.id);
          }
          return Promise.reject('realm not found');
        })
        .then((joinInfo) => {
          const address = joinInfo.address.split(':')
          login.host = address[0]
          login.port = parseInt(address[1])
          return login;
        }))
    }
    return login;
  })
  .then((login) => {
    console.log("joining", {
      realm: login.realm,
      address: login.host + ':' + login.port
    });
    return mcmanus(login);
  })
  .catch((reason) => {
    console.log(reason)
    exit();
  });