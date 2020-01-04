# reddits-nightmare

Don't you ever want to become the enemy of the people? [reddits-nightmare](https://github.com/Garlicvideos/reddits-nightmare) is a bot that downloads any post from any subreddit, along with the post's title, and reuploads it to instagram, causing massive havoc and ruins relationships once your close friends or families finds out.

## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See Installing for notes on how to deploy the project on a live system.

### Prerequisites

You need Nodejs and npm (which comes with nodejs) to use this bot.

[Download Nodejs and npm](https://nodejs.org/en/)

### Installing
#### Node packages

After downloading Nodejs and npm, `cd` into the directory you installed the bot to and run `npm i`. It should automatically install all the needed modules for this bot to work.

#### Setup
##### Automated

This is the method I recommend as there isn't a reason for you to be performing the installation manually **at all**.

Run `node beepboop.js` and the bot will perform first time setup. When the bot asks you if you want to use automated setup, type `y` or `yes`.

It will then ask you several questions. To find out what these questions mean and their significance, as well as how to answer them correctly (The bot is almost fool-proof, but that doesn't mean it can't be broken), please go to the [config explanation page](https://github.com/Garlicvideos/reddits-nightmare/wiki/Configurations)


##### Manual

Setting up manually is highly disencouraged as human error will likely occur.
But maybe you're adventurous. Head on over to the [manual installation guide](https://github.com/Garlicvideos/reddits-nightmare/wiki/Manual-Installation) for instructions on how to setup this bot by yourself, without the help of modern technology.

#### Modification of files

To add in your custom captions, open up `beepboop.js` and edit `var customcaption = "<caption>";`, replacing `<caption>` to anything of your liking.

`account.json` and `subreddits.txt` is open for modification in case you entered any info wrongly.
To fix either of the files, simply delete it and follow the steps [shown above here](#setup), for the file again.

It is not recommended for you to manually modify the aforementioned files.

## Contributing

Please read [CONTRIBUTING.md](Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Garlicvideos** - [Garlicvideos](https://github.com/Garlicvideos)

See also the list of [contributors](https://github.com/Garlicvideos/reddits-nightmare/contributors) who participated in this project.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details
