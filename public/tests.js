var Tests = function(subject, debug){
    debug = debug || true;
    var _subject
    return {
        subject: _subject,
        inputLine: function(cmd, expected){
            return {
                line: cmd,
                expected: expected
            }
        },
        assert_equals: async function(expected, cmd){
           
            return new Promise((resolve, reject)=>{
                let result = this.subject.interpret(cmd);
                if(result === false) reject(new Error("compile error"));
                if (result === expected){
                    if(debug) resolve(subject+" test "+cmd+" return "+ result+" as expected");
                    else resolve(true);
                }else{
                    if(debug) reject(subject+" test "+cmd+" return unespected "+ result+" expected: "+expected);
                    else reject(true);
                }
            })
        },
        interpret: async function(cmd){
            if(cmd=='test schedule'){
                const script = "s add 1, s add 2, s start 1".split(", ");
                var schedule = Schedule()
                return this.test_script(schedule, script);
            }
            return false;

        },
        test_script: async function(object, script){
            var failed = 0;
            var success = 0;
            var stdout = [];
            var stderr = [];
            script.forEach(async line=>{
                try{
                    if(typeof line =='string'){
                        line = {cmd:line, expected:null};
                    }
                    if(!line.expected){
                        object.interpret(line.cmd);
                    }else{
                        let output = await this.assert_equals(line.expected,cmd);
                        if(output==false){
                            failed++;
                            stderr.push(line.cmd+" did not compile ");
                            return;
                        }else{
                            success++;
                            if(typeof output =='string')  stdoput.push(output);
                        }
                    }
                }catch(err){
                    failed++;
                    stderr.push(err.message);
                }
            })
            return Promise.resolve([success, failed, stdout, stderr]);
        }
    }
}

var test = Tests();
test.interpret("test schedule");
