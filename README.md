### README for your Discord Bot

#### Introduction

Welcome to the repository for our Discord Bot, a project designed to enrich user experience on Discord with interactive and automated features. This bot offers a range of commands that allow users to engage in daily missions and more.

#### Features

- **Daily Missions**: Users can embark on daily missions, with a limit of 20 missions per day, with rewards to be earned.
- **Profile**: Users can view their profile, including their accumulated score and equipped items.
- **Item Shop**: Access to a shop where users can purchase items that will enhance their performance in missions.
- **Show stats**: Users can view their stats in Planetary Defense web3 game.
- **Intelligent Error Handling**: The bot is equipped with an advanced error management system to inform users when an interaction session expires or in case of other errors.

#### Available Commands

- `/missions`: Displays the user's profile, shop and available missions.
- `/register`: Allows a user to register by linking their WAX address for score and reward tracking.
- `/assign-grade`: User can assign himself a role based on his score in Planetary Defense game.
- `/grade-list`: Displays informations about role's grade and how many points user need to obtain.
- `/stats`: Displays in Discord all the user's Planetary Defense stats.
- `/wam`: Displays mention user's wax address.
- `/money`: Give an amount of coins at someone. Admin Only.
- `/clearwam`: Clear wax address registered in database if a user write the wrong address. Admin Only.

#### Technologies Used

- **Node.js**: JavaScript runtime environment for the server.
- **Discord.js**: Module for easily interfacing with the Discord API.
- **SQLite**: Database for managing users, missions, and items.
- **Axios**: HTTP library for making requests to external APIs.
- **Cron**: Tiny task scheduler in pure JavaScript for node.js based on GNU crontab.

#### Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sklion42/Planetary-Defense-Discord-Bot
   cd your-repo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Create a config.js file.
   - Fill in the necessary details such as the bot's token, etc.

4. **Launch the bot**:
   ```bash
   node botPlanDef.js
   ```

#### Contribution

Contributions to this project are welcome! If you would like to contribute, please fork the repository, create a new branch for your changes, and submit a pull request for review.

#### Support

If you encounter any issues or have questions, please feel free to open an issue in this GitHub repository.

#### License

This project is distributed under the [MIT License](https://opensource.org/licenses/MIT), which allows you to use and modify it freely for your own projects.
