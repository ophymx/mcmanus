McManus Minecraft Bot
=====================

Goals
-----
- Wander: have mcmanus wander randomly within a bound box
- Tend farms: preprogramed action to harvest and plant a wheat farm


Build
-----

```
npm install
npm install -g webpack webpack-cli
npm run build
```

Run
---

Edit `mcmanus.json`.

```
{
  "username": "username@example.org",
  "password": "PASSWORD",
  "realm": "Realm world name",
  "host": "server address",
  "port": 25565
}
```
Provide either host+port or realm. If realm is provided it will look up the host+port through the realm API.

```
npm run start
```
