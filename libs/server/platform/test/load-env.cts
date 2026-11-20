/** Load the repo-root .env into integration test workers (CI sets the variables directly). */
require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../../../../.env'),
  quiet: true,
});
