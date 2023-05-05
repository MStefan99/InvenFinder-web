# Invenfinder backend server

### How to use

Invenfinder server uses MariaDB to store the data. Please install MariaDB server first.

To run Invenfinder, run `deno run index.ts --allow-env --allow-net`

### Configuration

When starting Invenfinder, you can use a number of environment variables to adjust its behavior.

General\
`ENV` - Used to set the environment Invenfinder is running in. The available values are:

- `<none>`: Use default settings
- `dev`: Settings used for development. Enables CORS for all domains and enables
  sending full error logs to the client over HTTP.

Network\
`PORT` - Specifies the port to run the server on. Default port is 3007\
`CORS_ORIGIN` - Configures one CORS origin to be allowed

Database\
`DB_URL` (required) - URL of the MariaDB server\
`DB_USERNAME` (required) - MariaDB username\
`DB_PASSWORD` (required) - MariaDB password

File uploads\
`UPLOAD_DIR` - The directory to use for file uploads. Files in the directory will be available to all users.
Requires `--allow-read` and `--allow-write` Deno options\
`NO_UPLOADS` - Disable file upload functionality

Accounts\
`NO_ACCOUNTS` - Disable account creation

Analytics\
`CRASH_COURSE_URL` - URL of a Crash Course server to be used for analytics
`CRASH_COURSE_AUDIENCE_KEY` - Audience key for a Crash Course server
`CRASH_COURSE_TELEMETRY_KEY` - Telemetry key for a Crash Course server
