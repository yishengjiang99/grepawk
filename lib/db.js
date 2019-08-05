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
            throw err;
        }
    },
    get_oauth_user: async function(userInfo){
        try {
            var user = await db.query("select * from users where email = $1", [userInfo.email]);
            if (user && user[0]) return user[0];
            console.log(userInfo, "crete new user with email "+userInfo.email);

            const uuid = userInfo.uuid || uuidv4()
            username = userInfo.email;
            
            user = await db.query("insert into users \
            (uuid, xp, points, cwd, username, email, fname, lname, avatar)      \
            values ($1, $2, $3, $4, $5,$6,$7,$8,$9) returning *",
            [uuid, 0, 0, '', username, userInfo.email, userInfo.given_name, userInfo.family_name, userInfo.picture]);
            return user; 
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
    get_user_with_password: async function (username, password){
        try {
            var user = await db.query("select * from users where username = $1 and password=$2", [username, password]);
            if (user && user[0]) return user[0];
            else return false;
        } catch (err) {
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
    },
    list_table: async function(tableName,filter,val){
        const client = new Client()
        await client.connect();
        var sql = "select * from "+tableName+" where "+filter+"=$1";
        var vals=[val];
        console.log(sql);
        console.log(vals);
        return client.query(sql,vals);

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
        sql+=") returning *";
        client.query(sql, sqlUpdates).then(_res => {
            resolve(_res.rows[0]);
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
    db.list_table("fs_graph","type","dir").then(res=>{
        console.log(res.rows);
    })
}
//test();
