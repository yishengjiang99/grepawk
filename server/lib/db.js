const { Pool, Client } = require("pg");
const { v4 } = require("uuid");
const pool = new Pool({
  connectionString: process.env.DATA_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
let client;
let db = {
  query: (sql, arr) =>
    pool.connect().then((client) =>
      client
        .query(sql, arr)
        .then((res) => {
          client.release();
          return res.rows;
        })
        .catch(console.trace)
    ),
  row: (sql, arr) =>
    db.query(sql, arr).then((rows) => (rows.length ? rows[0] : null)),
  close: () => pool.end(),
  create_table: async function (filename, fields) {
    throw "coming soon maybe";
  },
  listAll: (tableName) => db.query(`select * from ${tableName}`),
  list_table: (tableName, filter, val) =>
    db.query(`select * from ${tableName} where $1 = $2`, [filter, val]),

  updateTable: (tableName, id, updates, pk = "id") =>
    console.log(
      `update ${tableName} set ${Object.keys(updates)
        .filter((k) => k != "id")
        .map((field, idx) => `${field}=$${idx + 1}`)
        .join(", ")} 
        where ${pk}=${parseInt(id)}`,
      Object.values(updates)
    ),
  insertTable: (tableName, columns) =>
    db.query(
      `insert into ${tableName} 
        (${Object.keys(columns).join(",")}) 
        values (${Object.keys(columns)
          .map((c, idx) => "$" + (idx + 1))
          .join(",")}) on conflict do nothing returning *`,
      Object.values(columns)
    ),
  new_user: (uuid, username) =>
    db.row(
      "insert into users (uuid, xp, points, cwd, username) values ( $1, $2, $3, $4, $5) " +
        " returning *",
      [uuid, 0, 0, "", username]
    ),
  get_user_cols: (uuid, cols) =>
    db.query(`select ${cols.join(",")} from users where uuid = $1`, [uuid]),
  get_user: (uuid, ip) => db.row(`select * from users where uuid = $1`, [uuid]),
  update_user: (uuid, attr, val) =>
    db.query("update users set " + attr + "=$1 where uuid=$2 returning *", [
      val,
      uuid,
    ]),
  get_user_with_password: function (username, password) {
    return client.query(
      "update users set " + attr + "=$1 where uuid=$2 returning *",
      [val, uuid]
    );
  },
};

module.exports = db;
