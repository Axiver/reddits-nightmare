# reddits-nightmare

Don't you ever want to become the enemy of the people? [reddits-nightmare](https://github.com/Garlicvideos/reddits-nightmare) is a bot that downloads any post from any subreddit, along with the post's title, and reuploads it to Instagram, causing massive havoc and ruins relationships once your close friends or families find out.


### The reddit scraping module is currently broken
After reddit's API changes, the `reddit-snooper` package that the bot depends on is currently broken. As that package is no longer maintained by its original author, I will need to fork it and work on a fix, which would take a long time. Until then, you will have to manually download the posts from reddit and place them in `/assets/images/approved`. The bot will then upload the images to Instagram as usual.

## Getting started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See Installing for notes on how to deploy the project on a live system.

### Prerequisites

You need Node.js and npm (which comes with Node.js) to use this bot.

[Download Node.js and npm](https://nodejs.org/en/)

### Installing
#### The bot
Download the bot by going to [the releases page](https://github.com/Garlicvideos/reddits-nightmare/releases) and download the zip of the latest release.

#### Node packages

After downloading Nodejs, npm and the bot, `cd` into the directory you installed the bot to and run `npm i`. It should automatically install all the needed modules for this bot to work.

#### Setup
##### Automated

This is the method I recommend as there isn't a reason for you to be performing the installation manually **at all**.

Run `npm run start` and the bot will perform first time setup. When the bot asks you if you want to use automated setup, type `y` or `yes`.

It will then ask you several questions. To find out what these questions mean and their significance, as well as how to answer them correctly (The bot is almost fool-proof, but that doesn't mean it can't be broken), please go to the [config explanation page](https://github.com/Garlicvideos/reddits-nightmare/wiki/Configurations)


##### Manual

Setting up manually is highly discouraged as human error will likely occur.
But maybe you're adventurous. Head on over to the [manual installation guide](https://github.com/Garlicvideos/reddits-nightmare/wiki/Manual-Installation) for instructions on how to setup this bot by yourself, without the help of modern technology.

#### Modification of files

To add in your custom captions, open up `/configs/customcaption.txt` (or create the file, if it doesn't already exist,) and save your custom caption into the contents of the file.

`config.json` and `subreddits.txt` is open for modification in case you entered any info wrongly.
To fix either of the files, simply delete it and follow the steps [shown above here](#setup), for the file again.

It is not recommended for you to manually modify the aforementioned files.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Axiver** - [Axiver](https://github.com/Axiver)

See also the list of [contributors](https://github.com/Garlicvideos/reddits-nightmare/contributors) who participated in this project.

## License

This project is licensed under the GNU GENERAL PUBLIC LICENSE - see the [LICENSE](LICENSE) file for details

## If you like what I do, please consider keeping me alive

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/XavierTeoZK)
