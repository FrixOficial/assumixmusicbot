const Discord = require('discord.js');
const config = require('./config.json');
const manager = new Discord.ShardingManager('./bot.js', {token: config.token});
manager.spawn().then(() => {
    console.log(`El bot ha sido encendido! Actualmente ejecuntando ${manager.totalShards} shards.`);

}).catch((err) => {
    console.log(err);
});
