const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json')
const db = require('quick.db')
const YoutubeDL = require('youtube-dl');
const ytdl = require('ytdl-core');

let cooldown = new Set();
let queues = {}
let ALLOW_ALL_SKIP = true
let DEFAULT_VOLUME = 100
let GLOBAL = false

client.on('ready', () => {
console.log('Shard '+client.shard.id+' Listo.')
});

client.on("message", (message) => {
  if (message.author.bot) return;
  if (message.channel.type === "dm") return;
  db.fetch(`guildPrefix_${message.guild.id}`).then(i => {
    let prefix;

    if (i) {
     prefix = i
     } else {
        prefix = config.prefix
        }
  if (!message.content.startsWith(prefix)) return;
const text = message.content.slice(prefix.length).trim().split(/ +/g);
const command = text.shift().toLowerCase();
const args = text.join(" ");

  if (command === "play") {
  if(cooldown.has(message.author.id)){
    message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
    m.delete(5000)
    });
    return;
 }
 cooldown.add(message.author.id);

 setTimeout(() => {
   cooldown.delete(message.author.id);
 }, 10000);

  if (message.member.voiceChannel === undefined) {
    const embed = new Discord.RichEmbed()
    .setDescription(':x: **No estás en un canal de voz.**')
    message.channel.send({embed})
    return;
    }

		// Make sure the suffix exists.
		if (!args) {
    const embed = new Discord.RichEmbed()
    .setDescription(':x: **Por favor introduzca términos para buscar.**')
    message.channel.send({embed})
      return;
    }

		// Get the queue.
		const queue = getQueue(message.guild.id);

		// Check if the queue has reached its maximum size.
		if (queue.length >= 15) {
			return message.channel.send(':x:  Has alcanzado el límite de canciones para la lista.');
		}

		// Get the video information.
		message.channel.send(':arrows_counterclockwise: Buscando canción...').then(response => {
			var searchstring = args
			if (!args.toLowerCase().startsWith('http')) {
				searchstring = 'gvsearch1:' + args;
			}

			YoutubeDL.getInfo(searchstring, ['-q', '--no-warnings', '--force-ipv4'], (err, info) => {
				// Verify the info.
				if (err || info.format_id === undefined || info.format_id.startsWith('0')) {
                    console.log(err)
					return response.edit(':x:  |  Vídeo no encontrado.');
				}


				info.requester = message.author.id;

      const embed = new Discord.RichEmbed()
      .setTitle(`:white_check_mark: Enlistado:`)
      .setDescription(`[${info.title}](${info.webpage_url})`)
      .setThumbnail(info.thumbnail)
      .addField("Pedido por", `<@${message.author.id}>`, true)
      response.edit({embed}).then(() => {
					queue.push(info);
					// Play if only one element in the queue.
					if (queue.length === 1) executeQueue(message, queue);
				}).catch(console.log)
      });
		}).catch(console.log);

  }
    if (command === "skip") {
      if(cooldown.has(message.author.id)){
        message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
        m.delete(5000)
        });
        return;
     }
     cooldown.add(message.author.id);

     setTimeout(() => {
       cooldown.delete(message.author.id);
     }, 10000);

      const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		if (voiceConnection === null) return message.channel.send('Ninguna canción está siendo reproducida.');

		// Get the queue.
		const queue = getQueue(message.guild.id);

		if (!canSkip(message.member, queue)) return message.channel.send('No puedes saltar esto si tú no has sido el que lo ha enlistado.').then((response) => {
			response.delete(5000);
		});

		// Get the number to skip.
		let toSkip = 1; // Default 1.
		if (!isNaN(args) && parseInt(args) > 0) {
			toSkip = parseInt(args);
		}
		toSkip = Math.min(toSkip, queue.length);

		// Skip.
		queue.splice(0, toSkip - 1);

		// Resume and stop playing.
		const dispatcher = voiceConnection.player.dispatcher;
		if (voiceConnection.paused) dispatcher.resume();
      if (queue.length === 0) return message.channel.send('La lista de canciones está vacía.')
		dispatcher.end();

		const embed = new Discord.RichEmbed()
    .setDescription(':track_next: **Canción saltada.**')
    message.channel.send({embed});
    }

    if (command === "queue") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

        const queue = getQueue(message.guild.id);

        if (queue.length === 0) return message.channel.send('La lista de canciones está vacía.')

		// Get the queue text.
		const text = queue.map((video, index) => (
			(index + 1) + '.- **' + video.title + '**'
		)).join('\n');

		// Get the status of the queue.
		let queueStatus = 'Detenido';
		const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		if (voiceConnection !== null) {
			const dispatcher = voiceConnection.player.dispatcher;
			queueStatus = dispatcher.paused ? 'Pausado' : 'Reproduciendo';
		}

		// Send the queue and status.
		const embed = new Discord.RichEmbed()
    .setTitle(':page_with_curl: Lista de Canciones')
    .setDescription(text)
    .addField('Estado', `${queueStatus}.`)
    message.channel.send({embed});

    }
      if(command === "pause") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);
        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		if (voiceConnection === null) return message.channel.send('Ninguna canción está siendo reproducida.');
        const queue = getQueue(message.guild.id);
        if (queue.length === 0) return message.channel.send('No estoy reproduciendo nada.')

		// Pause.
	  const embed = new Discord.RichEmbed()
    .setDescription(':pause_button: **Reproducción pausada.**')
    message.channel.send({embed});
		const dispatcher = voiceConnection.player.dispatcher;
		if (!dispatcher.paused) dispatcher.pause();

    }
  if (command === 'join') {
    if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

    let Canalvoz = message.member.voiceChannel;
    if (!Canalvoz || Canalvoz.type !== 'voice') {
      const embed = new Discord.RichEmbed()
      .setDescription('Necesitarás estar en un canal de voz para ejecutar este comando >.<')
    message.channel.send({embed}).catch(error => message.channel.send(error));
    } else if (message.guild.voiceConnection) {
      const embed = new Discord.RichEmbed()
      .setDescription('Lo siento :c, pero estoy conectada en otro canal.')
    message.channel.send({embed});
    } else {
     message.channel.send().then(m => {
          Canalvoz.join().then(() => {
            const embed = new Discord.RichEmbed()
      .setDescription('Lista :D')
               message.channel.send({embed}).catch(error => message.channel.send(error));
         }).catch(error => message.channel.send(error));
     }).catch(error => message.channel.send(error));
    }
  }
      if(command === "leave") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
			if (voiceConnection === null) return message.channel.send('No estoy en un canal de voz.');
			// Clear the queue.
			const queue = getQueue(message.guild.id);
			queue.splice(0, queue.length);

			// End the stream and disconnect.
			message.member.voiceChannel.leave()
      const embed = new Discord.RichEmbed()
      .setDescription(':stop_button: **He abandonado el canal de voz.**')
        message.channel.send({embed})

    }
      if(command === "clearqueue") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		    if (voiceConnection === null) return message.channel.send('Ninguna canción está siendo reproducida.');
        const queue = getQueue(message.guild.id);

			    queue.splice(0, queue.length);
        const dispatcher = voiceConnection.player.dispatcher;
        dispatcher.end();
			    const embed = new Discord.RichEmbed()
          .setDescription(':ballot_box_with_check: **La lista de canciones ha sido borrada.**')
        message.channel.send({embed});

    }
      if(command === "resume") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		    if (voiceConnection === null) return message.channel.send('No estoy reproduciendo nada.');
        const queue = getQueue(message.guild.id);
        if (queue.length === 0) return message.channel.send('No estoy reproduciendo nada.')


		// Resume.
		const embed = new Discord.RichEmbed()
    .setDescription(':arrow_forward: **Reproducción reanudada.**')
    message.channel.send({embed});
		const dispatcher = voiceConnection.player.dispatcher;
		if (dispatcher.paused) dispatcher.resume();

    }else
      if (command === "volume") {
        if(cooldown.has(message.author.id)){
          message.channel.send(`**${message.author.username}**, espera 10 segundos para poder usar el comando de nuevo.`).then(m => {
          m.delete(5000)
          });
          return;
       }
       cooldown.add(message.author.id);

       setTimeout(() => {
         cooldown.delete(message.author.id);
       }, 10000);

        const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == message.guild.id);
		if (voiceConnection === null) return message.channel.send('No estoy reproduciendo nada.')
        const queue = getQueue(message.guild.id);
        if (queue.length === 0) return message.channel.send('No estoy reproduciendo nada.')

		// Get the dispatcher
		const dispatcher = voiceConnection.player.dispatcher;

		if (args > 200 || args < 0) return message.channel.send('El valor debe estar entre 1 y 200.').then((response) => {
			response.delete(5000);
		});
    const embed = new Discord.RichEmbed()
    .setDescription(':signal_strength: El volumen ha sido cambiado a **'+ args +'**')
		message.channel.send({embed});
		dispatcher.setVolume((args/100));
}

  });
});

function canSkip(member, queue) {
		if (ALLOW_ALL_SKIP) return true;
		else if (queue[0].requester === member.id) return true;
		else return false;
	}
function getQueue(server) {
		if (!queues[server]) queues[server] = [];
		return queues[server];
	}
function executeQueue(msg, queue) {
		// If the queue is empty, finish.
		if (queue.length === 0) {
			const embed = new Discord.RichEmbed()
      .setDescription(':ballot_box_with_check: **Reproducción terminada.**')
      msg.channel.send({embed});

			// Leave the voice channel.
			const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
			if (voiceConnection !== null) return voiceConnection.disconnect();
		}

		new Promise((resolve, reject) => {
			// Join the voice channel if not already in one.
			const voiceConnection = client.voiceConnections.find(val => val.channel.guild.id == msg.guild.id);
			if (voiceConnection === null) {
				if (msg.member.voiceChannel) {
					msg.member.voiceChannel.join().then(connection => {
						resolve(connection);
					}).catch((error) => {
						console.log(error);
					});
				} else {
					// Otherwise, clear the queue and do nothing.
					queue.splice(0, queue.length);
					reject();
				}
			} else {
				resolve(voiceConnection);
			}
		}).then(connection => {
			// Get the first item in the queue.
			const video = queue[0];

			console.log(video.webpage_url);

			// Play the video.
      const embed = new Discord.RichEmbed()
      .setDescription(`**:notes: Reproduciendo ahora:** [${video.title}](${video.webpage_url})`)
      msg.channel.send({embed}).then(() => {
				let dispatcher = connection.playStream(ytdl(video.webpage_url, {filter: 'audioonly'}), {seek: 0, volume: DEFAULT_VOLUME/100});

				connection.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('error', (error) => {
					// Skip to the next song.
					console.log(error);
					queue.shift();
					executeQueue(msg, queue);
				});

				dispatcher.on('end', () => {
					// Wait a second.
					setTimeout(() => {
						if (queue.length > 0) {
							// Remove the song from the queue.
							queue.shift();
							// Play the next song in the queue.
							executeQueue(msg, queue);
						}
					}, 1000);
				});
			}).catch((error) => {
				console.log(error);
			});
		}).catch((error) => {
			console.log(error);
		});
	}

client.login(process.env.TOKEN);
