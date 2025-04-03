# Migrate SCORM registration to update local DB

This module reads SCORM registration and populates/updates the information into a local database.

## Implementation Notes
This project is a Node.js application that initializes a MySQL database. It uses dotenv to manage environment variables and mysql2/promise for asynchronous database operations.

### Prerequisites
- Node.js: Ensure you have Node.js installed (version 14 or later).
- MySQL Database: You need a running MySQL database instance.

### Installation
1. Clone the repository:
```
git clone <repository_url>
cd scorm_to_sql
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file:
   Create a file named .env in the root directory of the project. This file will store your database credentials and other sensitive information.

### Configuration the `.env` File

The `.env` file should contain the following variables:

```
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_DATABASE=your_mysql_database
APP_ID=login_uid
APP_SECRET=login_pw
```

- `DB_HOST`: The hostname or IP address of your MySQL server. Default, `localhost`

- `DB_USER`: Your MySQL username.
-
- `DB_PASSWORD`: Your MySQL password.

- `DB_DATABASE`: The name of the MySQL database you want to use.

- `APP_ID`: SCORM userid
-
- `APP_SECRET`: SCORM password

**Important:** Do not commit your .env file to version control (e.g., Git) to prevent exposing your database credentials. Add `.env` to your `.gitignore` file.

### Usage
Run the application:

```
node index.js
```

This will connect to your MySQL database and create the necessary tables (if they don't exist).



