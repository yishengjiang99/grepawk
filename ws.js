const WebSocket = require('ws')
const port = process.env.port || 8081
const wss = new WebSocket.Server({
    port: port
})
const {
    exec,
    spawn,
    execSync
} = require('child_process');
const db = require("./lib/db");

console.log("listening on " + port)

var users = {};
const root_path = __dirname + "/world";

wss.on('connection', (ws, request) => {
    var user;
    ws.on('message', async message => {
        try {
            var cwd = user ? root_path + user.cwd : root_path;

            message = message.trim();
            var t = message.split(" ");
            if (t === "") return;
            const cmd = t[0];
            const args = t.length > 1 ? t.splice(1) : [];
            switch (cmd) {
                case 'check-in':
                    const uuid = args[0];
                    user = await db.get_user(uuid);
                    console.log(user);
                    users[uuid] = {
                        ws: ws,
                        user: user
                    }
                    cwd = root_path + user.cwd;
                    Object.values(users).forEach(_user => {
                      _user.ws.send("user "+user.uuid+" arrived");
                    });
                    break;
                case 'cd':
                    cwd += "/"+args[0];
                    db.update_user(user.uuid, 'cwd', cwd.replace(root_path, ''));
                    break;
                case 'pwd':
                    ws.send(cwd);
                    break;
                case 'echo':
                case 'mkdir':
                case 'cat':
                case 'touch':
                case 'ls':
                    console.log(cwd);
                    exec(message, {
                        cwd: cwd
                    }, (err, stdout, stderr) => {
                        if (err) ws.send("error: " + err.message);
                        else ws.send(stdout);
                    });
                    break;
                default:
                    ws.send(message);
                    break;
            }
        } catch (err) {
            console.log(err);
            ws.send(err.message);
        }
    })
    ws.send('hi!')
})
