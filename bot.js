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


// Cooldown timers
var COOLDOWN = 60000;
var LAST_REQUEST = new Date().getTime();
var COOLDOWN_MESSAGE;

// String to search posts for
var SEARCH_STRING = ls.STRING_TO_SEARCH_FOR

// User to search for through reddit api
var TARGET_USER = ls.REDDIT_TARGET

var CSGO_NEWEST_PATCHNOTES;
var CSGO_NEWEST_TIME = 0;

function redditScrape(msg) {
  let newestPostTime = 0;
  let scraped_post_count = 0;
  r.getUser(TARGET_USER).getSubmissions({limit: 200}).then(posts => {
    let post_list = [];
    for (var i = 0; i < posts.length; i++) {
      scraped_post_count += 1;
      if (posts[i].title.startsWith(SEARCH_STRING)) {
        if (posts[i].subreddit_name_prefixed == 'r/GlobalOffensive') {
          post_list.push(posts[i]);
        }else {
          //pass
        }
      }
    }
    if (post_list.lenth === 0) {
      msg.channel.send("No CSGO patch notes found! Something went wrong?");
      return;
    }
    for (var i = 0; i < post_list.length; i++) {
      if (post_list[i].created > newestPostTime) {
        CSGO_NEWEST_PATCHNOTES = post_list[i];
        newestPostTime = post_list[i].created;
      }
    }
    if (msg != 0){
      msg.channel.send(CSGO_NEWEST_PATCHNOTES.url);
    }
    let dt = new Date(CSGO_NEWEST_PATCHNOTES.created * 1000);
    console.log("-------------------------");
    console.log("total posts found matching string: " + post_list.length);
    console.log("total posts scraped from reddit: " + scraped_post_count);
    console.log("Date & APPROX TIME Posted for newest patchnotes: " + dt.toString());
    console.log("-------------------------");

  })
}


function cleanUpOldCooldownMessages(msg) {
  if (typeof COOLDOWN_MESSAGE != 'undefined') {
    COOLDOWN_MESSAGE.delete();
  }
}


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  redditScrape(0);
});

client.on('message', msg => {
  if (msg.content === '!csgopatch'){
      msg.channel.send(CSGO_NEWEST_PATCHNOTES.url);
  }
  if (msg.content === '!csgopatchget'){
    var now = new Date().getTime();
    if (now < LAST_REQUEST + COOLDOWN) {
      var time_diff = Math.round(((LAST_REQUEST + COOLDOWN) - now) / 1000);
      msg.channel.send(time_diff +  " seconds timeout remaining.");
      cleanUpOldCooldownMessages(msg);
      COOLDOWN_MESSAGE = msg;
    } else {
      redditScrape(msg);
    }
  }
});

client.login(ls.TOKEN);



/*
Useful JSON data from reddit api query
title
subreddit_name_prefixed

selftext (this is the body of the post)

created - looks like getTime()?? example 15803444466 - so ms since 1st jan 1970?

url

*/
