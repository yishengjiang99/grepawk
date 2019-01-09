
const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://grepawk@localhost:5432/grepawk';
const client = new pg.Client(connectionString);
client.connect();
const query = client.query('select now()');

query.on('row', function(row) {
    console.log(row);
});

query.on('end', function() {
    client.end();
});



