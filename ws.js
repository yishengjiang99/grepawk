require('dotenv').config()
const WebSocket = require('ws')
const HttpRequest = require('request');

const fs = require('fs');
const path = require("path");

const port = process.env.ws_port || 8081
const wss = new WebSocket.Server({
    port: port
})
const {
    exec,
    spawn,
} = require('child_process');
const utf8 = require('utf8');

const db = require("./lib/db");
const xfs = require("./lib/xfs");
const quests = require("./lib/quests");
const gsearch = require("./lib/gsearch");

console.log("listening on " + port)

var users = {};
var spawned_procs = {};

const root_path = __dirname + "/world";
const send_json_resonse = function (ws, json) {
    ws.send(JSON.stringify(json));
}

wss.on('connection', (ws, request) => {
    var user;
    console.log(request.connection.remoteAddress);
    ws.on('message', async message => {
        try {
            if (user && user.uuid && spawned_procs[user.uuid]) {
                if (message === 'esc') {
                    spawned_procs[user.uuid].kill('SIGINT');
                    delete(spawned_procs[user.uuid]);
                }
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
                case 'search':
                    if (args.length < 1) {
                        ws.send("stderr: Usage: search <keyword>");
                        return;
                    }
                    keyword = args[0];
                    pageToken = args[1] || "";
                    gsearch.find_youtube(keyword, 5, pageToken).then((ret) => {
                        send_json_resonse(ws, {
                            table: ret
                        });
                        if (ret.nextPage) {
                            send_json_resonse(ws, {
                                link: {
                                    url: `onclick: search ${keyword} ${ret.nextPage}`,
                                    text: 'more'
                                }
                            });
                        }
                    }).catch((err) => {
                        console.error(err);
                        ws.send("stderr: sssss" + err.message);
                    })
                    break;
                 
                case 'wget':
                    if(args.length!==1){
                        ws.send("strderr: Usage: wget $url")
                    }
                    var filename = path.basename(args[0]);
                    const file = fs.createWriteStream(cwd+"/"+filename);
                    const url = args[0].replace("https","http"); //server-to-server

                    ws.send("stdout: fetching "+url+" to "+filename);
                    HttpRequest.get(url).on("response",_response=>{
                        ws.send("stdout: file got");
                        var stream = _response.pipe(file);
                        ws.send("stdout: downloading..");
                        stream.on("finish",()=>{
                            ws.send("stdout: downloaded file to "+filename);
                        })

                    });

                    break;
                    //request('http://google.com/doodle.png').pipe(fs.createWriteStream('doodle.png'))

                case 'create_table':
                    ws.send("stdout: "+args[0]);
                    break;
                case 'table_data':
                    ws.send("stdout: "+args[0]);
                    break;
                case 'git':
                case 'ps':
                case 'cat':
                case 'node':                    
                case 'head':
                case 'tail':
                    try {
                        console.log("SPAWN " + cmd + " " + args.join(" "));
                        const sub_proc = spawn(cmd, args, {
                            cwd: cwd
                        });
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
                        sub_proc.stderr.on("data", data => {
                            ws.send("stderr: " + data.toString('utf-8'));
                        });
                        sub_proc.on("close", () => {
                            console.log("subproc closee");
                            delete spawned_procs[user.uuid];
                            ws.send("set-spawn-mode-off");
                        });
                        sub_proc.unref();

                    } catch (err) {
                        ws.send("stderr: " + err.message);
                    }
                    break;
                case 'check-in':
                    const uuid = args[0];
                    user = await db.get_user(uuid,request.headers['x-forwarded-for'] || request.connection.remoteAddress);
                    users[uuid] = {
                        ws: ws,
                        user: user
                    }
                    cwd = root_path + user.cwd;
                    ws.send(JSON.stringify({
                        userInfo: user
                    }));
                    Object.values(users).forEach(_user => {
                        _user.ws.send("stdout: user " + user.username + " arrived");
                    });
          //          quests.send_quests(user, ws);
                    console.log(user.quests);
                    xfs.send_description(cwd, ws);
                    xfs.auto_complete_hints(cwd, ws);
                    ws.send("checkedin");
                    break;
                case 'shout':
                    Object.values(users).forEach(_user => {
                        _user.ws.send("stdout: " + user.username + " shouts '"+args.join(" ")+"'");
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
                    quests.check_quest_completion(message, user, ws);
                    xfs.send_description(cwd, ws);
                    quests.send_quests(user, ws);

                    xfs.auto_complete_hints(cwd, ws);
                    break;
                    //break;
                case 'pwd':
                    console.log("user.cwd " + user.cwd);
                    ws.send("stdout: " + user.cwd);
                    break;
                case 'ls':
                    //xfs.send_description(cwd, ws);
                    quests.send_quests(user, ws);
                    xfs.auto_complete_hints(cwd, ws);
                case 'echo':
                case 'mkdir':
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
                    xfs.auto_complete_hints(cwd, ws);
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

require("./http.js");
