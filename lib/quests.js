const {
    Pool,
    Client
} = require('pg')
const db = require("./db");


const getClient = async function () {
    const client = new Client({
            connectionString: process.env.PG_CONNNECTION_STRING,
    })
    await client.connect();
    return client;
}


const quests = {
    list: async function (user) {

        return new Promise(async (resolve, reject) => {
            try {
                const c = await getClient();
                const res = await c.query("select quests.* from quests      \
                               where (pwd is null or pwd = $1)  \
                                and quests.id not in            \
                                    (select quest_id            \
                                     from quest_completion      \
                                     where uuid = $2            \
                                     )", [user.cwd, user.uuid]);
                await c.end();
                resolve(res.rows);
            } catch (e) {
                reject(e);
            }
        })
    }
}


var test = async function () {
    try {
        var user = await db.get_user("d6c11cc2-ea1c-4f84-8edb-5989a05f016c");
        const q = await quests.list(user);
        console.log(q);
    } catch (err) {
        console.log("dfasf")
        console.log(err)
    }
}
module.exports = quests;
//test();
