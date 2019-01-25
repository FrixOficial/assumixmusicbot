const Discord = require('discord.js');
const client = new Discord.Client();
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');
const youtube = new YouTube("AIzaSyDriktasQme3FrX8j1VwRTBqg22VgPEF4M");
const config = require('./config.json')
const db = require('quick.db')
/*global Map*/
const queue = new Map();

client.on('ready', () => {
  console.log('Shard '+client.shard.id+' iniciado.')
  });


var servers = {};
client.on("message", async message => {
  let prefix;
  db.fetch(`guildPrefix_${message.guild.id}`).then(async i => {
    if (i) {
     prefix = i
     } else {
       prefix = config.prefix
        }
    var args = message.content.substring(prefix.length).split(" ");
    if (!message.content.startsWith(prefix)) return;
  var searchString = args.slice(1).join(' ');
	var url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	var serverQueue = queue.get(message.guild.id);
    switch (args[0].toLowerCase()) {
      case "search":
        if(!url) return message.channel.send(":musical_note: :x: | Introduce términos para buscar.")
    var voiceChannel = message.member.voiceChannel;
		if (!voiceChannel) return message.channel.send(':musical_note: :x: | Necesitas estar en un canal de voz.');
		var permissions = voiceChannel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) {
			return message.channel.send(':musical_note: :x: | No tengo permisos para conectarme a ese canal. Asegúrate de que tengo permisos para entrar e intenta de nuevo.');
		}
		if (!permissions.has('SPEAK')) {
			return message.channel.send(':musical_note: :x: | No tengo permisos para hablar en ese canal. Asegúrate de que tengo permisos para hablar e intenta de nuevo.');
		}
      if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			var playlist = await youtube.getPlaylist(url);
			var videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				var video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return message.channel.send(`:musical_note: | La lista de reproducción **${playlist.title}** ha sido enlistado.`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					var index = 0;
                    let lista= new Discord.RichEmbed()
                    .setAuthor("Escribe el número del título para continuar.")
                    .setDescription(`${videos.map(video2 => "``\n"+`${++index} -`+`${video2.title}`+"``").join('\n\n')}`)
                    .setColor("RANDOM")
                    .setFooter("Tienes 30 segundos para escribir el número.");
                    message.channel.send(lista)
					// eslint-disable-next-line max-depth
					try {
						var response = await message.channel.awaitMessages(message2 => message2.content > 0 && message2.content < 11, {
							maxMatches: 1,
							time: 30000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
                        return message.channel.send(':musical_note: :x: | No se ha puesto ningún número válido. La selección de canciones ha sido cancelado.');
					}
					var videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return message.channel.send(':musical_note: :x: | No hay resultados para su búsqueda.');
				}
			}
			return handleVideo(video, message, voiceChannel);
		}
        break;
      case "skip":
      if (!message.member.voiceChannel) return message.channel.send(':musical_note: :x: | No estás en un canal de voz.');
      if (!serverQueue) return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');
      serverQueue.connection.dispatcher.end();
		return message.channel.send(":musical_note: :fast_forward: | Canción Saltada.");
       break;
      case "leave":
      if (!message.member.voiceChannel) return message.channel.send(':musical_note: :x: | No estás en un canal de voz.');
      if (!serverQueue) return message.channel.send(':musical_note: :x: | La lista de reproducción de está vacía.');
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end();
      return message.channel.send(":musical_note: :stop_button:  | He dejado el canal de voz y borré la lista de reproducción.");
		return undefined;
break;
      case "repeat":
       trigger: ({ client, message, params, raw, clean }) => {
        let Player = client().get(message.guild.id);
        if (!Player) return message.channel.send({ embed: { title: `Illusion Music`, color: 16711680, description: `I'm currently not playing in this server, play something with \`${config.discord.prefix}play <YouTube Link>\` and try again`, footer: { text: `Illusion Music`, icon_url: client.user.avatarURL() }, timestamp: new Date() } });
        if (!message.guild.me.voice.channel) return msg.channel.send({ embed: { title: `Illusion Music`, color: 16711680, description: `Something went wrong, I cannot detect my current voice channel, try again later`, footer: { text: `Illusion Music`, icon_url: client.user.avatarURL() }, timestamp: new Date() } });
        if (!message.member.voice.channel) return msg.channel.send({ embed: { title: `Illusion Music`, color: 16711680, description: `You must be in a voice channel to use the play command`, footer: { text: `Illusion Music`, icon_url: client.user.avatarURL() }, timestamp: new Date() } });
        if (message.member.voice.channel != msg.guild.me.voice.channel) return msg.channel.send({ embed: { title: `Illusion Music`, color: 16711680, description: `You must be in my current voice channel to use the play command`, footer: { text: `Illusion Music`, icon_url: client.user.avatarURL() }, timestamp: new Date() } });
        
        if (!Player.repeat) {
            Player.repeat = true;
            return message.channel.send(":musical_note: Modo repeat activado");
        } else {
            Player.repeat = false;
            return message.channel.send(":musical_note: Modo repeat desactivado");
  
break;
      case "volume":
          if (!message.member.voiceChannel) return message.channel.send(':musical_note: :x: | No estás en un canal de voz.');
          if (!serverQueue) return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');
          if (!args[1]) return message.channel.send(`:musical_note: :signal_strength: | El volúmen actual es: **${serverQueue.volume}**`);
          serverQueue.volume = args[1];
          if(serverQueue.volume > 200) return message.channel.send(":musical_note: :x: | Ingrese un número entre 1 y 200.")
          serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 100);
          return message.channel.send(`:musical_note: :signal_strength: | Se ha cambiado el volumen a: **${args[1]}**`);
break;
      case "np":
      if (!serverQueue) return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');
      var fetchVideoInfo = require('youtube-info');
      fetchVideoInfo(`${serverQueue.songs[0].id}`, function (err, videoInfo) {
        if (err) throw new Error(err);

        const ytSearch = require( 'yt-search')
      ytSearch( serverQueue.songs[0].url, function ( err, r ) {
          if ( err ) throw err

          const videos = r.videos
          const playlists = r.playlists
          const accounts = r.accounts

          const firstResult = videos[ 0 ]
      let embed = new Discord.RichEmbed()
     // .setAuthor("Reproduciendo:", client.user.avatarURL)
      .setAuthor("Reproduciendo Ahora.")
      .setDescription("["+`${serverQueue.songs[0].title}`+"]"+"("+`${serverQueue.songs[0].url}`+")")
      .setColor("RANDOM")
      .addField("Duración", `${firstResult.timestamp}`,true)
      .setThumbnail(serverQueue.songs[0].img)
      .setTimestamp()
      return message.channel.send(embed);
      })})
break;
      case "queue":
      if (!serverQueue) return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');
      const queue= new Discord.RichEmbed()
      .setAuthor("Lista de reproduccion.")
      .setDescription(`
      ${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n\n')}
      **\nReproduciendo ahora:** ${serverQueue.songs[0].title}
              `)
      .setColor("RANDOM")
      return message.channel.send(queue);
break;
      case "pause":
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return message.channel.send(':musical_note: :pause_button: | La música ha sido pausada.');
		}
		return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');
break;
      case "resume":
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return message.channel.send(':musical_note: ▶ | La música ha sido reanudada.');
		}
		return message.channel.send(':musical_note: :x: | La lista de reproducción está vacía.');


	return undefined;
break;
case "play":
 if (!url) return message.channel.send(":musical_note: :x: | Introduzca términos para buscar, o alguna URL.")
var voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.channel.send(':musical_note: :x: | No estás en un canal de voz.');
    var permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT')) {
        return message.channel.send(':musical_note: :x: | No tengo permisos para conectarme a ese canal. Asegúrate de que tengo permisos para conectar e intenta de nuevo.');
    }
    if (!permissions.has('SPEAK')) {
        return message.channel.send(':musical_note: :x: | No tengo permisos para hablar en ese canal. Asegúrate de que tengo permisos para hablar e intenta de nuevo.');
    }
  if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
        var playlist = await youtube.getPlaylist(url);
        var videos = await playlist.getVideos();
        for (const video of Object.values(videos)) {
            var video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
            await handleVideo(video2, voiceChannel, true); // eslint-disable-line no-await-in-loop
        }
        return message.channel.send(`:musical_note: | La lista de reproducción **${playlist.title}** ha sido enlistado.`);
    } else {
        try {
            var video = await youtube.getVideo(url);
        } catch (error) {
            try {
                var videos = await youtube.searchVideos(searchString, 1);
                var index = 0;
                // eslint-disable-next-line max-depth
                var videoIndex = parseInt("1");
                var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
      var response= "1"
            } catch (err) {
                console.error(err);
                return message.channel.send(':musical_note: :x: | No hay resultados para su búsqueda.');
            }
        }
        return handleVideo(video, message, voiceChannel);
    }
    break;
}
async function handleVideo(video, message, voiceChannel, playlist = false) {
	var serverQueue = queue.get(message.guild.id);
	var song = {
		id: video.id,
        title: video.title,
        request: message.author.lastMessage.author.username + "#" +message.author.lastMessage.author.discriminator,
        img: video ['thumbnails'] ['medium'] ['url'],
        channel: video ['raw'] ['snippet'] ['channelTitle'],
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		var queueConstruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
      songs: [],
			volume: 100,
			playing: true
		};
		queue.set(message.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await message.member.voiceChannel.join();
			queueConstruct.connection = connection;
			play(message.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(message.guild.id);
			return message.channel.send(`:musical_note: :x: | No pude unirme al canal de voz: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
        else return message.channel.send(`:musical_note: ✅ | **${song.title}** ha sido enlistado.`);
	}
	return undefined;
}
  function play(guild, song) {
	var serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.url);


	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
     // message.channel.send('``The queue of song is end.``');
			if (reason === 'Stream is not generating quickly enough.') console.log('Canción finalizada.')
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
    var fetchVideoInfo = require('youtube-info');
fetchVideoInfo(`${song.id}`, function (err, videoInfo) {
  if (err) throw new Error(err);

  const ytSearch = require( 'yt-search')
ytSearch( song.url, function ( err, r ) {
    if ( err ) throw err

    const videos = r.videos
    const playlists = r.playlists
    const accounts = r.accounts

    const firstResult = videos[ 0 ]
try {
    let embed = new Discord.RichEmbed()
    .setAuthor("Reproduciendo ahora:")
    .setDescription("["+`${song.title}`+"]"+"("+`${song.url}`+")")
    .setColor("RANDOM")
    .addField("Duración:", `${firstResult.timestamp}`,true)
    .addField("Vistas:", videoInfo.views,true)
    .addField("Likes:", videoInfo.likeCount,true)
    .setThumbnail(song.img)
    .setTimestamp()
    .setFooter(message.guild.name ,message.guild.iconURL);
     serverQueue.textChannel.send(embed);
   } catch (e) {
     return message.channel.send('Ocurrió un error desconocido. Intenta de nuevo.\nDetalles del error: `'+e+'`')
   }
 })})};
}).catch(error => {
  console.log('Ocurrió un error: '+error)
})
});
client.login(process.env.TOKEN);
