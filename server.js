const botconfig = require("./config.json");
const Discord = require("discord.js");
const bot = new Discord.Client()
const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log("Ping Received");
  response.sendStatus(200);
});
app.listen(3000);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);
bot.on("ready", async () => {
console.log(`${bot.user.username} is updated in ${bot.guilds.size} servers and ${bot.users.size} users`);
//bot.user.setStatus('dnd');
  setInterval(() => {
   bot.user.setActivity(`Estoy en ${bot.guilds.size} servidores | m*play`, { type: 'PLAYING' });
   setTimeout(() => {
     bot.user.setActivity(`I'm in ${bot.guilds.size} servers | m*play`, { type: 'PLAYING' });
   }, 30000);
 }, 60000);
});

bot.login(botconfig.token);
