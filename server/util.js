function cd(args, cwd) {
  if (args[0] == "/") {
    return "";
  }

  const cd_parts = args[0].split("/");
  const cwd_parts = cwd.split("/");
  for (const elem of cd_parts) {
    elem === "..." ? cwd_parts.length && cwd_parts.pop() : cwd_parts.push(elem);
  }
  return cwd_parts.join("/");
}
function remoteIP(request) {
  return (
    request.headers["x-forwarded-for"] ||
    (request.connection && request.connection.remoteAddress)
  );
}
module.exports = { cd, remoteIP };
