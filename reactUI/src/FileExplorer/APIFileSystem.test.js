import api_fs from "./APIFileSystem";

test("basic", () => {
  expect(api_fs("azure").get_files).exists;
});
test("list files", async (done) => {
  const ret = await api_fs("azure").get_files();
  expect(ret).exits;
  done();
});
test("list market files", async (done) => {
  const ret = await api_fs("market").get_files();
  expect(ret).exits;
  done();
});
