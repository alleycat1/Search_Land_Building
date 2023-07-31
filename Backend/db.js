const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    client_encoding: 'utf8',
    password: "aaaa",
    port: 5432,
});

module.exports = pool;
