# Mega Bot
**A student-led, fire-from-the-hip attempt at making a Discord bot.**

![Robot dancing gif](https://media.giphy.com/media/47EtjlHYFREM5Rznaf/giphy.gif)

# Guide to Contributing
There are a couple of ways you can contribute to this Raikes School tradition. You can submit tickets for features or behavior you would like to see in Mega Bot. Additionally, you can contribute directly by developing a new feature.

There are a few steps to begin development:
1. Clone the repository locally.
2. Contact the repository owner to join the development sandbox Discord guild.
3. Contact the repository owner and request a config file. This config file provides information like MongoDB connection strings and Discord bot tokens.
4. Check out the local development guide.

# Local Development Guide
**This section assumes you have completed the Guide to Contributing.**

In this section, you'll learn how to perform local development on the `mega-bot` repository. There are a few resources available to aid with local development, such as the development sandbox Discord guild and a standalone testing bot called `(DEV) Mega Bot`.

## Running Locally
To run the development version of Mega Bot, `(DEV) Mega Bot`, run the following command.

`npm run dev`

After doing so, check the following. An example of typical console output is provided below.
1. The linter runs successfully.
2. The local application connects to `(DEV) Mega Bot` in the sandbox guild.
3. `(DEV) Mega Bot` responds to commands in the sandbox guild.
4. The behavior of `(DEV) Mega Bot` responds to changes you've made locally.

![Typical console output]()

## Multiple Responses from `(DEV) Mega Bot`
If others happen to be testing `(DEV) Mega Bot` at the same time, you will see multiple responses to each command. An example of multiple responses is provided below. This occurs because there is only one `(DEV) Mega Bot`, ergo only one connection string. Since multiple people can log in to the bot at the same time, it will respond once for each valid log in.

![Example of multiple bot responses]()
