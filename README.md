# reddits-nightmare

This is a bot which may or may not contain spaghetti code which aims to repost the top posts from [r/all](https://www.reddit.com/r/all/) to an instagram account as a experiment.

**Currently, the bot only reposts to instagram from r/all with some effort of excluding posts that may give away the fact that they are stolen from reddit. This is not perfect, but may come close to it in the future with more development.**

## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See Installing for notes on how to deploy the project on a live system.

### Prerequisites

You need Nodejs and npm (which comes with nodejs) to use this bot.

[Download Nodejs and npm](https://nodejs.org/en/)

### Installing
#### Node packages

After downloading Nodejs and npm, install these packages:

* [instagram-private-api](https://www.npmjs.com/package/instagram-private-api) by running `npm install instagram-private-api`
* [reddit-snooper](https://www.npmjs.com/package/reddit-snooper) by running `npm install reddit-snooper`
* [image-size](https://www.npmjs.com/package/image-size) by running `npm install image-size`
* [aspect-ratio](https://www.npmjs.com/package/aspect-ratio) by running `npm install aspect-ratio`

#### Setup
##### Automated

Run `node beepboop.js` and the bot will perform first time setup. When the bot asks you if you want to use automated setup, type 'y' or 'yes'.

It will ask for Instagram account login details, and after it is given the info, it will store them locally at `./configs/account.json`

The bot will then ask you to whitelist subreddits. This part is important as broken subreddits can cause the bot to crash.

When prompted, type in the subreddits, without the `r/`, that you want the bot to browse. Single subreddits like `r/all` works too. Any subreddits that are below 2 characters long will be fixed automatically. You should end up with something like this:

`What subreddit(s) do you want to whitelist?`
`(r/all works too. Do NOT include 'r/'. Seperate using commas. Make sure the subreddit exists, or the bot will spit out errors/crash later on.)`
`dankmemes,memes,aww`

Ensure that the subreddit you enter actually exists on Reddit, or you will be required to modify/delete `subreddits.txt` on your own to fix the bot.

##### Manual

Setting up manually is highly disencouraged as human error will likely occur.
Anyways, here are the instructions:

Create the folder `/configs/` in the same directory as where `beepboop.js` is. In `/configs/`, create two files, naming them `account.json` and `subreddits.txt` respectively.

In `account.json`, copy and paste this in: `{"insta_username": "username", "insta_password": "password"}`, replacing `username` and `password` with your own.

In `subreddits.txt`, type in the subreddits you wish the bot to browse, without `r/` in front of it, seperating them with a comma.
E.g. `subreddits.txt` would contain `dankmemes,memes,aww`

Afterwards, run `beepboop.js` and the bot will create the rest of the needed directories for you.

#### Modification of files

`account.json` and `subreddits.txt` is open for modification in case you entered any info wrongly.
To fix either of the files, simply delete it and follow the steps [shown above here](#setup), for the file again.

## Contributing

Please read [CONTRIBUTING.md](Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Garlicvideos** - [Garlicvideos](https://github.com/Garlicvideos)
* **KorkyMonster** - [KorkyMonster](https://github.com/KorkyMonster)

See also the list of [contributors](https://github.com/Garlicvideos/reddits-nightmare/contributors) who participated in this project.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details
