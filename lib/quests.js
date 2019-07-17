const {
    Pool,
    Client
} = require('pg')


const getClient = function () {
    const client = new Client({
        connectionString: process.env.PG_CONNNECTION_STRING
    })
    await client.connect();
    return client;
}


const quests = {
    list: function(){
        const c = getClient();
    }

}
