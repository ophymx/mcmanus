import * as mineflayer from 'mineflayer';
import { promises as fspromises } from 'fs';
import { exit } from 'process';

import { pathfinder } from 'mineflayer-pathfinder';

import { BotStateMachine, EntityFilters } from 'mineflayer-statemachine';

import * as calendar from './calendar';
import * as mcrealms from './mcrealms';
import * as promises from './promises';

interface LoginDetails {
  host?: string;
  port?: number;
  realm?: string;
  username: string;
  password: string;
}

interface Location {
  name: string;
  desc: string;
  x: number;
  y: number;
  z: number;
}

async function mcmanus(options: mineflayer.BotOptions): Promise<void> {
  options.logErrors = true;
  options.version = mcrealms.MC_VERSION;

  const bot = mineflayer.createBot(options);
  bot.loadPlugin(pathfinder);

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
        case "time":
          const datetime = new calendar.Datetime(bot.time);
          console.log(JSON.stringify(datetime));
          bot.chat("the time is: " + datetime);
          break;
        default:
          bot.chat("wat? " + message);
          break;
      }
    });

    bot.on('login', () => console.log('logged in'));

    bot.on('end', () => console.log("logging off"));

    bot.on('kicked', (reason, loggedIn) => {
      console.log(reason, loggedIn);
      reject(reason);
    });

    bot.on('error', err => {
      console.log(err);
      reject(err);
    });
  });

}

async function readConfig(): Promise<LoginDetails> {
  const buffer = await fspromises.readFile('mcmanus.json');
  return JSON.parse(buffer.toString());
}

/**
 * Look up and join Realm.
 *
 * Realms need to be joined/looked up everytime since instances can spun down when inactive.
 *
 * @param username Email address used to log in to Minecraft.
 * @param password Password used to log in to Minecraft
 * @param realm Realm name to join.
 *
 * @returns A Promise tuple of hostname and port.
 */
async function joinRealm(username: string, password: string, realm: string): Promise<[string, number]> {
  const client = await mcrealms.login(username, password);
  const worlds = await client.worlds();
  const server = worlds.servers.find(server => server.name === realm);
  if (!server) {
    throw 'realm not found';
  }
  const joinInfo = await promises.retry(() => client.join(server.id), 20, 5000,
    (reason) => {
      console.log(reason);
      return reason === 'Retry again later';
    });
  const address = joinInfo.address.split(':');
  return [address[0], parseInt(address[1])];
}

async function main(): Promise<void> {
  let login = await readConfig();
  if (login.realm) {
    [login.host, login.port] = await joinRealm(login.username, login.password, login.realm);
  }
  console.log("joining", {
    realm: login.realm,
    address: login.host + ':' + login.port
  });
  return await mcmanus(login);
}

if (require.main === module) {
  main()
    .catch((err) => console.error(err))
    .finally(() => exit());
}
