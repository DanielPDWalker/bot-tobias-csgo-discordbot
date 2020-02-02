const ls = require("./local_settings.js");

const Discord = require('discord.js');
const client = new Discord.Client();

var snoowrap = require('snoowrap');

const r = new snoowrap({
  userAgent: ls.USER_AGENT,
  clientId: ls.CLIENT_ID,
  clientSecret: ls.CLIENT_SECRET,
  username: ls.USERNAME,
  password: ls.PASSWORD
});


var COOLDOWN = 60000
var LAST_REQUEST = new Date().getTime();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
  if (msg.content === '!csgonews'){
    var now = new Date().getTime();
    if (now < LAST_REQUEST + COOLDOWN) {
      var time_diff = Math.round(((LAST_REQUEST + COOLDOWN) - now) / 1000)
      msg.channel.send(time_diff +  " seconds timeout remaining.")
    } else {
      msg.channel.send("CSGO NEWS FOR YOU!")
    }
  }
});

client.login(ls.TOKEN);
