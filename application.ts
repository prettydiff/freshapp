/*jslint node:true */
/*eslint-env node*/
/*eslint no-console: 0*/

import { Stats } from "fs";
import * as http from "http";
import { Stream, Writable } from "stream";
import { Hash } from "crypto";
type directoryItem = [string, "file" | "directory" | "link" | "screen", number, number, Stats];
interface directoryList extends Array<directoryItem> {
    [key:number]: directoryItem;
}
interface readFile {
    callback: Function;
    index: number;
    path: string;
    stat: Stats;
}
(function init() {
    "use strict";
    let verbose:boolean = false;
    const startTime:[number, number]      = process.hrtime(),
        node:any = {
            child : require("child_process").exec,
            crypto: require("crypto"),
            fs    : require("fs"),
            http  : require("http"),
            https : require("https"),
            os    : require("os"),
            path  : require("path")
        },
        text:any     = {
            angry    : "\u001b[1m\u001b[31m",
            blue     : "\u001b[34m",
            bold     : "\u001b[1m",
            clear    : "\u001b[24m\u001b[22m",
            cyan     : "\u001b[36m",
            diffchar : "\u001b[1m\u001b[4m",
            green    : "\u001b[32m",
            nocolor  : "\u001b[39m",
            none     : "\u001b[0m",
            purple   : "\u001b[35m",
            red      : "\u001b[31m",
            underline: "\u001b[4m",
            yellow   : "\u001b[33m"
        },
        cli:string = process.argv.join(" "),
        sep:string = node.path.sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 1).join(sep) + sep;
        }()),
        version:version = require(`${projectPath}version.js`),
        js:string = `${projectPath}js${sep}`,
        commands:commandList = {
            base64: {
                description: "Convert a file or string into a base64 encoding.",
                example: [
                    {
                        code: `${version.command} base64 encode string:"my string to encode"`,
                        defined: "Converts the provided string into a base64 encoding."
                    },
                    {
                        code: `${version.command} base64 encode path/to/file`,
                        defined: "Converts the provided file into a base64 encoding."
                    },
                    {
                        code: `${version.command} base64 encode http://file.from.internet.com`,
                        defined: "Reads a file from a URI and outputs a base64 encoding."
                    },
                    {
                        code: `${version.command} base64 decode string:"a big base64 string"`,
                        defined: "Decodes base64 strings into decoded output."
                    }
                ]
            },
            build: {
                description: "Rebuilds the application.",
                example: [
                    {
                        code: `${version.command} build`,
                        defined: "Compiles from TypeScript into JavaScript and puts libraries together."
                    },
                    {
                        code: `${version.command} build incremental`,
                        defined: "Use the TypeScript incremental build, which takes about half the time."
                    },
                    {
                        code: `${version.command} build local`,
                        defined: "The default behavior assumes TypeScript is installed globally. Use the 'local' argument if TypeScript is locally installed in node_modules."
                    }
                ]
            },
            commands: {
                description: "List all supported commands to the console or examples of a specific command.",
                example: [
                    {
                        code: `${version.command} commands`,
                        defined: "Lists all commands and their definitions to the shell."
                    },
                    {
                        code: `${version.command} commands directory`,
                        defined: "Details the mentioned command with examples."
                    }
                ]
            },
            copy: {
                description: "Copy files or directories from one location to another on the local file system.",
                example: [
                    {
                        code: `${version.command} copy source/file/or/directory destination/path`,
                        defined: "Copies the file system artifact at the first address to the second address."
                    },
                    {
                        code: `${version.command} copy "C:\\Program Files" destination\\path`,
                        defined: "Quote values that contain non-alphanumeric characters."
                    },
                    {
                        code: `${version.command} copy source destination ignore [build, .git, node_modules]`,
                        defined: "Exclusions are permitted as a comma separated list in square brackets following the ignore keyword."
                    },
                    {
                        code: `${version.command} copy source destination ignore[build, .git, node_modules]`,
                        defined: "A space between the 'ignore' keyword and the opening square brace is optional."
                    },
                    {
                        code: `${version.command} copy ../prettydiff3 ../prettydiffXX ignore [build, .git, node_modules]`,
                        defined: "Exclusions are relative to the source directory."
                    }
                ]
            },
            directory: {
                description: "Traverses a directory in the local file system and generates a list.",
                example: [
                    {
                        code: `${version.command} directory source:"my/directory/path"`,
                        defined: "Returns an array where each index is an array of [absolute path, type, parent index, file count, stat]. Type can refer to 'file', 'directory', or 'link' for symbolic links.  The parent index identify which index in the array is the objects containing directory and the file count is the number of objects a directory type object contains."
                    },
                    {
                        code: `${version.command} directory source:"my/directory/path" shallow`,
                        defined: "Does not traverse child directories."
                    },
                    {
                        code: `${version.command} directory source:"my/directory/path" listonly`,
                        defined: "Returns an array of strings where each index is an absolute path"
                    },
                    {
                        code: `${version.command} directory source:"my/directory/path" symbolic`,
                        defined: "Identifies symbolic links instead of the object the links point to"
                    },
                    {
                        code: `${version.command} directory source:"my/directory/path" ignore [.git, node_modules, "program files"]`,
                        defined: "Sets an exclusion list of things to ignore"
                    },
                    {
                        code: `${version.command} directory source:"my/path" typeof`,
                        defined: "returns a string describing the artifact type"
                    }
                ]
            },
            get: {
                description: "Retrieve a resource via an absolute URI.",
                example: [
                    {
                        code: `${version.command} get http://example.com/file.txt`,
                        defined: "Gets a resource from the web and prints the output to the shell."
                    },
                    {
                        code: `${version.command} get http://example.com/file.txt path/to/file`,
                        defined: "Get a resource from the web and writes the resource as UTF8 to a file at the specified path."
                    }
                ]
            },
            hash: {
                description: "Generate a SHA512 hash of a file or a string.",
                example: [
                    {
                        code: `${version.command} hash path/to/file`,
                        defined: "Prints a SHA512 hash to the shell for the specified file's contents in the local file system."
                    },
                    {
                        code: `${version.command} hash verbose path/to/file`,
                        defined: "Prints the hash with file path and version data."
                    },
                    {
                        code: `${version.command} hash string "I love kittens."`,
                        defined: "Hash an arbitrary string directly from shell input."
                    },
                    {
                        code: `${version.command} hash https://prettydiff.com/`,
                        defined: "Hash a resource from the web."
                    },
                    {
                        code: `${version.command} hash path/to/directory`,
                        defined: "Directory hash recursively gathers all descendant artifacts and hashes the contents of each of those items that are files, hashes the paths of directories, sorts this list, and then hashes the list of hashes."
                    },
                    {
                        code: `${version.command} hash path/to/directory list`,
                        defined: "Returns a JSON string listing all scanned file system objects and each respective hash."
                    }
                ]
            },
            help: {
                description: `Introductory information to ${version.name} on the command line.`,
                example: [{
                    code: `${version.command} help`,
                    defined: "Writes help text to shell."
                }]
            },
            lint: {
                description: "Use ESLint against all JavaScript files in a specified directory tree.",
                example: [
                    {
                        code: `${version.command} lint ../tools`,
                        defined: "Lints all the JavaScript files in that location and in its subdirectories."
                    },
                    {
                        code: `${version.command} lint`,
                        defined: `Specifying no location defaults to the ${version.name} application directory.`
                    },
                    {
                        code: `${version.command} lint ../tools ignore [node_modules, .git, test, units]`,
                        defined: "An ignore list is also accepted if there is a list wrapped in square braces following the word 'ignore'."
                    }
                ]
            },
            remove: {
                description: "Remove a file or directory tree from the local file system.",
                example: [
                    {
                        code: `${version.command} remove path/to/resource`,
                        defined: "Removes the specified resource."
                    },
                    {
                        code: `${version.command} remove "C:\\Program Files"`,
                        defined: "Quote the path if it contains non-alphanumeric characters."
                    }
                ]
            },
            server: {
                description: "Launches a HTTP service and web sockets so that the web tool is automatically refreshed once code changes in the local file system.",
                example: [
                    {
                        code: `${version.command} server`,
                        defined: "Launches the server on default port 10002 and web sockets on port 10003."
                    },
                    {
                        code: `${version.command} server 8080`,
                        defined: "If a numeric argument is supplied the web server starts on the port specified and web sockets on the following port."
                    }
                ]
            },
            simulation: {
                description: "Launches a test runner to execute the various commands of the services file.",
                example: [{
                    code: `${version.command} simulation`,
                    defined: "Runs tests against the commands offered by the services file."
                }]
            },
            start: {
                description: "Starts the Shared Spaces application on default port 7777.",
                example: [
                    {
                        code: `${version.command} start`,
                        defined: "Starts the application on the default port."
                    },
                    {
                        code: `${version.command} start 9999`,
                        defined: "Specify a port number to run the application on a different port."
                    }
                ]
            },
            test: {
                description: "Builds the application and then runs all the test commands",
                example: [{
                    code: `${version.command} test`,
                    defined: "Runs all the tests in the test suite."
                }]
            },
            version: {
                description: "Prints the current version number and date of prior modification to the console.",
                example: [{
                    code: `${version.command} version`,
                    defined: "Prints the current version number and date to the shell."
                }]
            }
        },
        command:string = (function node_command():string {
            let comkeys:string[] = Object.keys(commands),
                filtered:string[] = [],
                a:number = 0,
                b:number = 0;
            if (process.argv[2] === undefined) {
                console.log("");
                console.log("Shared spaces requires a command. Try:");
                console.log(`${text.cyan + version.command} help${text.none}`);
                console.log("");
                console.log("To see a list of commands try:");
                console.log(`${text.cyan + version.command} commands${text.none}`);
                console.log("");
                process.exit(1);
                return;
            }
            const arg:string = process.argv[2],
                boldarg:string = text.angry + arg + text.none,
                len:number = arg.length + 1,
                commandFilter = function node_command_commandFilter(item:string):boolean {
                    if (item.indexOf(arg.slice(0, a)) === 0) {
                        return true;
                    }
                    return false;
                };
            
            if (process.argv[2] === "debug") {
                process.argv = process.argv.slice(3);
                return "debug";
            }
            process.argv = process.argv.slice(3);

            // trim empty values
            b = process.argv.length;
            if (b > 0) {
                do {
                    process.argv[a] = process.argv[a].replace(/^-+/, "");
                    if (process.argv[a] === "verbose") {
                        verbose = true;
                        process.argv.splice(a, 1);
                        b = b - 1;
                        a = a - 1;
                    } else if (process.argv[a] === "") {
                        process.argv.splice(a, 1);
                        b = b - 1;
                        a = a - 1;
                    }
                    a = a + 1;
                } while (a < b);
            }

            // filter available commands against incomplete input
            a = 1;
            do {
                filtered = comkeys.filter(commandFilter);
                a = a + 1;
            } while (filtered.length > 1 && a < len);

            if (filtered.length < 1 || (filtered[0] === "debug" && filtered.length < 2)) {
                console.log(`Command ${boldarg} is not a supported command.`);
                console.log("");
                console.log("Please try:");
                console.log(`${text.cyan + version.command} commands${text.none}`);
                console.log("");
                process.exit(1);
                return "";
            }
            if (filtered.length > 1 && comkeys.indexOf(arg) < 0) {
                console.log(`Command '${boldarg}' is ambiguous as it could refer to any of: [${text.cyan + filtered.join(", ") + text.none}]`);
                process.exit(1);
                return "";
            }
            if (arg !== filtered[0]) {
                console.log("");
                console.log(`${boldarg} is not a supported command. ${version.name} is assuming command ${text.bold + text.cyan + filtered[0] + text.none}.`);
                console.log("");
            }
            return filtered[0];
        }()),
        exclusions = (function node_exclusions():string[] {
            const args = process.argv.join(" "),
                match = args.match(/\signore\s*\[/);
            if (match !== null) {
                const list:string[] = [],
                    listBuilder = function node_exclusions_listBuilder():void {
                        do {
                            if (process.argv[a] === "]" || process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                                if (process.argv[a] !== "]") {
                                    list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                                }
                                process.argv.splice(igindex, (a + 1) - igindex);
                                break;
                            }
                            list.push(process.argv[a].replace(/,$/, ""));
                            a = a + 1;
                        } while (a < len);
                    };
                let a:number = 0,
                    len:number = process.argv.length,
                    igindex:number = process.argv.indexOf("ignore");
                if (igindex > -1 && igindex < len - 1 && process.argv[igindex + 1].charAt(0) === "[") {
                    a = igindex + 1;
                    if (process.argv[a] !== "[") {
                        process.argv[a] = process.argv[a].slice(1).replace(/,$/, "");
                    }
                    listBuilder();
                } else {
                    do {
                        if (process.argv[a].indexOf("ignore[") === 0) {
                            igindex = a;
                            break;
                        }
                        a = a + 1;
                    } while (a < len);
                    if (process.argv[a] !== "ignore[") {
                        process.argv[a] = process.argv[a].slice(7);
                        if (process.argv[a].charAt(process.argv[a].length - 1) === "]") {
                            list.push(process.argv[a].replace(/,$/, "").slice(0, process.argv[a].length - 1));
                        } else {
                            listBuilder();
                        }
                    }
                }
                return list;
            }
            return [];
        }()),
        flag:flags = {
            error: false,
            write: ""
        },
        binary_check:RegExp = (
            // eslint-disable-next-line
            /\u0000|\u0001|\u0002|\u0003|\u0004|\u0005|\u0006|\u0007|\u000b|\u000e|\u000f|\u0010|\u0011|\u0012|\u0013|\u0014|\u0015|\u0016|\u0017|\u0018|\u0019|\u001a|\u001c|\u001d|\u001e|\u001f|\u007f|\u0080|\u0081|\u0082|\u0083|\u0084|\u0085|\u0086|\u0087|\u0088|\u0089|\u008a|\u008b|\u008c|\u008d|\u008e|\u008f|\u0090|\u0091|\u0092|\u0093|\u0094|\u0095|\u0096|\u0097|\u0098|\u0099|\u009a|\u009b|\u009c|\u009d|\u009e|\u009f/g
        ),
        apps:applications = {};
    // simple base64 encode/decode
    apps.base64 = function node_apps_base64():void {
        let direction:string = (process.argv[0] === "encode" || process.argv[0] === "decode")
                ? process.argv[0]
                : "encode",
            http:boolean = false,
            path:string = (process.argv[0] === "encode" || process.argv[0] === "decode")
                ? process.argv[1]
                : process.argv[0];
        const screen = function node_apps_base64_screen(string:string) {
                const output = (direction === "decode")
                    ? Buffer.from(string, "base64").toString("utf8")
                    : Buffer.from(string).toString("base64");
                apps.log([output]);
            },
            fileWrapper = function node_apps_base64_fileWrapper(filepath):void {
                node
                .fs
                .stat(filepath, function node_apps_base64_fileWrapper_stat(er:Error, stat:Stats):void {
                    const angrypath:string = `filepath ${text.angry + filepath + text.none} is not a file or directory.`,
                        file = function node_apps_base64_fileWrapper_stat_file():void {
                            node
                            .fs
                            .open(filepath, "r", function node_apps_base64_fileWrapper_stat_file_open(ero:Error, fd:number):void {
                                let buff  = Buffer.alloc(stat.size);
                                if (ero !== null) {
                                    if (http === true) {
                                        apps.remove(filepath);
                                    }
                                    apps.errout([ero.toString()]);
                                    return;
                                }
                                node
                                    .fs
                                    .read(
                                        fd,
                                        buff,
                                        0,
                                        stat.size,
                                        0,
                                        function node_apps_base64_fileWrapper_stat_file_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                                            if (http === true) {
                                                apps.remove(filepath);
                                            }
                                            if (erra !== null) {
                                                apps.errout([erra.toString()]);
                                                return;
                                            }
                                            const output = (direction === "decode")
                                                ? Buffer.from(buffera.toString("utf8"), "base64").toString("utf8")
                                                : buffera.toString("base64");
                                            if (verbose === true) {
                                                const list:string[] = [output];
                                                list.push("");
                                                list.push(`from ${text.angry + filepath + text.none}`);
                                                apps.log(list);
                                            } else {
                                                apps.log([output]);
                                            }
                                        }
                                    );
                            });
                        };
                    if (er !== null) {
                        if (http === true) {
                            apps.remove(filepath);
                        }
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            apps.errout([angrypath]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined) {
                        if (http === true) {
                            apps.remove(filepath);
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isFile() === true) {
                        file();
                    }
                });
            };
        if (path === undefined) {
            apps.errout([`No path to encode.  Please see ${text.cyan + version.command} commands base64${text.none} for examples.`]);
            return;
        }
        if (path.indexOf("string:") === 0) {
            path = path.replace("string:", "");
            if (path.charAt(0) === "\"" && path.charAt(path.length - 1) === "\"") {
                path.slice(1, path.length - 1);
            } else if (path.charAt(0) === "'" && path.charAt(path.length - 1) === "'") {
                path.slice(1, path.length - 1);
            }
            screen(path);
            return;
        }
        if ((/https?:\/\//).test(path) === true) {
            http = true;
            apps.get(path, "source", screen);
        } else {
            fileWrapper(path);
        }
    };
    // build/test system
    apps.build = function node_apps_build(test:boolean):void {
        let firstOrder:boolean = true,
            sectionTime:[number, number] = [0, 0];
        const order = {
                build: [
                    "typescript",
                    "version"
                ],
                test: [
                    "lint",
                    "simulation"
                ]
            },
            type:string = (test === true)
                ? "test"
                : "build",
            orderlen:number = order[type].length,
            // a short title for each build/test phase
            heading = function node_apps_build_heading(message:string):void {
                if (firstOrder === true) {
                    console.log("");
                    firstOrder = false;
                } else if (order[type].length < orderlen) {
                    console.log("________________________________________________________________________");
                    console.log("");
                }
                console.log(text.cyan + message + text.none);
                console.log("");
            },
            // indicates how long each phase took
            sectionTimer = function node_apps_build_sectionTime(input:string):void {
                let now:string[] = input.replace(`${text.cyan}[`, "").replace(`]${text.none} `, "").split(":"),
                    numb:[number, number] = [(Number(now[0]) * 3600) + (Number(now[1]) * 60) + Number(now[2].split(".")[0]), Number(now[2].split(".")[1])],
                    difference:[number, number],
                    times:string[] = [],
                    time:number = 0,
                    str:string = "";
                difference = [numb[0] - sectionTime[0], (numb[1] + 1000000000) - (sectionTime[1] + 1000000000)];
                sectionTime = numb;
                if (difference[1] < 0) {
                    difference[0] = difference[0] - 1;
                    difference[1] = difference[1] + 1000000000;
                }
                if (difference[0] < 3600) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 3600);
                    difference[0] = difference[0] - (time * 3600);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 60) {
                    times.push("00");
                } else {
                    time = Math.floor(difference[0] / 60);
                    difference[0] = difference[0] - (time * 60);
                    if (time < 10) {
                        times.push(`0${time}`);
                    } else {
                        times.push(String(time));
                    }
                }
                if (difference[0] < 1) {
                    times.push("00");
                } else if (difference[0] < 10) {
                    times.push(`0${difference[0]}`);
                } else {
                    times.push(String(difference[0]));
                }
                str = String(difference[1]);
                if (str.length < 9) {
                    do {
                        str = `0${str}`;
                    } while (str.length < 9);
                }
                times[2] = `${times[2]}.${str}`;
                console.log(`${text.cyan + text.bold}[${times.join(":")}]${text.none} ${text.green}Total section time.${text.none}`);
            },
            // the transition to the next phase or completion
            next = function node_apps_build_next(message:string):void {
                let phase = order[type][0],
                    time:string = apps.humantime(false);
                if (message !== "") {
                    console.log(time + message);
                    sectionTimer(time);
                }
                if (order[type].length < 1) {
                    verbose = true;
                    heading(`${text.none}All ${text.green + text.bold + type + text.none} tasks complete... Exiting clean!\u0007`);
                    apps.log([""]);
                    process.exit(0);
                    return;
                }
                order[type].splice(0, 1);
                phases[phase]();
            },
            // These are all the parts of the execution cycle, but their order is dictated by the 'order' object.
            phases = {
                // phase lint is merely a call to apps.lint
                lint     : function node_apps_build_lint():void {
                    const callback = function node_apps_build_lint_callback(message:string):void {
                        next(message);
                    };
                    heading("Linting");
                    apps.lint(callback);
                },
                // phase simulation is merely a call to apps.simulation
                simulation: function node_apps_build_simulation():void {
                    const callback = function node_apps_build_simulation_callback(message:string):void {
                        next(message);
                    };
                    heading(`Simulations of Node.js commands from ${version.command}.js`);
                    apps.simulation(callback);
                },
                // phase typescript compiles the working code into JavaScript
                typescript: function node_apps_build_typescript():void {
                    const flag = {
                            services: false,
                            typescript: false
                        },
                        incremental:string = (process.argv.indexOf("incremental") > -1)
                            ? "--incremental"
                            : "--pretty",
                        command:string = (process.argv.indexOf("local") > -1)
                            ? `node_modules\\.bin\\tsc ${incremental}`
                            : `tsc ${incremental}`,
                        ts = function node_apps_build_typescript_ts() {
                            node.child(command, {
                                cwd: projectPath
                            }, function node_apps_build_typescript_callback(err:Error, stdout:string, stderr:string):void {
                                if (stdout !== "" && stdout.indexOf(` \u001b[91merror${text.none} `) > -1) {
                                    console.log(`${text.red}TypeScript reported warnings.${text.none}`);
                                    apps.errout([stdout]);
                                    return;
                                }
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (stderr !== "") {
                                    apps.errout([stderr]);
                                    return;
                                }
                                next(`${text.green}TypeScript build completed without warnings.${text.none}`);
                            });
                        };
                    heading("TypeScript Compilation");
                    node.fs.stat(`${projectPath}services.ts`, function node_apps_build_typescript_services(err:Error) {
                        if (err !== null) {
                            if (err.toString().indexOf("no such file or directory") > 0) {
                                flag.services = true;
                                if (flag.typescript === true) {
                                    next(`${text.angry}TypeScript code files not present.${text.none}`);
                                }
                            } else {
                                apps.errout([err]);
                                return;
                            }
                        } else {
                            flag.services = true;
                            if (flag.typescript === true) {
                                ts();
                            }
                        }
                    });
                    node.child("tsc --version", function node_apps_build_typescript_tsc(err:Error, stdout:string, stderr:string) {
                        if (err !== null) {
                            const str = err.toString();
                            if (str.indexOf("command not found") > 0 || str.indexOf("is not recognized") > 0) {
                                console.log(`${text.angry}TypeScript does not appear to be installed.${text.none}`);
                                flag.typescript = true;
                                if (flag.services === true) {
                                    next(`${text.angry}Install TypeScript with this command: ${text.green}npm install typescript -g${text.none}`);
                                }
                            } else {
                                apps.errout([err.toString(), stdout]);
                            }
                        } else {
                            if (stderr !== "") {
                                apps.errout([stderr]);
                                return;
                            }
                            flag.typescript = true;
                            if (flag.services === true) {
                                ts();
                            }
                        }
                    });
                },
                // write the current version and change date
                version: function node_apps_build_version():void {
                    const pack:string = `${projectPath}package.json`;
                    heading("Writing version data");
                    node.fs.stat(pack, function node_apps_build_version_stat(ers:Error, stat:Stats) {
                        if (ers !== null) {
                            apps.errout([ers.toString()]);
                            return;
                        }
                        const month:string = (function node_apps_build_version_stat_month():string {
                                let numb:number = stat.mtime.getMonth();
                                if (numb === 0) {
                                    return "JAN";
                                }
                                if (numb === 1) {
                                    return "FEB";
                                }
                                if (numb === 2) {
                                    return "MAR";
                                }
                                if (numb === 3) {
                                    return "APR";
                                }
                                if (numb === 4) {
                                    return "MAY";
                                }
                                if (numb === 5) {
                                    return "JUN";
                                }
                                if (numb === 6) {
                                    return "JUL";
                                }
                                if (numb === 7) {
                                    return "AUG";
                                }
                                if (numb === 8) {
                                    return "SEP";
                                }
                                if (numb === 9) {
                                    return "OCT";
                                }
                                if (numb === 10) {
                                    return "NOV";
                                }
                                if (numb === 11) {
                                    return "DEC";
                                }
                            }()),
                            date = `${stat.mtime.getDate().toString()} ${month} ${stat.mtime.getFullYear().toString()}`;
                        version.date = date.replace(/-/g, "");
                        node.fs.readFile(pack, "utf8", function node_apps_build_version_stat_read(err:Error, data:string) {
                            if (err !== null) {
                                apps.errout([err.toString()]);
                                return;
                            }
                            version.number = JSON.parse(data).version;
                            node.fs.writeFile(`${projectPath}version.js`, `const version={command:"${version.command}",date:"${version.date}",name:"${version.name}",number:"${version.number}"};module.exports=version;`, "utf8", function node_apps_build_version_stat_read_write(erw:Error) {
                                if (erw !== null) {
                                    apps.errout([erw.toString()]);
                                    return;
                                }
                                next("Version data written");
                            });
                        });
                    });
                }
            };
        next("");
    };
    // CLI commands documentation generator
    apps.commands = function node_apps_commands():void {
        const output:string[] = [];
        verbose = true;
        if (commands[process.argv[0]] === undefined) {
            // all commands in a list
            apps.lists({
                emptyline: false,
                heading: "Commands",
                obj: commands,
                property: "description",
                total: true
            });
        } else {
            // specificly mentioned option
            const comm:any = commands[process.argv[0]],
                len:number = comm.example.length,
                plural:string = (len > 1)
                    ? "s"
                    : "";
            let a:number = 0;
            output.push(`${text.bold + text.underline + version.name} - Command: ${text.green + process.argv[0] + text.none}`);
            output.push("");
            output.push(comm.description);
            output.push("");
            output.push(`${text.underline}Example${plural + text.none}`);
            do {
                apps.wrapit(output, comm.example[a].defined);
                output.push(`   ${text.cyan + comm.example[a].code + text.none}`);
                output.push("");
                a = a + 1;
            } while (a < len);
            apps.log(output);
        }
    };
    // converts numbers into a string of comma separated triplets
    apps.commas = function node_apps_commas(number:number):string {
        const str:string = String(number);
        let arr:string[] = [],
            a:number   = str.length;
        if (a < 4) {
            return str;
        }
        arr = String(number).split("");
        a   = arr.length;
        do {
            a      = a - 3;
            arr[a] = "," + arr[a];
        } while (a > 3);
        return arr.join("");
    };
    // bit-by-bit copy stream for the file system
    apps.copy = function node_apps_copy(params:nodeCopyParams):void {
        const numb:any  = {
                dirs : 0,
                files: 0,
                link : 0,
                size : 0
            },
            util:any  = {};
        let start:string = "",
            dest:string  = "",
            dirs:any  = {},
            target:string        = "",
            destination:string   = "",
            exlen:number = 0;
        util.complete = function node_apps_copy_complete(item:string):void {
            delete dirs[item];
            if (Object.keys(dirs).length < 1) {
                params.callback();
            }
        };
        util.eout     = function node_apps_copy_eout(er:Error):void {
            const filename:string[] = target.split(sep);
            apps.remove(
                destination + sep + filename[filename.length - 1],
                function node_apps_copy_eout_remove() {
                    apps.errout([er.toString()]);
                }
            );
        };
        util.dir      = function node_apps_copy_dir(item:string):void {
            node
                .fs
                .readdir(item, function node_apps_copy_dir_readdir(er:Error, files:string[]):void {
                    const place:string = (item === start)
                        ? dest
                        : dest + item.replace(start + sep, "");
                    if (er !== null) {
                        util.eout(er);
                        return;
                    }
                    apps.makedir(place, function node_apps_copy_dir_readdir_makedir():void {
                        const a = files.length;
                        let b = 0;
                        if (a > 0) {
                            delete dirs[item];
                            do {
                                dirs[item + sep + files[b]] = true;
                                b                                     = b + 1;
                            } while (b < a);
                            b = 0;
                            do {
                                util.stat(item + sep + files[b], item);
                                b = b + 1;
                            } while (b < a);
                        } else {
                            util.complete(item);
                        }
                    });
                });
        };
        util.file     = function node_apps_copy_file(item:string, dir:string, prop:nodeFileProps):void {
            const place:string       = (item === dir)
                    ? dest + item
                        .split(sep)
                        .pop()
                    : dest + item.replace(start + sep, ""),
                readStream:Stream  = node
                    .fs
                    .createReadStream(item),
                writeStream:Writable = node
                    .fs
                    .createWriteStream(place, {mode: prop.mode});
            let errorflag:boolean   = false;
            readStream.on("error", function node_apps_copy_file_readError(error:Error):void {
                errorflag = true;
                util.eout(error);
                return;
            });
            writeStream.on("error", function node_apps_copy_file_writeError(error:Error):void {
                errorflag = true;
                util.eout(error);
                return;
            });
            if (errorflag === false) {
                writeStream.on("open", function node_apps_copy_file_write():void {
                    readStream.pipe(writeStream);
                });
                writeStream.once("finish", function node_apps_copy_file_finish():void {
                    const filename:string[] = item.split(sep);
                    node
                        .fs
                        .utimes(
                            dest + sep + filename[filename.length - 1],
                            prop.atime,
                            prop.mtime,
                            function node_apps_copy_file_finish_utimes():void {
                                util.complete(item);
                            }
                        );
                });
            }
        };
        util.link     = function node_apps_copy_link(item:string, dir:string):void {
            node
                .fs
                .readlink(item, function node_apps_copy_link_readlink(err:Error, resolvedlink:string):void {
                    if (err !== null) {
                        util.eout(err);
                        return;
                    }
                    resolvedlink = node.path.resolve(resolvedlink);
                    node
                        .fs
                        .stat(resolvedlink, function node_apps_copy_link_readlink_stat(ers:Error, stats:Stats):void {
                            let type  = "file",
                                place = dest + item;
                            if (ers !== null) {
                                util.eout(ers);
                                return;
                            }
                            if (stats === undefined || stats.isFile === undefined) {
                                util.eout(`Error in performing stat against ${item}`);
                                return;
                            }
                            if (item === dir) {
                                place = dest + item
                                    .split(sep)
                                    .pop();
                            }
                            if (stats.isDirectory() === true) {
                                type = "junction";
                            }
                            node
                                .fs
                                .symlink(
                                    resolvedlink,
                                    place,
                                    type,
                                    function node_apps_copy_link_readlink_stat_makelink(erl:Error):void {
                                        if (erl !== null) {
                                            util.eout(erl);
                                            return;
                                        }
                                        util.complete(item);
                                    }
                                );
                        });
                });
        };
        util.stat     = function node_apps_copy_stat(item:string, dir:string):void {
            let a    = 0;
            if (exlen > 0) {
                do {
                    if (item.replace(start + sep, "") === params.exclusions[a]) {
                        params.exclusions.splice(a, 1);
                        exlen = exlen - 1;
                        util.complete(item);
                        return;
                    }
                    a = a + 1;
                } while (a < exlen);
            }
            node.fs.stat(item, function node_apps_copy_stat_callback(er:Error, stats:Stats):void {
                if (er !== null) {
                    util.eout(er);
                    return;
                }
                if (stats === undefined || stats.isFile === undefined) {
                    util.eout("stats object is undefined");
                    return;
                }
                if (stats.isFile() === true) {
                    numb.files = numb.files + 1;
                    numb.size  = numb.size + stats.size;
                    if (item === dir) {
                        apps.makedir(dest, function node_apps_copy_stat_callback_file():void {
                            util.file(item, dir, {
                                atime: (Date.parse(stats.atime.toString()) / 1000),
                                mode : stats.mode,
                                mtime: (Date.parse(stats.mtime.toString()) / 1000)
                            });
                        });
                    } else {
                        util.file(item, dir, {
                            atime: (Date.parse(stats.atime.toString()) / 1000),
                            mode : stats.mode,
                            mtime: (Date.parse(stats.mtime.toString()) / 1000)
                        });
                    }
                } else if (stats.isDirectory() === true) {
                    numb.dirs = numb.dirs + 1;
                    util.dir(item);
                } else if (stats.isSymbolicLink() === true) {
                    numb.link = numb.link + 1;
                    if (item === dir) {
                        apps.makedir(dest, function node_apps_copy_stat_callback_symb() {
                            util.link(item, dir);
                        });
                    } else {
                        util.link(item, dir);
                    }
                } else {
                    util.complete(item);
                }
            });
        };
        if (command === "copy") {
            if (process.argv[0] === undefined || process.argv[1] === undefined) {
                apps.errout([
                    "The copy command requires a source path and a destination path.",
                    `Please execute ${text.cyan + version.command} commands copy${text.none} for examples.`
                ]);
                return;
            }
            params = {
                callback: function node_apps_copy_callback() {
                    const out:string[] = [`${version.name} copied `];
                    out.push("");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.dirs);
                    out.push(text.none);
                    out.push(" director");
                    if (numb.dirs === 1) {
                        out.push("y, ");
                    } else {
                        out.push("ies, ");
                    }
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.files);
                    out.push(text.none);
                    out.push(" file");
                    if (numb.files !== 1) {
                        out.push("s");
                    }
                    out.push(", and ");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(numb.link);
                    out.push(text.none);
                    out.push(" symbolic link");
                    if (numb.link !== 1) {
                        out.push("s");
                    }
                    out.push(" at ");
                    out.push(text.green);
                    out.push(text.bold);
                    out.push(apps.commas(numb.size));
                    out.push(text.none);
                    out.push(" bytes.");
                    verbose = true;
                    apps.log([out.join(""), `Copied ${text.cyan + target + text.none} to ${text.green + destination + text.none}`]);
                },
                exclusions: exclusions,
                destination: process.argv[1].replace(/(\\|\/)/g, sep),
                target: process.argv[0].replace(/(\\|\/)/g, sep)
            };
        }
        flag.write = target;
        target =  params.target.replace(/(\\|\/)/g, sep);
        destination = params.destination.replace(/(\\|\/)/g, sep);
        exlen = params.exclusions.length;
        dest          = node.path.resolve(destination) + sep;
        start         = node.path.resolve(target);
        util.stat(start, start);
    };
    // similar to node's fs.readdir, but recursive
    apps.directory = function node_apps_directory(args:readDirectory):void {
        // arguments:
        // * callback - function - the output is passed into the callback as an argument
        // * exclusions - string array - a list of items to exclude
        // * path - string - where to start in the local file system
        // * recursive - boolean - if child directories should be scanned
        // * symbolic - boolean - if symbolic links should be identified
        let dirtest:boolean = false,
            size:number = 0,
            dirs:number = 0;
        const dircount:number[] = [],
            dirnames:string[] = [],
            listonly:boolean = (command === "directory" && process.argv.indexOf("listonly") > -1),
            type:boolean = (function node_apps_directory_typeof():boolean {
                const typeindex:number = process.argv.indexOf("typeof");
                if (command === "directory" && typeindex > -1) {
                    process.argv.splice(typeindex, 1);
                    return true;
                }
                return false;
            }()),
            startPath:string = (function node_apps_directory_startPath():string {
                if (command === "directory") {
                    const len:number = process.argv.length;
                    let a:number = 0;
                    args = {
                        callback: function node_apps_directory_startPath_callback(result:string[]|directoryList) {
                            const output:string[] = [];
                            if (verbose === true) {
                                output.push(JSON.stringify(result));
                                output.push("");
                                apps.wrapit(output, `${version.name} found ${text.green + apps.commas(result.length) + text.none} matching items from address ${text.cyan + startPath + text.none} with a total file size of ${text.green + apps.commas(size) + text.none} bytes.`);
                                apps.log(output);
                            } else {
                                apps.log([JSON.stringify(result)]);
                            }
                        },
                        exclusions: exclusions,
                        path: "",
                        recursive: (process.argv.indexOf("shallow") > -1)
                            ? (function node_apps_directory_startPath_recursive():boolean {
                                process.argv.splice(process.argv.indexOf("shallow"), 1);
                                return false;
                            }())
                            : true,
                        symbolic: (process.argv.indexOf("symbolic") > -1)
                            ? (function node_apps_directory_startPath_symbolic():boolean {
                                process.argv.splice(process.argv.indexOf("symbolic"), 1);
                                return true;
                            }())
                            : false
                    };
                    if (process.argv.length < 1) {
                        apps.errout([
                            "No path supplied for the directory command. For an example please see:",
                            `    ${text.cyan + version.name} commands directory${text.none}`
                        ]);
                        return "";
                    }
                    do {
                        if (process.argv[a].indexOf("source:") === 0) {
                            return node.path.resolve(process.argv[a].replace(/source:("|')?/, "").replace(/("|')$/, ""));
                        }
                        a = a + 1;
                    } while (a < len);
                    return node.path.resolve(process.argv[0]);
                }
                return node.path.resolve(args.path);
            }()),
            list:directoryList = [],
            filelist:string[] = [],
            method:string = (args.symbolic === true)
                ? "lstat"
                : "stat",
            dirCounter = function node_apps_directory_dirCounter(item:string):void {
                let dirlist:string[] = item.split(sep),
                    dirpath:string = "",
                    index:number = 0;
                dirlist.pop();
                dirpath = dirlist.join(sep);
                index = dirnames.indexOf(dirpath);
                dircount[index] = dircount[index] - 1;
                if (dircount[index] < 1) {
                    // dircount and dirnames are parallel arrays
                    dircount.splice(index, 1);
                    dirnames.splice(index, 1);
                    dirs = dirs - 1;
                    if (dirs < 1) {
                        if (listonly === true) {
                            args.callback(filelist.sort());
                        } else {
                            args.callback(list);
                        }
                    } else {
                        node_apps_directory_dirCounter(dirpath);
                    }
                }
            },
            statWrapper = function node_apps_directory_wrapper(filepath:string, parent:number):void {
                node.fs[method](filepath, function node_apps_directory_wrapper_stat(er:Error, stat:Stats):void {
                    const angrypath:string = `Filepath ${text.angry + filepath + text.none} is not a file or directory.`,
                        dir = function node_apps_directory_wrapper_stat_dir(item:string):void {
                            node.fs.readdir(item, {encoding: "utf8"}, function node_apps_directory_wrapper_stat_dir_readdirs(erd:Error, files:string[]):void {
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                const index:number = list.length;
                                if (listonly === true) {
                                    filelist.push(item);
                                } else {
                                    list.push([item, "directory", parent, files.length, stat]);
                                }
                                if (files.length < 1) {
                                    dirCounter(item);
                                } else {
                                    // dircount and dirnames are parallel arrays
                                    dircount.push(files.length);
                                    dirnames.push(item);
                                    dirs = dirs + 1;
                                }
                                files.forEach(function node_apps_directory_wrapper_stat_dir_readdirs_each(value:string):void {
                                    node_apps_directory_wrapper(item + sep + value, index);
                                });
                            });
                        },
                        populate = function node_apps_directory_wrapper_stat_populate(type:"link"|"file"|"directory"):void {
                            if (exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                                if (listonly === true) {
                                    filelist.push(filepath);
                                } else {
                                    list.push([filepath, type, parent, 0, stat]);
                                }
                            }
                            if (dirs > 0) {
                                dirCounter(filepath);
                            } else {
                                if (listonly === true) {
                                    args.callback(filelist.sort());
                                } else {
                                    args.callback(list);
                                }
                            }
                        };
                    if (er !== null) {
                        if (er.toString().indexOf("no such file or directory") > 0) {
                            if (flag.error === true) {
                                args.callback([]);
                                return;
                            }
                            if (type === true) {
                                apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`]);
                                return;
                            }
                            apps.errout([angrypath]);
                            return;
                        }
                        apps.errout([er.toString()]);
                        return;
                    }
                    if (stat === undefined) {
                        if (type === true) {
                            apps.log([`Requested artifact, ${text.cyan + startPath + text.none}, ${text.angry}is missing${text.none}.`]);
                            return;
                        }
                        apps.errout([angrypath]);
                        return;
                    }
                    if (stat.isDirectory() === true) {
                        if (type === true) {
                            apps.log(["directory"]);
                            return;
                        }
                        if ((args.recursive === true || dirtest === false) && exclusions.indexOf(filepath.replace(startPath + sep, "")) < 0) {
                            dirtest = true;
                            dir(filepath);
                        } else {
                            populate("directory");
                        }
                    } else if (stat.isSymbolicLink() === true) {
                        if (type === true) {
                            apps.log(["symbolicLink"]);
                            return;
                        }
                        populate("link");
                    } else if (stat.isFile() === true || stat.isBlockDevice() === true || stat.isCharacterDevice() === true) {
                        if (type === true) {
                            if (stat.isBlockDevice() === true) {
                                apps.log(["blockDevice"]);
                            } else if (stat.isCharacterDevice() === true) {
                                apps.log(["characterDevice"]);
                            } else {
                                apps.log(["file"]);
                            }
                            return;
                        }
                        size = size + stat.size;
                        populate("file");
                    } else {
                        if (type === true) {
                            if (stat.isFIFO() === true) {
                                apps.log(["FIFO"]);
                            } else if (stat.isSocket() === true) {
                                apps.log(["socket"]);
                            } else {
                                apps.log(["unknown"]);
                            }
                            return;
                        }
                        list[parent][3] = list[parent][3] - 1;
                    }
                });
            };
        statWrapper(startPath, 0);
    };
    // uniform error formatting
    apps.errout = function node_apps_errout(errtext:string[]):void {
        const bell = function node_apps_errout_bell():void {
                apps.humantime(true);
                if (command === "build" || command === "simulation" || command === "validation") {
                    console.log("\u0007"); // bell sound
                } else {
                    console.log("");
                }
                if (command !== "debug") {
                    process.exit(1);
                }
            },
            error = function node_apps_errout_error():void {
                const stack:string = new Error().stack.replace("Error", `${text.cyan}Stack trace${text.none + node.os.EOL}-----------`);
                console.log("");
                console.log(stack);
                console.log("");
                console.log(`${text.angry}Error Message${text.none}`);
                console.log("------------");
                if (errtext[0] === "" && errtext.length < 2) {
                    console.log(`${text.yellow}No error message supplied${text.none}`);
                } else {
                    errtext.forEach(function node_apps_errout_each(value:string):void {
                        console.log(value);
                    });
                }
                console.log("");
                bell();
            },
            debug = function node_apps_errout_debug():void {
                const stack:string = new Error().stack,
                    totalmem:number = node.os.totalmem(),
                    freemem:number = node.os.freemem();
                console.log("");
                console.log("---");
                console.log("");
                console.log("");
                console.log(`# ${version.name} - Debug Report`);
                console.log("");
                console.log(`${text.green}## Error Message${text.none}`);
                if (errtext[0] === "" && errtext.length < 2) {
                    console.log(`${text.yellow}No error message supplied${text.none}`);
                } else {
                    console.log("```");
                    errtext.forEach(function node_apps_errout_each(value:string):void {
                        // eslint-disable-next-line
                        console.log(value.replace(/\u001b/g, "\\u001b"));
                    });
                    console.log("```");
                }
                console.log("");
                console.log(`${text.green}## Stack Trace${text.none}`);
                console.log("```");
                console.log(stack.replace(/\s*Error\s+/, "    "));
                console.log("```");
                console.log("");
                console.log(`${text.green}## Environment${text.none}`);
                console.log(`* OS - **${node.os.platform()} ${node.os.release()}**`);
                console.log(`* Mem - ${apps.commas(totalmem)} - ${apps.commas(freemem)} = **${apps.commas(totalmem - freemem)}**`);
                console.log(`* CPU - ${node.os.arch()} ${node.os.cpus().length} cores`);
                console.log("");
                console.log(`${text.green}## Command Line Instruction${text.none}`);
                console.log("```");
                console.log(cli);
                console.log("```");
                console.log("");
                console.log(`${text.green}## Time${text.none}`);
                console.log("```");
                console.log(apps.humantime(false));
                console.log("```");
                console.log("");
                bell();
            };
        flag.error = true;
        if (process.argv.indexOf("spaces_debug") > -1) {
            debug();
        } else {
            error();
        }
    };
    // http(s) get function
    apps.get = function node_apps_get(address:string, callback:Function|null):void {
        if (command === "get") {
            address = process.argv[0];
        }
        if (address === undefined) {
            apps.errout([
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan + version.command} commands get${text.none} for examples.`
            ]);
            return;
        }
        let file:string = "";
        const scheme:string = (address.indexOf("https") === 0)
                ? "https"
                : "http";
        if ((/^(https?:\/\/)/).test(address) === false) {
            apps.errout([
                `Address: ${text.angry + address + text.none}`,
                "The get command requires an address in http/https scheme.",
                `Please execute ${text.cyan + version.command} commands get${text.none} for examples.`
            ]);
            return;
        }
        node[scheme].get(address, function node_apps_get_callback(res:http.IncomingMessage) {
            res.on("data", function node_apps_get_callback_data(chunk:string):void {
                file = file + chunk;
            });
            res.on("end", function node_apps_get_callback_end() {
                if (res.statusCode !== 200) {
                    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) {
                        if (verbose === true) {
                            console.log(`${res.statusCode} ${node.http.STATUS_CODES[res.statusCode]} - ${address}`);
                        }
                        process.argv[0] = res.headers.location;
                        address = process.argv[0];
                        apps.get(address, callback);
                        return;
                    }
                    apps.errout([`${scheme}.get failed with status code ${res.statusCode}`]);
                    return;
                }
                if (command === "get") {
                    apps.log([file.toString()]);
                } else if (callback !== null) {
                    callback(file);
                }
            });
        });
    };
    // hash utility for strings or files
    apps.hash = function node_apps_hash(filepath:string):void {
        let limit:number = 0,
            shortlimit:number = 0,
            hashlist:boolean = false;
        const http:RegExp = (/^https?:\/\//),
            dirComplete = function node_apps_hash_dirComplete(list:directoryList):void {
                let a:number = 0,
                    c:number = 0;
                const listlen:number = list.length,
                    listObject:any = {},
                    hashes:string[] = [],
                    hashComplete = function node_apps_hash_dirComplete_hashComplete():void {
                        const hash:Hash = node.crypto.createHash("sha512");
                        let hashstring:string = "";
                        if (verbose === true) {
                            console.log(`${apps.humantime(false)}File hashing complete. Working on a final hash to represent the directory structure.`);
                        }
                        hash.update(hashes.join(""));
                        hashstring = (hashlist === true)
                            ? JSON.stringify(listObject)
                            : hash.digest("hex").replace(/\s+$/, "");
                        if (verbose === true) {
                            apps.log([`${version.name} hashed ${text.cyan + filepath + text.none}`, hashstring]);
                        } else {
                            apps.log([hashstring]);
                        }
                    },
                    hashback = function node_apps_hash_dirComplete_hashback(data:readFile, item:string|Buffer, callback:Function):void {
                        const hash:Hash = node.crypto.createHash("sha512");
                        hash.on("readable", function node_apps_hash_dirComplete_hashback_hash():void {
                            let hashstring:string = "";
                            const hashdata:Buffer = <Buffer>hash.read();
                            if (hashdata !== null) {
                                hashstring = hashdata.toString("hex").replace(/\s+/g, "");
                                callback(hashstring, data.index);
                            }
                        });
                        hash.write(item);
                        hash.end();
                        if (http.test(filepath) === true) {
                            apps.remove(data.path, function node_apps_hash_dirComplete_hashback_hash_remove():boolean {
                                return true;
                            });
                        }
                    },
                    typeHash = function node_apps_hash_dirComplete_typeHash(index:number, end:number) {
                        const terminate = function node_apps_hash_dirComplete_typeHash_terminate():void {
                            c = c + 1;
                            if (c === end) {
                                if (a === listlen) {
                                    hashComplete();
                                } else {
                                    if (verbose === true) {
                                        console.log(`${apps.humantime(false)}${text.green + apps.commas(a) + text.none} files hashed so far...`);
                                    }
                                    c = 0;
                                    recurse();
                                }
                            }
                        };
                        if (list[index][1] === "directory" || list[index][1] === "link") {
                            const hash:Hash = node.crypto.createHash("sha512");
                            hash.update(list[index][0]);
                            if (hashlist === true) {
                                listObject[list[index][0]] = hash.digest("hex");
                            } else {
                                hashes[index] = hash.digest("hex");
                            }
                            terminate();
                        } else {
                            apps.readFile({
                                path: list[index][0],
                                stat: list[index][4],
                                index: index,
                                callback: function node_apps_hash_dirComplete_typehash_callback(data:readFile, item:string|Buffer):void {
                                    hashback(data, item, function node_apps_hash_dirComplete_typeHash_callback_hashback(hashstring:string, item:number) {
                                        hashes[item[0]] = hashstring;
                                        if (hashlist === true) {
                                            listObject[data.path] = hashstring;
                                        } else {
                                            hashes[item[0]] = hashstring;
                                        }
                                        terminate();
                                    });
                                }
                            });
                        }
                    },
                    recurse = function node_apps_hash_dirComplete_recurse():void {
                        let b = 0,
                            end = (listlen - a < shortlimit)
                                ? listlen - a
                                : shortlimit;
                        do {
                            typeHash(a, end);
                            a = a + 1;
                            b = b + 1;
                        } while (b < shortlimit && a < listlen);
                    },
                    sorty = function node_apps_hash_dirComplete_sorty(a:directoryItem, b:directoryItem) {
                        if (a[0] < b[0]) {
                            return -1;
                        }
                        return 1;
                    };
                list.sort(sorty);
                if (verbose === true) {
                    console.log(`${apps.humantime(false)}Completed analyzing the directory tree in the file system and found ${text.green + apps.commas(listlen) + text.none} file system objects.`);
                }
                if (limit < 1 || listlen < limit) {
                    do {
                        if (list[a][1] === "directory" || list[a][1] === "link") {
                            const hash:Hash = node.crypto.createHash("sha512");
                            hash.update(list[a][0]);
                            if (hashlist === true) {
                                listObject[list[a][0]] = hash.digest("hex");
                            } else {
                                hashes[a] = hash.digest("hex");
                            }
                            c = c + 1;
                            if (c === listlen) {
                                hashComplete();
                            }
                        } else {
                            apps.readFile({
                                path: list[a][0],
                                stat: list[a][4],
                                index: a,
                                callback: function node_apps_hash_dirComplete_file(data:readFile, item:string|Buffer):void {
                                    hashback(data, item, function node_apps_hash_dirComplete_file_hashback(hashstring:string, item:number):void {
                                        if (hashlist === true) {
                                            listObject[data.path] = hashstring;
                                        } else {
                                            hashes[item[0]] = hashstring;
                                        }
                                        c = c + 1;
                                        if (c === listlen) {
                                            hashComplete();
                                        }
                                    });
                                }
                            });
                        }
                        a = a + 1;
                    } while (a < listlen);
                } else {
                    if (verbose === true) {
                        console.log(`Due to a ulimit setting of ${text.angry + apps.commas(limit) + text.none} ${version.name} will read only ${text.cyan + apps.commas(shortlimit) + text.none} files at a time.`);
                        console.log("");
                    }
                    recurse();
                }
            };
        if (command === "hash") {
            const listIndex:number = process.argv.indexOf("list");
            if (process.argv[0] === undefined) {
                apps.errout([`Command ${text.cyan}hash${text.none} requires some form of address of something to analyze, ${text.angry}but no address is provided${text.none}.`]);
                return;
            }
            if (process.argv.indexOf("string") > -1) {
                const hash:Hash = node.crypto.createHash("sha512");
                process.argv.splice(process.argv.indexOf("string"), 1);
                hash.update(process.argv[0]);
                apps.log([hash.digest("hex")]);
                return;
            }
            if (listIndex > -1 && process.argv.length > 1) {
                hashlist = true;
                process.argv.splice(listIndex, 1);
            }
            filepath = process.argv[0];
            if (http.test(filepath) === false) {
                filepath = node.path.resolve(process.argv[0]);
            }
        }
        if (http.test(filepath) === true) {
            apps.get(filepath, "source", function node_apps_hash_get(filedata:string) {
                const hash:Hash = node.crypto.createHash("sha512");
                hash.update(filedata);
                apps.log([hash.digest("hex")]);
            });
        } else {
            node.child("ulimit -n", function node_apps_hash_ulimit(uerr:Error, uout:string) {
                if (uerr === null && uout !== "unlimited" && isNaN(Number(uout)) === false) {
                    limit = Number(uout);
                    shortlimit = Math.ceil(limit / 5);
                }
                apps.directory({
                    callback: function node_apps_hash_localCallback(list:directoryList) {
                        dirComplete(list);
                    },
                    exclusions: exclusions,
                    path: filepath,
                    recursive: true,
                    symbolic: true
                });
            });
        }
    };
    // help text
    apps.help = function node_apps_help():void {
        verbose = true;
        apps.log([
            "",
            `Welcome to ${version.name}.`,
            "",
            "To see all the supported features try:",
            `${text.cyan + version.command} commands${text.none}`,
            "",
            "To see more detailed documentation for specific command supply the command name:",
            `${text.cyan + version.command} commands build${text.none}`,
            "",
            "* Read the documentation             - cat readme.md",
        ]);
    };
    // converting time durations into something people read
    apps.humantime = function node_apps_humantime(finished:boolean):string {
        let minuteString:string = "",
            hourString:string   = "",
            secondString:string = "",
            finalTime:string    = "",
            finalMem:string     = "",
            minutes:number      = 0,
            hours:number        = 0,
            memory,
            elapsed:number      = (function node_apps_humantime_elapsed():number {
                const big:number = 1e9,
                    dtime:[number, number] = process.hrtime(startTime);
                if (dtime[1] === 0) {
                    return dtime[0];
                }
                return dtime[0] + (dtime[1] / big);
            }());
        const numberString = function node_apps_humantime_numberString(numb:number):string {
                const strSplit:string[] = String(numb).split(".");
                if (strSplit.length > 1) {
                    if (strSplit[1].length < 9) {
                        do {
                            strSplit[1]  = strSplit[1] + 0;
                        } while (strSplit[1].length < 9);
                        return `${strSplit[0]}.${strSplit[1]}`;
                    }
                    if (strSplit[1].length > 9) {
                        return `${strSplit[0]}.${strSplit[1].slice(0, 9)}`;
                    }
                    return `${strSplit[0]}.${strSplit[1]}`;
                }
                return `${strSplit[0]}`;
            },
            prettybytes  = function node_apps_humantime_prettybytes(an_integer:number):string {
                //find the string length of input and divide into triplets
                let output:string = "",
                    length:number  = an_integer
                        .toString()
                        .length;
                const triples:number = (function node_apps_humantime_prettybytes_triples():number {
                        if (length < 22) {
                            return Math.floor((length - 1) / 3);
                        }
                        //it seems the maximum supported length of integer is 22
                        return 8;
                    }()),
                    //each triplet is worth an exponent of 1024 (2 ^ 10)
                    power:number   = (function node_apps_humantime_prettybytes_power():number {
                        let a = triples - 1,
                            b = 1024;
                        if (triples === 0) {
                            return 0;
                        }
                        if (triples === 1) {
                            return 1024;
                        }
                        do {
                            b = b * 1024;
                            a = a - 1;
                        } while (a > 0);
                        return b;
                    }()),
                    //kilobytes, megabytes, and so forth...
                    unit    = [
                        "",
                        "KB",
                        "MB",
                        "GB",
                        "TB",
                        "PB",
                        "EB",
                        "ZB",
                        "YB"
                    ];

                if (typeof an_integer !== "number" || Number.isNaN(an_integer) === true || an_integer < 0 || an_integer % 1 > 0) {
                    //input not a positive integer
                    output = "0.00B";
                } else if (triples === 0) {
                    //input less than 1000
                    output = `${an_integer}B`;
                } else {
                    //for input greater than 999
                    length = Math.floor((an_integer / power) * 100) / 100;
                    output = length.toFixed(2) + unit[triples];
                }
                return output;
            },
            plural       = function node_proctime_plural(x:number, y:string):string {
                if (x !== 1) {
                    return `${numberString(x) + y}s `;
                }
                return `${numberString(x) + y} `;
            },
            minute       = function node_proctime_minute():void {
                minutes      = parseInt((elapsed / 60).toString(), 10);
                minuteString = (finished === true)
                    ? plural(minutes, " minute")
                    : (minutes < 10)
                        ? `0${minutes}`
                        : String(minutes);
                minutes      = elapsed - (minutes * 60);
                secondString = (finished === true)
                    ? (minutes === 1)
                        ? " 1 second "
                        : `${numberString(minutes)} seconds `
                    : numberString(minutes);
            };
        memory       = process.memoryUsage();
        finalMem     = prettybytes(memory.rss);

        //last line for additional instructions without bias to the timer
        secondString = numberString(elapsed);
        if (elapsed >= 60 && elapsed < 3600) {
            minute();
        } else if (elapsed >= 3600) {
            hours      = parseInt((elapsed / 3600).toString(), 10);
            elapsed    = elapsed - (hours * 3600);
            hourString = (finished === true)
                ? plural(hours, " hour")
                : (hours < 10)
                    ? `0${hours}`
                    : String(hours);
            minute();
        } else {
            secondString = (finished === true)
                ? plural(elapsed, " second")
                : secondString;
        }
        if (finished === true) {
            finalTime = hourString + minuteString + secondString;
            console.log("");
            console.log(`${finalMem} of memory consumed`);
            console.log(`${finalTime}total time`);
            console.log("");
        } else {
            if (hourString === "") {
                hourString = "00";
            }
            if (minuteString === "") {
                minuteString = "00";
            }
            // pad single digit seconds with a 0
            if ((/^([0-9]\.)/).test(secondString) === true) {
                secondString = `0${secondString}`;
            }
        }
        return `${text.cyan}[${hourString}:${minuteString}:${secondString}]${text.none} `;
    };
    // wrapper for ESLint usage
    apps.lint = function node_apps_lint(callback:Function):void {
        node.child("eslint", function node_apps_lint_eslintCheck(eserr:Error) {
            const lintpath:string = (command === "lint" && process.argv[0] !== undefined)
                ? node.path.resolve(process.argv[0])
                : js;
            if (eserr !== null) {
                console.log("ESLint is not globally installed or is corrupt.");
                console.log(`Install ESLint using the command: ${text.green}npm install eslint -g${text.none}`);
                console.log("");
                if (callback !== undefined) {
                    callback("Skipping code validation...");
                } else {
                    console.log("Skipping code validation...");
                }
                return;
            }
            if (command === "lint") {
                verbose = true;
                callback = function node_apps_lint_callback():void {
                    apps.log([`Lint complete for ${lintpath}`]);
                };
            }
            (function node_apps_lint_getFiles():void {
                const lintrun         = function node_apps_lint_lintrun(list:directoryList) {
                    let filesRead:number = 0,
                        filesLinted:number = 0,
                        a:number = 0,
                        first:boolean = false;
                    const len = list.length,
                        lintit = function node_apps_lint_lintrun_lintit(val:string):void {
                            console.log(`${apps.humantime(false)}Starting lint: ${val}`);
                            filesRead = filesRead + 1;
                            node.child(`eslint ${val}`, {
                                cwd: projectPath
                            }, function node_apps_lint_lintrun_lintit_eslint(err:Error, stdout:string, stderr:string) {
                                if (stdout === "" || stdout.indexOf("0:0  warning  File ignored because of a matching ignore pattern.") > -1) {
                                    if (err !== null) {
                                        apps.errout([err.toString()]);
                                        return;
                                    }
                                    if (stderr !== null && stderr !== "") {
                                        apps.errout([stderr]);
                                        return;
                                    }
                                    filesLinted = filesLinted + 1;
                                    if (first === false) {
                                        first = true;
                                        console.log("");
                                    }
                                    console.log(`${apps.humantime(false) + text.green}Lint ${filesLinted} passed:${text.none} ${val}`);
                                    if (filesRead === filesLinted) {
                                        console.log("");
                                        if (callback === undefined) {
                                            console.log(`${text.green}Lint complete for ${text.cyan + text.bold + filesLinted + text.none + text.green} files!${text.none}`);
                                        } else {
                                            callback(`${text.green}Lint complete for ${text.cyan + text.bold + filesLinted + text.none + text.green} files!${text.none}`);
                                        }
                                        return;
                                    }
                                } else {
                                    console.log(stdout);
                                    apps.errout(["Lint failure."]);
                                    return;
                                }
                            })
                        };
                    console.log(`${apps.humantime(false)}Linting files...`);
                    console.log("");
                    do {
                        if (list[a][1] === "file" && (/\.js$/).test(list[a][0]) === true) {
                            lintit(list[a][0]);
                        }
                        a = a + 1;
                    } while (a < len);
                };
                console.log(`${apps.humantime(false)}Gathering JavaScript files from directory: ${text.green + lintpath + text.none}`);
                apps.directory({
                    callback: lintrun,
                    exclusions: (command === "lint" && process.argv[0] !== undefined)
                        ? exclusions
                        : [],
                    path      : lintpath,
                    recursive: true,
                    symbolic: false
                });
            }());
        });
    };
    // CLI string output formatting for lists of items
    apps.lists = function node_apps_lists(lists:nodeLists):void {
        // * lists.emptyline - boolean - if each key should be separated by an empty line
        // * lists.heading   - string  - a text heading to precede the list
        // * lists.obj       - object  - an object to traverse
        // * lists.property  - string  - The child property to read from or "eachkey" to
        // * lists.total     - number  - To display a count
        // access a directly assigned primitive
        const keys:string[] = Object.keys(lists.obj).sort(),
            output:string[] = [],
            lenn:number = keys.length,
            plural = (lenn === 1)
                ? ""
                : "s",
            displayKeys = function node_apps_lists_displayKeys(item:string, keylist:string[]):void {
                const len:number = keylist.length;
                let a:number = 0,
                    b:number = 0,
                    c:number = 0,
                    lens:number = 0,
                    comm:string = "";
                if (len < 1) {
                    apps.errout([`Please run the build: ${text.cyan + version.command} build${text.none}`]);
                    return;
                }
                do {
                    if (keylist[a].length > lens) {
                        lens = keylist[a].length;
                    }
                    a = a + 1;
                } while (a < len);
                do {
                    comm = keylist[b];
                    c    = comm.length;
                    if (c < lens) {
                        do {
                            comm = comm + " ";
                            c    = c + 1;
                        } while (c < lens);
                    }
                    if (item !== "") {
                        // each of the "values" keys
                        apps.wrapit(output, `   ${text.angry}- ${text.none + text.cyan + comm + text.none}: ${lists.obj.values[keylist[b]]}`);
                    } else {
                        // list all items
                        if (lists.property === "eachkey") {
                            if (command === "options" && keylist[b] === "values") {
                                // "values" keyname of options
                                output.push(`${text.angry}* ${text.none + text.cyan + comm + text.none}:`);
                                node_apps_lists_displayKeys(command, Object.keys(lists.obj.values).sort());
                            } else {
                                // all items keys and their primitive value
                                apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]]}`);
                            }
                        } else {
                            // a list by key and specified property
                            apps.wrapit(output, `${text.angry}* ${text.none + text.cyan + comm + text.none}: ${lists.obj[keylist[b]][lists.property]}`);
                        }
                        if (lists.emptyline === true) {
                            output.push("");
                        }
                    }
                    b = b + 1;
                } while (b < len);
            };
        output.push("");
        output.push(`${text.underline + text.bold + version.name} - ${lists.heading + text.none}`);
        output.push("");
        displayKeys("", keys);
        if (command === "commands") {
            output.push("");
            output.push("For examples and usage instructions specify a command name, for example:");
            output.push(`${text.green + version.command} commands hash${text.none}`);
            output.push("");
            output.push(`Commands are tested using the ${text.green}simulation${text.none} command.`);
        } else if (command === "options" && lists.total === true) {
            output.push(`${text.green + lenn + text.none} matching option${plural}.`);
        }
        apps.log(output);
    };
    // verbose metadata printed to the shell about the application
    apps.log = function node_apps_log(output:string[]):void {
        if (verbose === true && (output.length > 1 || output[0] !== "")) {
            console.log("");
        }
        if (output[output.length - 1] === "") {
            output.pop();
        }
        output.forEach(function node_apps_log_each(value:string) {
            console.log(value);
        });
        if (verbose === true) {
            console.log("");
            console.log(`${version.name} version ${text.angry + version.number + text.none}`);
            console.log(`Dated ${text.cyan + version.date + text.none}`);
            apps.humantime(true);
        }
    };
    // makes specified directory structures in the local file system
    apps.makedir = function node_apps_makedir(dirToMake:string, callback:Function):void {
        node
            .fs
            .stat(dirToMake, function node_apps_makedir_stat(err:nodeError, stats:Stats):void {
                let dirs   = [],
                    ind    = 0,
                    len    = 0,
                    ers    = "";
                const restat = function node_apps_makedir_stat_restat():void {
                        node
                            .fs
                            .stat(
                                dirs.slice(0, ind + 1).join(sep),
                                function node_apps_makedir_stat_restat_callback(erra:nodeError, stata:Stats):void {
                                    let erras:string = "";
                                    ind = ind + 1;
                                    if (erra !== null) {
                                        erras = erra.toString();
                                        if (erras.indexOf("no such file or directory") > 0 || erra.code === "ENOENT") {
                                            node
                                                .fs
                                                .mkdir(
                                                    dirs.slice(0, ind).join(sep),
                                                    function node_apps_makedir_stat_restat_callback_mkdir(errb:Error):void {
                                                        if (errb !== null && errb.toString().indexOf("file already exists") < 0) {
                                                            apps.errout([errb.toString()]);
                                                            return;
                                                        }
                                                        if (ind < len) {
                                                            node_apps_makedir_stat_restat();
                                                        } else {
                                                            callback();
                                                        }
                                                    }
                                                );
                                            return;
                                        }
                                        if (erras.indexOf("file already exists") < 0) {
                                            apps.errout([erra.toString()]);
                                            return;
                                        }
                                    }
                                    if (stata.isFile() === true) {
                                        apps.errout([`Destination directory, '${text.cyan + dirToMake + text.none}', is a file.`]);
                                        return;
                                    }
                                    if (ind < len) {
                                        node_apps_makedir_stat_restat();
                                    } else {
                                        callback();
                                    }
                                }
                            );
                    };
                if (err !== null) {
                    ers = err.toString();
                    if (ers.indexOf("no such file or directory") > 0 || err.code === "ENOENT") {
                        dirs = dirToMake.split(sep);
                        if (dirs[0] === "") {
                            ind = ind + 1;
                        }
                        len = dirs.length;
                        restat();
                        return;
                    }
                    if (ers.indexOf("file already exists") < 0) {
                        apps.errout([err.toString()]);
                        return;
                    }
                }
                if (stats.isFile() === true) {
                    apps.errout([`Destination directory, '${text.cyan + dirToMake + text.none}', is a file.`]);
                    return;
                }
                callback();
            });
    };
    // similar to node's fs.readFile, but determines if the file is binary or text so that it can create either a buffer or text dump
    apps.readFile = function node_apps_readFile(args:readFile):void {
        // arguments
        // * callback - function - What to do next, the file data is passed into the callback as an argument
        // * index - number - if the file is opened as a part of a directory operation then the index represents the index out of the entire directory list
        // * path - string - the file to open
        // * stat - Stats - the Stats object for the given file
        node
            .fs
            .open(args.path, "r", function node_apps_readFile_file_open(ero:Error, fd:number):void {
                const failure = function node_apps_readFile_file_open_failure(message:string) {
                        if (args.index > 0) {
                            apps.errout([
                                `Failed after ${args.index} files.`,
                                message
                            ]);
                        } else {
                            apps.errout([message]);
                        }
                    },
                    msize = (args.stat.size < 100)
                        ? args.stat.size
                        : 100;
                let buff  = Buffer.alloc(msize);
                if (ero !== null) {
                    failure(ero.toString());
                    return;
                }
                node
                    .fs
                    .read(
                        fd,
                        buff,
                        0,
                        msize,
                        1,
                        function node_apps_readFile_file_open_read(erra:Error, bytesa:number, buffera:Buffer):number {
                            let bstring:string = "";
                            if (erra !== null) {
                                failure(erra.toString());
                                return;
                            }
                            bstring = buffera.toString("utf8", 0, buffera.length);
                            bstring = bstring.slice(2, bstring.length - 2);
                            if (binary_check.test(bstring) === true) {
                                buff = Buffer.alloc(args.stat.size);
                                node
                                    .fs
                                    .read(
                                        fd,
                                        buff,
                                        0,
                                        args.stat.size,
                                        0,
                                        function node_apps_readFile_file_open_read_readBinary(errb:Error, bytesb:number, bufferb:Buffer):void {
                                            if (errb !== null) {
                                                failure(errb.toString());
                                                return;
                                            }
                                            if (bytesb > 0) {
                                                node.fs.close(fd, function node_apps_readFile_file_open_read_readBinary_close():void {
                                                    args.callback(args, bufferb);
                                                });
                                            }
                                        }
                                    );
                            } else {
                                node
                                    .fs
                                    .readFile(args.path, {
                                        encoding: "utf8"
                                    }, function node_apps_readFile_file_open_read_readFile(errc:Error, dump:string):void {
                                        if (errc !== null && errc !== undefined) {
                                            failure(errc.toString());
                                            return;
                                        }
                                        node.fs.close(fd, function node_apps_readFile_file_open_read_readFile_close() {
                                            args.callback(args, dump);
                                        });
                                    });
                            }
                            return bytesa;
                        }
                    );
            });
    };
    // similar to posix "rm -rf" command
    apps.remove = function node_apps_remove(filepath:string, callback:Function):void {
        const numb:any = {
                dirs: 0,
                file: 0,
                link: 0,
                size: 0
            },
            removeItems = function node_apps_remove_removeItems(filelist:directoryList):void {
                let a:number = 0;
                const len:number = filelist.length,
                    destroy = function node_apps_remove_removeItems_destroy(item:directoryItem) {
                        const type:"rmdir"|"unlink" = (item[1] === "directory")
                            ? "rmdir"
                            : "unlink";
                        node.fs[type](item[0], function node_apps_remove_removeItems_destroy_callback(er:nodeError):void {
                            if (verbose === true && er !== null && er.toString().indexOf("no such file or directory") < 0) {
                                if (er.code === "ENOTEMPTY") {
                                    node_apps_remove_removeItems_destroy(item);
                                    return;
                                }
                                apps.errout([er.toString()]);
                                return;
                            }
                            if (item[0] === filelist[0][0]) {
                                callback();
                            } else {
                                filelist[item[2]][3] = filelist[item[2]][3] - 1;
                                if (filelist[item[2]][3] < 1) {
                                    node_apps_remove_removeItems_destroy(filelist[item[2]]);
                                }
                            }
                        });
                    };
                if (filelist.length < 1) {
                    callback();
                    return;
                }
                do {
                    if (command === "remove") {
                        if (filelist[a][1] === "file") {
                            numb.file = numb.file + 1;
                            numb.size = numb.size + filelist[a][4].size;
                        } else if (filelist[a][1] === "directory") {
                            numb.dirs = numb.dirs + 1;
                        } else if (filelist[a][1] === "link") {
                            numb.link = numb.link + 1;
                        }
                    }
                    if ((filelist[a][1] === "directory" && filelist[a][3] === 0) || filelist[a][1] !== "directory") {
                        destroy(filelist[a]);
                    }
                    a = a + 1;
                } while (a < len);
            };
        if (command === "remove") {
            if (process.argv.length < 1) {
                apps.errout([
                    "Command remove requires a filepath",
                    `${text.cyan + version.command} remove ../jsFiles${text.none}`
                ]);
                return;
            }
            filepath = node.path.resolve(process.argv[0]);
            callback = function node_apps_remove_callback() {
                const out = [`${version.name} removed `];
                console.log("");
                verbose = true;
                out.push(text.angry);
                out.push(String(numb.dirs));
                out.push(text.none);
                out.push(" director");
                if (numb.dirs === 1) {
                    out.push("y, ");
                } else {
                    out.push("ies, ");
                }
                out.push(text.angry);
                out.push(String(numb.file));
                out.push(text.none);
                out.push(" file");
                if (numb.dirs !== 1) {
                    out.push("s");
                }
                out.push(", ");
                out.push(text.angry);
                out.push(String(numb.link));
                out.push(text.none);
                out.push(" symbolic link");
                if (numb.symb !== 1) {
                    out.push("s");
                }
                out.push(" at ");
                out.push(text.angry);
                out.push(apps.commas(numb.size));
                out.push(text.none);
                out.push(" bytes.");
                apps.log([out.join(""), `Removed ${text.cyan + filepath + text.none}`]);
            };
        }
        apps.directory({
            callback: removeItems,
            exclusions: [],
            path: filepath,
            recursive: true,
            symbolic: true
        });
    };
    // runs services: http, web sockets, and file system watch.  Allows rapid testing with automated rebuilds
    apps.server = function node_apps_server():void {
        if (process.argv[0] !== undefined && isNaN(Number(process.argv[0])) === true) {
            apps.errout([`Specified port, ${text.angry + process.argv[0] + text.none}, is not a number.`]);
            return;
        }
        let timeStore:number = 0;
        const port:number = (isNaN(Number(process.argv[0])))
                ? 10002
                : Number(process.argv[0]),
            server = node.http.createServer(function node_apps_server_create(request, response):void {
                let quest:number = request.url.indexOf("?"),
                    uri:string = (quest > 0)
                        ? request.url.slice(0, quest)
                        : request.url;
                const localpath:string = (uri === "/")
                    ? `${projectPath}`
                    : (uri === "/demo/")
                        ? `${projectPath}demo${sep}index.xhtml`
                        : projectPath + uri.slice(1).replace(/\/$/, "").replace(/\//g, sep);
                node.fs.stat(localpath, function node_apps_server_create_stat(ers:nodeError, stat:Stats):void {
                    const random:number = Math.random(),
                        page:string = [
                            `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xml:lang="en" xmlns="http://www.w3.org/1999/xhtml"><head><title>${version.name}</title><meta content="width=device-width, initial-scale=1" name="viewport"/><meta content="index, follow" name="robots"/><meta content="#fff" name="theme-color"/><meta content="en" http-equiv="Content-Language"/><meta content="application/xhtml+xml;charset=UTF-8" http-equiv="Content-Type"/><meta content="blendTrans(Duration=0)" http-equiv="Page-Enter"/><meta content="blendTrans(Duration=0)" http-equiv="Page-Exit"/><meta content="text/css" http-equiv="content-style-type"/><meta content="application/javascript" http-equiv="content-script-type"/><meta content="#bbbbff" name="msapplication-TileColor"/><link href="/website.css?${random}" media="all" rel="stylesheet" type="text/css"/></head><body>`,
                            `<h1>${version.name}</h1><div class="section">insertme</div></body></html>`
                        ].join("");
                    if (request.url.indexOf("favicon.ico") < 0 && request.url.indexOf("images/apple") < 0) {
                        if (ers !== null) {
                            if (ers.code === "ENOENT") {
                                console.log(`${text.angry}404${text.none} for ${uri}`);
                                response.writeHead(200, {"Content-Type": "text/html"});
                                if (request.headers.referer.indexOf("http") === 0 && request.headers.referer.indexOf("/demo") > 0) {
                                    response.write("");
                                } else {
                                    response.write(page.replace("insertme", `<p>HTTP 404: ${uri}</p>`));
                                }
                                response.end();
                            } else {
                                apps.errout([ers.toString()]);
                            }
                            return;
                        }
                        if (stat.isDirectory() === true) {
                            node.fs.readdir(localpath, function node_apps_server_create_stat_dir(erd:Error, list:string[]) {
                                const dirlist:string[] = [`<p>directory of ${localpath}</p> <ul>`];
                                if (erd !== null) {
                                    apps.errout([erd.toString()]);
                                    return;
                                }
                                list.forEach(function node_apps_server_create_stat_dir_list(value:string) {
                                    if ((/\.x?html?$/).test(value.toLowerCase()) === true) {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}">${value}</a></li>`);
                                    } else {
                                        dirlist.push(`<li><a href="${uri.replace(/\/$/, "")}/${value}?${random}">${value}</a></li>`);
                                    }
                                });
                                dirlist.push("</ul>");
                                response.writeHead(200, {"Content-Type": "text/html"});
                                response.write(page.replace("insertme", dirlist.join("")));
                                response.end();
                            });
                            return;
                        }
                        if (stat.isFile() === true) {
                            node.fs.readFile(localpath, "utf8", function node_apps_server_create_readFile(err:Error, data:string):void {
                                if (err !== undefined && err !== null) {
                                    if (err.toString().indexOf("no such file or directory") > 0) {
                                        response.writeHead(404, {"Content-Type": "text/plain"});
                                        if (localpath.indexOf("apple-touch") < 0 && localpath.indexOf("favicon") < 0) {
                                            console.log(`${text.angry}404${text.none} for ${localpath}`);
                                        }
                                        return;
                                    }
                                    response.write(JSON.stringify(err));
                                    console.log(err);
                                    return;
                                }
                                if (localpath.indexOf(".js") === localpath.length - 3) {
                                    response.writeHead(200, {"Content-Type": "application/javascript"});
                                } else if (localpath.indexOf(".css") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/css"});
                                } else if (localpath.indexOf(".xhtml") === localpath.length - 6) {
                                    response.writeHead(200, {"Content-Type": "application/xhtml+xml"});
                                } else if (localpath.indexOf(".html") === localpath.length - 5 || localpath.indexOf(".htm") === localpath.length - 4) {
                                    response.writeHead(200, {"Content-Type": "text/html"});
                                } else {
                                    response.writeHead(200, {"Content-Type": "text/plain"});
                                }
                                response.write(data);
                                response.end();
                            });
                        } else {
                            response.end();
                        }
                        return;
                    }
                });
            }),
            serverError = function node_apps_server_serverError(error):void {
                if (error.code === "EADDRINUSE") {
                    if (error.port === port + 1) {
                        apps.errout([`Web socket channel port, ${text.cyan + port + text.none}, is in use!  The web socket channel is 1 higher than the port designated for the HTTP server.`]);
                    } else {
                        apps.errout([`Specified port, ${text.cyan + port + text.none}, is in use!`]);
                    }
                } else {
                    apps.errout([`${error.Error}`]);
                }
                return
            },
            ignore   = function node_apps_server_ignore(input:string|null):boolean {
                if (input.indexOf(".git") === 0) {
                    return true;
                }
                if (input.indexOf("node_modules") === 0) {
                    return true;
                }
                if (input.indexOf("js") === 0) {
                    return true;
                }
                return false;
            },
            socket = require("ws"),
            ws = new socket.Server({port: port + 1});
        if (process.cwd() !== projectPath) {
            process.chdir(projectPath);
        }
        ws.broadcast = function node_apps_server_broadcast(data:string):void {
            ws.clients.forEach(function node_apps_server_broadcast_clients(client):void {
                if (client.readyState === socket.OPEN) {
                    client.send(data);
                }
            });
        };
        console.log(`HTTP server is up at: ${text.bold + text.green}http://localhost:${port + text.none}`);
        console.log(`${text.green}Starting web server and file system watcher!${text.none}`);
        node.fs.watch(projectPath, {
            recursive: true
        }, function node_apps_server_watch(type:"rename"|"change", filename:string|null):void {
            if (filename === null || ignore(filename) === true) {
                return;
            }
            const extension:string = (function node_apps_server_watch_extension():string {
                    const list = filename.split(".");
                    return list[list.length - 1];
                }()),
                time = function node_apps_server_watch_time(message:string):number {
                    const date:Date = new Date(),
                        datearr:string[] = [];
                    let hours:string = String(date.getHours()),
                        minutes:string = String(date.getMinutes()),
                        seconds:string = String(date.getSeconds()),
                        mseconds:string = String(date.getMilliseconds());
                    if (hours.length === 1) {
                        hours = `0${hours}`;
                    }
                    if (minutes.length === 1) {
                        minutes = `0${minutes}`;
                    }
                    if (seconds.length === 1) {
                        seconds = `0${seconds}`;
                    }
                    if (mseconds.length < 3) {
                        do {
                            mseconds = `0${mseconds}`;
                        } while (mseconds.length < 3);
                    }
                    datearr.push(hours);
                    datearr.push(minutes);
                    datearr.push(seconds);
                    datearr.push(mseconds);
                    console.log(`[${text.cyan + datearr.join(":") + text.none}] ${message}`);
                    timeStore = date.valueOf();
                    return timeStore;
                };
            if (extension === "ts" && timeStore < Date.now() - 1000) {
                let start:number,
                    compile:number,
                    duration = function node_apps_server_watch_duration(length:number):void {
                        let hours:number = 0,
                            minutes:number = 0,
                            seconds:number = 0,
                            list:string[] = [];
                        if (length > 3600000) {
                            hours = Math.floor(length / 3600000);
                            length = length - (hours * 3600000);
                        }
                        list.push(hours.toString());
                        if (list[0].length < 2) {
                            list[0] = `0${list[0]}`;
                        }
                        if (length > 60000) {
                            minutes = Math.floor(length / 60000);
                            length = length - (minutes * 60000);
                        }
                        list.push(minutes.toString());
                        if (list[1].length < 2) {
                            list[1] = `0${list[1]}`;
                        }
                        if (length > 1000) {
                            seconds = Math.floor(length / 1000);
                            length = length - (seconds * 1000);
                        }
                        list.push(seconds.toString());
                        if (list[2].length < 2) {
                            list[2] = `0${list[2]}`;
                        }
                        list.push(length.toString());
                        if (list[3].length < 3) {
                            do {
                                list[3] = `0${list[3]}`;
                            } while (list[3].length < 3);
                        }
                        console.log(`[${text.bold + text.purple + list.join(":") + text.none}] Total compile time.\u0007`);
                    };
                console.log("");
                start = time(`Compiling for ${text.green + filename + text.none}`);
                node.child(`${version.command} build incremental`, {
                    cwd: projectPath
                }, function node_apps_server_watch_child(err:Error, stdout:string, stderr:string):void {
                    if (err !== null) {
                        apps.errout([err.toString()]);
                        return;
                    }
                    if (stderr !== "") {
                        apps.errout([stderr]);
                        return;
                    }
                    compile = time("TypeScript Compiled") - start;
                    duration(compile);
                    ws.broadcast("reload");
                    return;
                });
            } else if (extension === "css" || extension === "xhtml") {
                ws.broadcast("reload");
            }
        });
        server.on("error", serverError);
        server.listen(port);
    };
    // simulates running the various commands of this services.ts file
    apps.simulation = function node_apps_simulation(callback:Function):void {
        const tests:simulationItem[] = require(`${js}test${sep}simulations.js`),
            len:number = tests.length,
            cwd:string = __dirname.replace(/(\/|\\)js$/, ""),
            increment = function node_apps_simulation_increment(irr:string):void {
                const interval = function node_apps_simulation_increment_interval():void {
                    a = a + 1;
                    if (a < len) {
                        wrapper();
                    } else {
                        console.log("");
                        if (callback === undefined) {
                            console.log(`${text.green}Successfully completed all ${text.cyan + text.bold + len + text.none + text.green} simulation tests.${text.none}`);
                        } else {
                            callback(`${text.green}Successfully completed all ${text.cyan + text.bold + len + text.none + text.green} simulation tests.${text.none}`);
                        }
                    }
                };
                if (irr !== "") {
                    console.log(`${apps.humantime(false) + text.underline}Test ${a + 1} ignored (${text.angry + irr + text.none + text.underline}):${text.none} ${tests[a].command}`);
                } else {
                    console.log(`${apps.humantime(false) + text.green}Passed simulation ${a + 1}: ${text.none + tests[a].command}`);
                }
                if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                    interval();
                } else {
                    apps.remove(tests[a].artifact, function node_apps_simulation_wrapper_remove():void {
                        interval();
                    });
                }
            },
            errout = function node_apps_simulation_errout(message:string, stdout:string) {
                apps.errout([
                    `Simulation test string ${text.angry + tests[a].command + text.none} ${message}:`,
                    tests[a].test,
                    "",
                    "",
                    `${text.green}Actual output:${text.none}`,
                    stdout
                ]);
            },
            wrapper = function node_apps_simulation_wrapper():void {
                node.child(`${version.command} ${tests[a].command}`, {cwd: cwd, maxBuffer: 2048 * 500}, function node_apps_simulation_wrapper_child(errs:nodeError, stdout:string, stderror:string|Buffer) {
                    if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                        flag.write = "";
                    } else {
                        tests[a].artifact = node.path.resolve(tests[a].artifact);
                        flag.write = tests[a].artifact;
                    }
                    if (errs !== null) {
                        if (errs.toString().indexOf("getaddrinfo ENOTFOUND") > -1) {
                            increment("no internet connection");
                            return;
                        }
                        if (errs.toString().indexOf("certificate has expired") > -1) {
                            increment("TLS certificate expired on HTTPS request");
                            return;
                        }
                        if (stdout === "") {
                            apps.errout([errs.toString()]);
                            return;
                        }
                    }
                    if (stderror !== "") {
                        apps.errout([stderror]);
                        return;
                    }
                    if (typeof stdout === "string") {
                        stdout = stdout.replace(/\s+$/, "").replace(/^\s+/, "").replace(/\u0020-?\d+(\.\d+)*\s/g, " XXXX ").replace(/\\n-?\d+(\.\d+)*\s/g, "\\nXXXX ");
                    }
                    if (tests[a].qualifier.indexOf("file") === 0) {
                        if (tests[a].artifact === "" || tests[a].artifact === undefined) {
                            apps.errout([`Tests ${text.cyan + tests[a].command + text.none} uses ${text.angry + tests[a].qualifier + text.none} as a qualifier but does not mention an artifact to remove.`]);
                            return;
                        }
                        if (tests[a].qualifier.indexOf("file ") === 0) {
                            tests[a].file = node.path.resolve(tests[a].file);
                            node.fs.readFile(tests[a].file, "utf8", function node_apps_simulation_wrapper_file(err:Error, dump:string) {
                                if (err !== null) {
                                    apps.errout([err.toString()]);
                                    return;
                                }
                                if (tests[a].qualifier === "file begins" && dump.indexOf(tests[a].test) !== 0) {
                                    errout(`is not starting in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file contains" && dump.indexOf(tests[a].test) < 0) {
                                    errout(`is not anywhere in file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file ends" && dump.indexOf(tests[a].test) === dump.length - tests[a].test.length) {
                                    errout(`is not at end of file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file is" && dump !== tests[a].test) {
                                    errout(`does not match the file: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not" && dump === tests[a].test) {
                                    errout(`matches this file, but shouldn't: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                if (tests[a].qualifier === "file not contains" && dump.indexOf(tests[a].test) > -1) {
                                    errout(`is contained in this file, but shouldn't be: ${text.green + tests[a].file + text.none}`, dump);
                                    return;
                                }
                                increment("");
                            });
                        } else if (tests[a].qualifier.indexOf("filesystem ") === 0) {
                            tests[a].test = node.path.resolve(tests[a].test);
                            node.fs.stat(tests[a].test, function node_apps_simulation_wrapper_filesystem(ers:Error) {
                                if (ers !== null) {
                                    if (tests[a].qualifier === "filesystem contains" && ers.toString().indexOf("ENOENT") > -1) {
                                        apps.errout([
                                            `Simulation test string ${text.angry + tests[a].command + text.none} does not see this address in the local file system:`,
                                            text.cyan + tests[a].test + text.none
                                        ]);
                                        return;
                                    }
                                    apps.errout([ers.toString()]);
                                    return;
                                }
                                if (tests[a].qualifier === "filesystem not contains") {
                                    apps.errout([
                                        `Simulation test string ${text.angry + tests[a].command + text.none} sees the following address in the local file system, but shouldn't:`,
                                        text.cyan + tests[a].test + text.none
                                    ]);
                                    return;
                                }
                                increment("");
                            });
                        }
                    } else {
                        if (tests[a].qualifier === "begins" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== 0)) {
                            errout("does not begin with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) < 0)) {
                            errout("does not contain the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "ends" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) !== stdout.length - tests[a].test.length)) {
                            errout("does not end with the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "is" && stdout !== tests[a].test) {
                            errout("does not match the expected output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not" && stdout === tests[a].test) {
                            errout("must not be this output", stdout);
                            return;
                        }
                        if (tests[a].qualifier === "not contains" && (typeof stdout !== "string" || stdout.indexOf(tests[a].test) > -1)) {
                            errout("must not contain this output", stdout)
                            return;
                        }
                        increment("");
                    }
                });
            };

        let a:number = 0;
        if (command === "simulation") {
            callback = function node_apps_lint_callback(message:string):void {
                apps.log([message, "\u0007"]); // bell sound
            };
            verbose = true;
            console.log("");
            console.log(`${text.underline + text.bold + version.name} - services.ts simulation tests${text.none}`);
            console.log("");
        }
        wrapper();
    };
    // run the test suite using the build application
    apps.test = function node_apps_test():void {
        apps.build(true);
    };
    // runs apps.log
    apps.version = function ():void {
        verbose = true;
        apps.log([""]);
    };
    // performs word wrap when printing text to the shell
    apps.wrapit = function node_apps_wrapit(outputArray:string[], string:string):void {
        const wrap:number = 100;
        if (string.length > wrap) {
            const indent:string = (function node_apps_wrapit_indent():string {
                    const len:number = string.length;
                    let inc:number = 0,
                        num:number = 2,
                        str:string = "";
                    if ((/^(\s*((\u002a|-)\s*)?\w+\s*:)/).test(string.replace(/\u001b\[\d+m/g, "")) === false) {
                        return "";
                    }
                    do {
                        if (string.charAt(inc) === ":") {
                            break;
                        }
                        if (string.charAt(inc) === "\u001b") {
                            if (string.charAt(inc + 4) === "m") {
                                inc = inc + 4;
                            } else {
                                inc = inc + 3;
                            }
                        } else {
                            num = num + 1;
                        }
                        inc = inc + 1;
                    } while (inc < len);
                    inc = 0;
                    do {
                        str = str + " ";
                        inc = inc + 1;
                    } while (inc < num);
                    return str;
                }()),
                formLine = function node_apps_wrapit_formLine():void {
                    let inc:number = 0,
                        wrapper:number = wrap;
                    do {
                        if (string.charAt(inc) === "\u001b") {
                            if (string.charAt(inc + 4) === "m") {
                                wrapper = wrapper + 4;
                            } else {
                                wrapper = wrapper + 3;
                            }
                        }
                        inc = inc + 1;
                    } while (inc < wrapper);
                    inc = wrapper;
                    if (string.charAt(wrapper) !== " " && string.length > wrapper) {
                        do {
                            wrapper = wrapper - 1;
                        } while (wrapper > 0 && string.charAt(wrapper) !== " ");
                        if (wrapper === 0 || wrapper === indent.length - 1) {
                            wrapper = inc;
                            do {
                                wrapper = wrapper + 1;
                            } while (wrapper < string.length && string.charAt(wrapper) !== " ");
                        }
                    }
                    outputArray.push(string.slice(0, wrapper).replace(/\s+$/, ""));
                    string = string.slice(wrapper + 1).replace(/^\s+/, "");
                    if (string.length + indent.length > wrap) {
                        string = indent + string;
                        node_apps_wrapit_formLine();
                    } else if (string !== "") {
                        outputArray.push(indent + string);
                    }
                };
            formLine();
        } else {
            outputArray.push(string);
        }
    };
    apps[command]();
}());