const {
    Pool,
    Client
} = require('pg')
const Promise = require('promise')
const uuidv4 = require('uuid/v4');
require('dotenv').config()


exports.query = async function (query, args = []) {
    return new Promise((resolve, reject) => {
        const pool = new Pool({
            connectionString: process.env.PG_CONNNECTION_STRING
        })
        pool.query(query, args, (err, res) => {
            if (err) reject(err);
            else resolve(res.rows);
            pool.end();
            return;
        })
    })
}

exports.new_user = async function (uuid) {
    try {
        var user = await exports.query("insert into users (uuid, xp, points, cwd) values ($1, $2, $3, $4) returning *",
            [uuid, 0, 0, '']);
        return user[0];
    } catch (err) {
        console.log(err);
        throw err;
    }
}

exports.get_user = async function (uuid) {
    try {
        var user = await exports.query("select * from users where uuid = $1", [uuid]);
        if (user && user[0]) return user[0];
        return await exports.new_user(uuid);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

exports.update_user = async function (uuid, attr, val) {
    try {
        return await exports.query("update users set " + attr + "=$1 where uuid=$2 returning *", [val, uuid]);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

var test = async function () {
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    exports.new_user(uuidv4());
    var uids = await exports.query("select uuid from users limit 2");
    exports.get_user(uids[0].uuid).then(console.log);
}
test();
