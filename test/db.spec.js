const { expect } = require("chai");
const db = require("../server/lib/db.js");

describe("db", () => {
  it("calls psql", async () => {
    const rows = await db
      .query("select now()", [])
      .catch((e) => expect.fail(e));
  });
  it("query user table", async () => {
    const allUser = await db.listAll("users");
    const uuid = require("uuid").v4();
    const rrr = await db.new_user(uuid, "a");

    expect(rrr.uuid).eq(uuid);
  });
  after(async function () {
    await db.close();
  });
});
