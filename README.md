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

#### Files

You need to create a file called `account.json` in the `/bot/assets/` folder, with the contents `{"insta_username": "<username>", "insta_password": "<password>"}`, replacing `<username>` and `<password>` with the login credentials to the Instagram account you intend to use this on.

After doing so, run `node beepboop.js` and the bot will do its thing.

## Contributing

Please read [CONTRIBUTING.md](Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Garlicvideos** - [Garlicvideos](https://github.com/Garlicvideos)
* **KorkyMonster** - [KorkyMonster](https://github.com/KorkyMonster)

See also the list of [contributors](https://github.com/Garlicvideos/reddits-nightmare/contributors) who participated in this project.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details
