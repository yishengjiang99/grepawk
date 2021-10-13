const execSync = require("child_process").execSync;
describe("http upgrade goes to wsservers", () => {
  it("http on", async function () {
    const serve = await require("../server.js").startServer(5000);
    let getr = require("http").request("http://localhost:5000", (res) => {
      expect(res.statusCode).eq(200);
      getr.abort();
      serve.close();
    });
  });
});
