const Discord = require('discord.js');
const config = require('./config.json');
const manager = new Discord.ShardingManager('./botmusic.js', {token: config.token});
manager.spawn().then(() => {
    console.log(`El complemento de música ha sido encendido! Actualmente ejecuntando ${manager.totalShards} shards.`);

}).catch((err) => {
    console.log(err);
});
