const {
    Pool,
    Client
} = require('pg')

const Promise = require('promise')
const uuidv4 = require('uuid/v4');

require('dotenv').config();

const db = {
    query: function (query, args = []) {
        //systemctl daemon-reload
        console.log(process.env.PG_CONNNECTION_STRING);
        return new Promise((resolve, reject) => {
            const pool = new Pool({
                connectionString: process.env.PG_CONNNECTION_STRING,
            })
            pool.query(query, args, (err, res) => {
                if (err) reject(err);
                else resolve(res.rows);
                pool.end();
                return;
            })
        })
    },

    new_user: async function (uuid, username) {
        try {
            var user = await db.query("insert into users (uuid, xp, points, cwd,username) values ($1, $2, $3, $4,$5) returning *",
                [uuid, 0, 0, '', username]);
            return user[0];
        } catch (err) {
            console.log(err);
            throw err;
        }
    },
    get_user: async function (uuid, ip) {
        try {
            var user = await db.query("select * from users where uuid = $1", [uuid]);
            if (user && user[0]) return user[0];
            username = ip;
            return await db.new_user(uuid, username);
        } catch (err) {
            console.log(err);
            throw err;
        }
    },

    update_user: async function (uuid, attr, val) {
        try {
            return await db.query("update users set " + attr + "=$1 where uuid=$2 returning *", [val, uuid]);
        } catch (err) {
            console.log(err);
            throw err;
        }
    },
    create_table: async function (filename, fields) {
        try {
            //const ret db.query("create table $1 ()", [val, uuid]);
        } catch (err) {
            console.log(err);
            throw err;

        }
    }
}

function updateTable(tableName, id, updates) {
    return new Promise(async (resolve, reject) => {
        if (!id) {
            throw new Error("Id required");
        }
        const client = new Client()
        await client.connect();
        let sql = `update ${tableName} set `;
        let sqlUpdates = [];

        Object.keys(updates).forEach(field => {
            if (field == 'id') return;
            else {
                sql += `${field}=$${sqlUpdates.length+1}`;
                sqlUpdates.push(updates[field]);
            }
        });

        sql += ` where id = $${sqlUpdates.length+1}`;
        sqlUpdates.push(id);

        client.query(sql, sqlUpdates).then(_res => {
            resolve();
        }).catch(err => {
            console.log(err);
            reject(err);
        }).finally(()=>{
            client.end();
        });
    })
}

function insertTable(tableName, columns) {
    return new Promise(async (resolve, reject) => {
        const client = new Client()
        await client.connect();
        let columnsClause=Object.keys(columns).join(",");

        let sql = `insert into ${tableName} (${columnsClause}) values (`;
        let sqlUpdates = [];
        Object.keys(columns).forEach((field,index,arr) => {
            sql += `$${sqlUpdates.length+1}`;
            if(index<arr.length-1) sql+=",";
            sqlUpdates.push(columns[field]);
        });
        sql+=")";
        client.query(sql, sqlUpdates).then(_res => {
            resolve();
        }).catch(err => {
            console.log(err);
            reject(err);
        }).finally(()=>{
            client.end();
        });
    })
}

db.updateTable=updateTable;
db.insertTable=insertTable;
module.exports = db;



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