var Tests = function (subject, debug) {

    debug = debug || true;
    var _subject;


    return {
        subject: _subject,
        assert_equals: async function (expected, cmd) {
            return new Promise(async (resolve, reject) => {
                let result = await this.subject.interpret(cmd);
                if (result === false) reject(new Error("compile error"));
                // console.log("[" + result + "] vs [" + expected + "]");
                if (result === expected) {
                    if (debug) resolve(" test '" + cmd + "' return " + result + " as expected");
                    else resolve(true);
                } else {
                    if (debug) reject(" test " + cmd + " return unespected " + result + " expected: " + expected);
                    else reject(true);
                }
            })
        },
        interpret: function (cmd) {
            if (cmd == 'test schedule') {
                const script =
                    `s add 1, 
                s add 2, 
                s add 3, 
                s require 0 1,
                s start 1====1`.split(",");
                this.subject = Schedule();
                return this.test_script(this.subject, script);
            } else if (cmd == 'test schedule2') {
                const script =
                    `s add 1, 
              s add 2, 
              s add 3, 
              s require 0 1,
              s require 1 2, 
              s start 2====3`.split(",");
                this.subject = Schedule();
                return this.test_script(this.subject, script);
            } else if (cmd === 'test sched taylor') {
                const script =
                    `s add 8, 
            s add 3,
            s add 5,
            s finish====8,
            s require 2 0,
            s finish====13,
            s require 1 0,
            s finish====13,
            s start 0====5,
            s start 1====0,
            s start 2====0,
            s require 2 1,
            s finish====16`.split(",");
                this.subject = Schedule();
                return this.test_script(this.subject, script);
            }

            return false;

        },
        test_script: async function (object, script) {
            var failed = 0;
            var success = 0;
            var stdout = [];
            var stderr = [];
            await script.forEach(async line => {
                line = line.trim()
                try {
                    if (line.includes("====")) {
                        t = line.split("====");
                        t[0] = t[0].trim();
                        line = {
                            cmd: t[0].trim(),
                            expected: parseInt(t[1])
                        }
                    } else {
                        line = {
                            cmd: line.trim(),
                            expected: null
                        };
                    }
                    console.log("[" + line.cmd + "]");
                    if (line.expected == null) {
                        object.interpret(line.cmd);
                    } else {
                        let output = await this.assert_equals(line.expected, line.cmd);
                        console.log(output);
                        if (output === false) {
                            failed++;
                            stderr.push(line.cmd + " did not compile.");
                            return;
                        } else {
                            success++;
                            if (typeof output == 'string') stdout.push(output);
                        }
                    }
                } catch (err) {
                    failed++;
                    console.log(err);
                    stderr.push(err);
                }
            })

            return Promise.resolve(true);
        }
    }
}


