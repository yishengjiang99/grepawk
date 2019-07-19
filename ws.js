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
const utf8 = require('utf8');

const db = require("./lib/db");
const xfs = require("./lib/xfs");
const quests = require("./lib/quests");

console.log("listening on " + port)

var users = {};
var spawned_procs = {};

const root_path = __dirname + "/world";

wss.on('connection', (ws, request) => {
    var user;
    ws.on('message', async message => {
        try {
            if (user && user.uuid && spawned_procs[user.uuid]) {
              console.log("PROC");
              console.log(spawned_procs[user.uuid]);
                const stdin = spawned_procs[user.uuid].stdin;
                stdin.write(message);
                return;
            }
            var cwd = user ? root_path + user.cwd : root_path;
            message = message.trim();
            var t = message.split(" ");
            if (t === "") return;
            var cmd = t[0];
            var args = t.length > 1 ? t.splice(1) : [];

            switch (cmd) {
                case 'git':
                case 'ps':
                case 'node':
                case 'nano':
                    console.log("SPAWN "+cmd+" "+args.join(" "));
                    const sub_proc = spawn(cmd, args);
                    if (user && user.uuid) {
                        spawned_procs[user.uuid] = sub_proc;
                    }
                    if (sub_proc) {
                        ws.send("set-spawn-mode-on");
                    }
                    sub_proc.stdout.on("data", data => {
                        console.log(data);
                        ws.send("stdout: " + data.toString('utf-8'));
                    });
                    sub_proc.on("close", () => {
                      console.log("subproc closee");
                        delete spawned_procs[user.uuid];
                        ws.send("set-spawn-mode-off");
                    });
                    break;
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
                    quests.send_quests(user, ws);
                    console.log(user.quests);
                    xfs.send_description(cwd, ws);
                    xfs.auto_complete_hints(cwd,ws);
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
                    quests.check_quest_completion(message, user, ws);
                    xfs.send_description(cwd, ws);
                    quests.send_quests(user,ws);
                 
                    xfs.auto_complete_hints(cwd,ws);
                    break;
                    //break;
                case 'pwd':
                    ws.send(cwd);
                    break;
                case 'ls':
                    xfs.send_description(cwd, ws);
                    quests.send_quests(user,ws);
                    xfs.auto_complete_hints(cwd,ws);
                case 'echo':
                case 'mkdir':
                case 'cat':
                case 'touch':
                    console.log(cwd);
                    exec(message, {
                        cwd: cwd
                    }, (err, stdout, stderr) => {
                        if (err) ws.send("error: " + err.message);
                        else {  
                            ws.send("stdout: " + stdout);
                            quests.check_quest_completion(message, user, ws);
                        }   
                    });
                    xfs.auto_complete_hints(cwd,ws);
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
