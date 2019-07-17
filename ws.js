require('dotenv').config()
const WebSocket = require('ws')
const port = process.env.ws_port || 8081
const wss = new WebSocket.Server({
    port: port
})
const {
    exec,
    spawn,
    execSync
} = require('child_process');

const db = require("./lib/db");
const xfs = require("./lib/xfs");
const quests = require("./lib/quests");

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
            var cmd = t[0];
            var args = t.length > 1 ? t.splice(1) : [];
            switch (cmd) {
                case 'check-in':
                    const uuid = args[0];
                    user = await db.get_user(uuid);
                    user.username = 'guest';
                    console.log(user);
                    users[uuid] = {
                        ws: ws,
                        user: user
                    }
                    cwd = root_path + user.cwd;
                    ws.send(JSON.stringify({
                        userInfo: user
                    }));
                    Object.values(users).forEach(_user => {
                        _user.ws.send("stdout: user " + user.uuid + " arrived");
                    });
                    break;
                case 'cd':
                    if (args.length < 1) {
                        ws.send("Usage: cd [directory]");
                        break;
                    }

                    var cd_parts = args[0].split("/");
                    var current_pwd = user.cwd.split("/");
                    cd_parts.forEach((elem, index) => {
                        if (elem == '..') {
                            if (current_pwd.length > 0) current_pwd.pop();
                        } else {
                            current_pwd.push(elem);
                        }
                    });
                    user.cwd = current_pwd.join("/");
                    cwd = root_path + "/" + user.cwd;
                    db.update_user(user.uuid, 'cwd', user.cwd);
                    ws.send(JSON.stringify({
                        userInfo: user
                    }));
                    xfs.describe(cwd).then(desc => {
                        ws.send("stdout: " + desc);
                    }).catch(err => {
                        throw err;
                    });
                    break;
                    //break;
                case 'pwd':

                    ws.send(cwd);
                    break;
                case 'node':
                case 'ls':
                    xfs.describe(cwd).then(desc => {
                        ws.send("stdout: " + desc);
                    }).catch(err => {
                        throw err;
                    });
                    quests.list(user).then(quests=>{
                      ws.send("stdout: "+JSON.stringify(quests));
                    }).catch(err=>{throw err});
                case 'git':
                case 'echo':
                case 'mkdir':
                case 'cat':
                case 'touch':
                    console.log(cwd);
                    exec(message, {
                        cwd: cwd
                    }, (err, stdout, stderr) => {
                        if (err) ws.send("error: " + err.message);
                        else ws.send("stdout: " + stdout);
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
})
