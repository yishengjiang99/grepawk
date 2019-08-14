const {
    Pool,
    Client
} = require('pg')
const db = require("./db");


const getClient = async function () {
    const client = new Client({
            connectionString: process.env.PG_CONNNECTION_STRING,
    })
    await client.connect();
    return client;
}

const mark_quest_complete= async function(user, quest){
    return new Promise(async (resolve, reject) => {
        try{
            const c = await getClient();
            await c.query("insert into quest_completion (uuid, quest_id) \
                         values ($1,$2)", [user.uuid, quest.id]);
                         
            var res =  await c.query("update users set xp = xp + $1 where uuid = $2 returning *",
                [quest.xp_reward, user.uuid]);
            if(res.rows && res.rows[0]){

                resolve(res.rows[0]);
            }else{
                reject(new Error("500"));
            }
        } catch (e) {
            reject(e);
        }
    });
}

const quests = {
    check_quest_completion: (cmd, user, ws)=>{
        console.log("checking "+cmd);
        quests.list_all(user).then(quests => {
            quests.forEach((quest,index)=>{
                console.log("["+quest.description +"] vs [" + cmd+"]");
                if(quest.description.includes(cmd)){
                    ws.send("stdout: You completed quest for "+quest.xp_reward+" xp");
                    mark_quest_complete(user,quest).then(user=>{
                        //console.log(user);
                        ws.send(JSON.stringify({userInfo:user}));
                        quests.send_quests(user,ws);
                    });
                }
            });
        }).catch(err => {
            throw err
        });
    },
    send_quests: (user, ws)=>{
        quests.list(user).then(quests => {
            user.quests={};
            quests.forEach((quest,index)=>{
               user.quests[quest.description] = quest;
               ws.send("stdout: Quest: <b>"+quest.description+"</b> "+quest.xp_reward+"xp");
            });
            //ws.send("stdout: " + JSON.stringify(quests));
        }).catch(err => {
            throw err
        });
    },

    
    list: async function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                const c = await getClient();
                const res = await c.query("select quests.* from quests      \
                               where (pwd is null or pwd = $1)  \
                                and quests.id not in            \
                                    (select quest_id            \
                                     from quest_completion      \
                                     where uuid = $2            \
                                     )", [user.cwd, user.uuid]);
                                     console.log("select quests.* from quests      \
                                     where (pwd is null or pwd = $1)  \
                                      and quests.id not in            \
                                          (select quest_id            \
                                           from quest_completion      \
                                           where uuid = $2            \
                                           )",[user.cwd, user.uuid]);
                await c.end();
                resolve(res.rows);
            } catch (e) {
                reject(e);
            }
        })
    },
    list_all: async function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                const c = await getClient();
                const res = await c.query("select quests.* from quests      \
                               where quests.id not in            \
                                    (select quest_id            \
                                     from quest_completion      \
                                     where uuid = $1            \
                                     )", [user.uuid]);
                await c.end();
                resolve(res.rows);
            } catch (e) {
                reject(e);
            }
        })
    }
}


var test = async function () {
    try {
        var user = await db.get_user("d6c11cc2-ea1c-4f84-8edb-5989a05f016c");
        const q = await quests.list(user);
        console.log(q);
    } catch (err) {
        console.log("dfasf")
        console.log(err)
    }
}
module.exports = quests;
//test();
