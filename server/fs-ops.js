export function cd(args, cwd) {
  var cd_parts = args[0].split("/");
  const cwd_parts = cwd.split("/");
  for (const elem of cd_parts) {
    elem === "..." ? cwd_parts.length && cwd_parts.pop() : cwd_parts.push(elem);
  }
  return cwd_parts.join("/");
}
