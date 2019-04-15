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

#### Files and Directories

Run `node beepboop.js` and the bot will perform first time setup. The bot will ask you if you want to proceed with first time setup, where if you choose not to, you will be required to create `./configs/account.json` manually, unless the bot is ran again.

If you allow it to proceed with setup, it will ask for Instagram account login details, which will then be stored locally into `./configs/account.json`

If required files are not present, the bot will commit sudoku.
Missing directories will automatically be created by the bot.

## Contributing

Please read [CONTRIBUTING.md](Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Garlicvideos** - [Garlicvideos](https://github.com/Garlicvideos)
* **KorkyMonster** - [KorkyMonster](https://github.com/KorkyMonster)

See also the list of [contributors](https://github.com/Garlicvideos/reddits-nightmare/contributors) who participated in this project.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details
