const { expect } = require("chai");

// describe.only("xfs", () => {
//   it("new user as cwd blank", async () => {
//     const newuser = await new_user(require("uuid").v4(), "11");
//     expect(newuser.cwd).eq("");
//     it("list files at root", async () => {
//       const files = await xfs.list_fs_graph_table(newuser.cwd);
//       expect(files.rows.length).gt(1);
//       newuser.cwd = cd(newuser.cwd, "data");
//       const sc = await xfs.list_fs_graph_table(newuser.cwd);
//       expect(sc.rows.length).eq(2);
//       await db.close();
//       console.log("adsfdas");
//     });
//   });
// });

async function go() {
  require("dotenv").config();
  const db = require("../server/lib/db");
  const { new_user } = require("../server/lib/db");
  const xfs = require("../server/lib/xfs");
  const newuser = await new_user(require("uuid").v4(), "11");
  const expect = () => {};
  const files = await xfs.list_fs_graph_table(newuser.cwd);
  console.log(await db.listAll("fs_graph"));
  newuser.cwd = require("../server/util").cd(["data"], newuser.cwd);
  const sc = await xfs.list_fs_graph_table(newuser.cwd);
  await db.close();
  console.log(newuser.cwd, sc, "adsfdas");
}
go();
