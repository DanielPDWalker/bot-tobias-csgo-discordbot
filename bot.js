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
var SEARCH_STRING = ls.STRING_TO_SEARCH_FOR;

// User to search for through reddit api
var TARGET_USER = ls.REDDIT_TARGET_USER;
var TARGET_SUBREDDIT = ls.REDDIT_TARGET_SUBREDDIT;

var CSGO_NEWEST_PATCHNOTES_CACHED;
var CSGO_NEWEST_PATCHNOTES;
var CSGO_NEWEST_TIME = 0;

var CHANNEL_TO_USE;


function getCurrentTime() {
  let n = new Date().getTime();
  let now = new Date();
  now.setUTCSeconds(now.getUTCSeconds() / n);
  return now
}


function scrapeConsoleOutput(s_post_list, s_scraped_post_count) {
  let dt = new Date(CSGO_NEWEST_PATCHNOTES.created * 1000);
  let now = getCurrentTime();
  console.log("-------------------------");
  console.log("total posts found matching string: " + s_post_list.length);
  console.log("total posts scraped from reddit: " + s_scraped_post_count);
  console.log("Date & APPROX TIME Posted for newest patchnotes: " + dt.toString());
  console.log("Most recent scrape time " + now.toString());
  console.log("-------------------------");
};


function redditScrape(target_channel, startup = 0) {
  let newestPostTime = 0;
  let scraped_post_count = 0;
  try {
    r.getUser(TARGET_USER).getSubmissions({limit: 200}).then(posts => {
      let post_list = [];
      for (var i = 0; i < posts.length; i++) {
        scraped_post_count += 1;
        if (posts[i].title.startsWith(SEARCH_STRING)) {
          if (posts[i].subreddit_name_prefixed == TARGET_SUBREDDIT) {
            post_list.push(posts[i]);
          }else {
            //pass
          }
        }
      }
      if (post_list.length === 0) {
        target_channel.send("No CSGO patch notes found! Something went wrong?");
        return;
      }
      for (var i = 0; i < post_list.length; i++) {
        if (post_list[i].created > newestPostTime) {
          CSGO_NEWEST_PATCHNOTES = post_list[i];
          newestPostTime = post_list[i].created;
        }
      }
      if (typeof CSGO_NEWEST_PATCHNOTES_CACHED === 'undefined') {
        CSGO_NEWEST_PATCHNOTES_CACHED = CSGO_NEWEST_PATCHNOTES;
      }
      if (startup === 1) {
        scrapeConsoleOutput(post_list, scraped_post_count);
        LAST_REQUEST = new Date().getTime();
      }else {
        if (CSGO_NEWEST_PATCHNOTES_CACHED != CSGO_NEWEST_PATCHNOTES) {
          target_channel.send(CSGO_NEWEST_PATCHNOTES.title + '\n' + CSGO_NEWEST_PATCHNOTES.url);
          CSGO_NEWEST_PATCHNOTES_CACHED = CSGO_NEWEST_PATCHNOTES;
        }
        scrapeConsoleOutput(post_list, scraped_post_count);
        LAST_REQUEST = new Date().getTime();
      }
    })
  } catch (e) {
      console.log(e);
      target_channel.send("There was an error reaching reddit's servers. I will try again in an hour, or you can for an update with !csgopatchget after 1 minuite has passed.");
      try {
        target_channel.send(CSGO_NEWEST_PATCHNOTES_CACHED.title + '\n' + CSGO_NEWEST_PATCHNOTES_CACHED.url);
        LAST_REQUEST = new Date().getTime();
      } catch (e) {
        console.log(e);
        target_channel.send("No reddit data is currently cached, I will try again in an hour, or you can use !csgopatchget after 1 minuite has passed.");
        LAST_REQUEST = new Date().getTime();
      }
  }
};


function cleanUpOldCooldownMessages() {
  if (typeof COOLDOWN_MESSAGE != 'undefined') {
    COOLDOWN_MESSAGE.delete();
  }
};


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  CHANNEL_TO_USE = client.channels.find(ch => ch.name === ls.CHANNEL_TO_USE);
  redditScrape(CHANNEL_TO_USE, 1);
});


client.on('message', msg => {
  if (msg.content === '!csgopatch'){
      CHANNEL_TO_USE.send(CSGO_NEWEST_PATCHNOTES.title + '\n' + CSGO_NEWEST_PATCHNOTES.url);

  }
  if (msg.content === '!csgopatchget'){
    var now = new Date().getTime();
    if (now < LAST_REQUEST + COOLDOWN) {
      var time_diff = Math.round(((LAST_REQUEST + COOLDOWN) - now) / 1000);
      cleanUpOldCooldownMessages();
      CHANNEL_TO_USE.send(time_diff +  " seconds timeout remaining.").then((sent_msg) =>{
        COOLDOWN_MESSAGE = sent_msg;
      });
    } else {
      redditScrape(CHANNEL_TO_USE);
    }
  }
  if (msg.content === '!csgohelp'){
      CHANNEL_TO_USE.send('Commands for BOT Tobias are: !csgopatch (returns most recent patch post) and !csgopatchget (try to send a request to get updated patchnotes).');
  }
});


client.login(ls.TOKEN);
client.guild;
setInterval(function() { redditScrape(CHANNEL_TO_USE); }, 60*60*1000);



/*
Useful JSON data from reddit api query
title
subreddit_name_prefixed

selftext (this is the body of the post)

created - looks like getTime()?? example 15803444466 - so ms since 1st jan 1970?

url

*/
