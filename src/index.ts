import * as mineflayer from 'mineflayer';
import { promises as fspromises } from 'fs';
import { exit } from 'process';

import * as mcrealms from './mcrealms';
import * as promises from './promises';

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
        case "begone":
          bot.chat("Right sir! You won't hear from me again.");
          promises.delay(100)
            .then(() => resolve(bot.end()));
          break;
        case "rejoin":
          const timeout = command.length >= 3 ? parseInt(command[2]) : 5;
          bot.chat("Roger! rejoining in " + timeout + " seconds");
          promises.delay(100)
            .then(() => {
              bot.end();
              console.log("rejoining in " + timeout + "s");
            })
            .then(promises.delayValue(timeout * 1000))
            .then(() => resolve(mcmanus(options)));
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

    bot.on('end', () => console.log("logging off"));

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

fspromises.readFile('mcmanus.json')
  .then((buffer) => JSON.parse(buffer.toString()))
  .then((login) => {
    if (!login.realm) {
      return login;
    }
    return mcrealms.login(login.username, login.password)
      .then((client) => client.worlds()
        .then((worlds) => {
          const server = worlds.servers.find(server => server.name === login.realm)
          if (!server) {
            return Promise.reject('realm not found');
          }
          return promises.retry(() => client.join(server.id), 20, 5000,
            (reason) => {
              console.log(reason);
              return reason === 'Retry again later'
            });
        })
        .then((joinInfo) => {
          const address = joinInfo.address.split(':')
          login.host = address[0]
          login.port = parseInt(address[1])
          return login;
        }));
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
  })
  .finally(() => exit());
