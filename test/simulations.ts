
// tests structure
// * artifact - the address of anything written to disk, so that it can be removed
// * command - the command to execute minus the `node js/services` part
// * file - a file system address to open
// * qualifier - how to test, see simulationItem in index.d.ts for appropriate values
// * test - the value to compare against

(function simulations() {
    "use strict";
    const sep:string = require("path").sep,
        projectPath:string = (function node_project() {
            const dirs:string[] = __dirname.split(sep);
            return dirs.slice(0, dirs.length - 2).join(sep) + sep;
        }()),
        version:version = require(`..${sep}version`),
        supersep:string = (sep === "\\")
            ? "\\\\"
            : sep,
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
        tests:simulationItem[] = [
            {
                command: "asdf",
                qualifier: "contains",
                test: ` is not a supported command`
            },
            {
                command: "b",
                qualifier: "is",
                test: `Command '${text.angry}b${text.none}' is ambiguous as it could refer to any of: [${text.cyan}base64, build${text.none}]`
            },
            {
                command: "base64",
                qualifier: "contains",
                test: "No path to encode."
            },
            {
                command: `base64 ${projectPath}tsconfig.json`,
                qualifier: "is",
                test: "ewogICAgImNvbXBpbGVyT3B0aW9ucyI6IHsKICAgICAgICAib3V0RGlyIjogImpzIiwKICAgICAgICAicHJldHR5IjogdHJ1ZSwKICAgICAgICAidGFyZ2V0IjogIkVTNiIsCiAgICAgICAgInR5cGVzIjogWyJAdHlwZXMvbm9kZSJdCiAgICB9LAogICAgImV4Y2x1ZGUiOiBbCiAgICAgICAgImpzIiwKICAgICAgICAibm9kZV9tb2R1bGVzIgogICAgXSwKICAgICJpbmNsdWRlIjogWwogICAgICAgICIqLnRzIiwKICAgICAgICAiKiovKi50cyIKICAgIF0KfQ=="
            },
            {
                command: "base64 decode string:\"bXkgYmlnIHN0cmluZyBzYW1wbGU=\"",
                qualifier: "is",
                test: "my big string sample"
            },
            {
                command: "base64 decode string:\"ewogICAgImNvbXBpbGVyT3B0aW9ucyI6IHsKICAgICAgICAidGFyZ2V0IjogIkVTNiIsCiAgICAgICAgIm91dERpciI6ICJqcyIKICAgIH0sCiAgICAiaW5jbHVkZSI6IFsKICAgICAgICAiKi50cyIsCiAgICAgICAgIioqLyoudHMiCiAgICBdLAogICAgImV4Y2x1ZGUiOiBbCiAgICAgICAgImpzIiwKICAgICAgICAibm9kZV9tb2R1bGVzIiwKICAgICAgICAidGVzdCIKICAgIF0KfQ==\"",
                qualifier: "ends",
                test: `{\n    "compilerOptions": {\n        "target": "ES6",\n        "outDir": "js"\n    },\n    "include": [\n        "*.ts",\n        "*\u002a/\u002a.ts"\n    ],\n    "exclude": [\n        "js",\n        "node_modules",\n        "test"\n    ]\n}`
            },
            {
                command: "base64 https://duckduckgo.com/assets/logo_homepage.normal.v107.svg",
                qualifier: "is",
                test: "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNi4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB3aWR0aD0iMjUwcHgiIGhlaWdodD0iMjAwcHgiIHZpZXdCb3g9IjAgMCAyNTAgMjAwIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCAyNTAgMjAwIiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxnPg0KCTxjaXJjbGUgZmlsbD0iI0RFNTgzMyIgY3g9IjEyNy4zMzIiIGN5PSI3OC45NjYiIHI9IjUxLjE1Ii8+DQoJPGc+DQoJCTxnPg0KCQkJPHBhdGggZmlsbD0iIzRDNEM0QyIgZD0iTTIyLjU2NCwxODAuNTc0di0yNC41OThoOC45MTRjOC40ODcsMCwxMi4zNTIsNi4yMzQsMTIuMzUyLDEyLjAzMWMwLDYuMjU2LTMuODE5LDEyLjU2Mi0xMi4zNTIsMTIuNTYyDQoJCQkJTDIyLjU2NCwxODAuNTc0TDIyLjU2NCwxODAuNTc0eiBNMjUuMzk4LDE3Ny43NGg2LjA4YzYuNTc1LDAsOS41MTgtNC45MDQsOS41MTgtOS43NjZjMC00LjQ2Ny0yLjk3OS05LjI3MS05LjUxOC05LjI3MWgtNi4wOA0KCQkJCVYxNzcuNzRMMjUuMzk4LDE3Ny43NHoiLz4NCgkJPC9nPg0KCQk8Zz4NCgkJCTxwYXRoIGZpbGw9IiM0QzRDNEMiIGQ9Ik01NS4wNTUsMTgwLjg1N2MtNC41NTQsMC03LjQ5Ny0zLjEzNy03LjQ5Ny03Ljk5MnYtOS41NTFoMi42NTd2OS41MTZjMCwzLjQ5NiwyLjAzNCw1LjU4NCw1LjQ0Miw1LjU4NA0KCQkJCWMzLjE5NS0wLjAzNSw1LjUxMy0yLjQ4OCw1LjUxMy01LjgzMnYtOS4yNjhoMi42NTd2MTcuMjZoLTIuNDE0bC0wLjE1Mi0zLjAwMmwtMC40MTIsMC41MTgNCgkJCQlDNTkuNDE3LDE3OS44OTEsNTcuNDY4LDE4MC44MjIsNTUuMDU1LDE4MC44NTd6Ii8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cGF0aCBmaWxsPSIjNEM0QzRDIiBkPSJNNzYuNzg2LDE4MC44OTNjLTQuNDksMC05LjAyLTIuNzcxLTkuMDItOC45NDljMC01LjM1NCwzLjYyNS04Ljk0Nyw5LjAyLTguOTQ3DQoJCQkJYzIuMzYxLDAsNC40MzYsMC44NDIsNi4xNjgsMi41MDJsLTEuNjcsMS43MzJjLTEuMTc1LTEuMDk2LTIuNzgxLTEuNzIxLTQuNDI3LTEuNzIxYy0zLjc2OCwwLTYuMzk5LDIuNjQ2LTYuMzk5LDYuNDM0DQoJCQkJYzAsNC40NDUsMy4xOTYsNi40MzgsNi4zNjQsNi40MzhjMS43ODIsMCwzLjQtMC42MzYsNC41NzMtMS43OTFsMS43MzYsMS43MzZDODEuMzg0LDE4MC4wMjksNzkuMjUsMTgwLjg5Myw3Ni43ODYsMTgwLjg5M3oiLz4NCgkJPC9nPg0KCQk8Zz4NCgkJCTxwb2x5Z29uIGZpbGw9IiM0QzRDNEMiIHBvaW50cz0iOTcuNjgzLDE4MC41NzQgODkuMjQ4LDE3Mi4xMzkgODkuMjQ4LDE4MC41NzQgODYuNjI2LDE4MC41NzQgODYuNjI2LDE1Ni4wMTIgODkuMjQ4LDE1Ni4wMTIgDQoJCQkJODkuMjQ4LDE3MC44NjkgOTYuNjIxLDE2My4zMTQgMTAwLjA1OCwxNjMuMzE0IDkxLjkyNCwxNzEuNDQ4IDEwMS4wNTEsMTgwLjUzOSAxMDEuMDUxLDE4MC41NzQgCQkJIi8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cGF0aCBmaWxsPSIjNEM0QzRDIiBkPSJNMTA0LjMxNywxODAuNTc0di0yNC41OThoOC45MTNjOC40ODcsMCwxMi4zNTQsNi4yMzQsMTIuMzU0LDEyLjAzMWMwLDYuMjU2LTMuODE1LDEyLjU2Mi0xMi4zNTQsMTIuNTYyDQoJCQkJTDEwNC4zMTcsMTgwLjU3NEwxMDQuMzE3LDE4MC41NzR6IE0xMDcuMTUsMTc3Ljc0aDYuMDhjNi41NzUsMCw5LjUxOS00LjkwNCw5LjUxOS05Ljc2NmMwLTQuNDY3LTIuOTc5LTkuMjcxLTkuNTE5LTkuMjcxaC02LjA4DQoJCQkJVjE3Ny43NHoiLz4NCgkJPC9nPg0KCQk8Zz4NCgkJCTxwYXRoIGZpbGw9IiM0QzRDNEMiIGQ9Ik0xMzYuODA3LDE4MC44NTdjLTQuNTU2LDAtNy40OTYtMy4xMzctNy40OTYtNy45OTJ2LTkuNTUxaDIuNjU2djkuNTE2YzAsMy40OTYsMi4wMzQsNS41ODQsNS40NDEsNS41ODQNCgkJCQljMy4xODktMC4wMzUsNS41MTQtMi40ODgsNS41MTQtNS44MzJ2LTkuMjY4aDIuNjU2djE3LjI2aC0yLjQxNmwtMC4xNS0zLjAwMmwtMC40MTIsMC41MTgNCgkJCQlDMTQxLjE2OCwxNzkuODkxLDEzOS4yMTksMTgwLjgyMiwxMzYuODA3LDE4MC44NTd6Ii8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cGF0aCBmaWxsPSIjNEM0QzRDIiBkPSJNMTU4LjUzOSwxODAuODkzYy00LjQ5LDAtOS4wMjEtMi43NzEtOS4wMjEtOC45NDljMC01LjM1NCwzLjYyNS04Ljk0Nyw5LjAyMS04Ljk0Nw0KCQkJCWMyLjM1OSwwLDQuNDM4LDAuODQyLDYuMTY4LDIuNTAybC0xLjY3LDEuNzMyYy0xLjE3Ni0xLjA5Ni0yLjc4MS0xLjcyMS00LjQyOC0xLjcyMWMtMy43NywwLTYuMzk4LDIuNjQ2LTYuMzk4LDYuNDM0DQoJCQkJYzAsNC40NDUsMy4xOTcsNi40MzgsNi4zNjMsNi40MzhjMS43ODEsMCwzLjQtMC42MzYsNC41NzItMS43OTFsMS42ODYsMS42ODhsLTAuMDg4LDAuMDkxbDAuMDQ5LDAuMDQ5DQoJCQkJQzE2My4wNjIsMTgwLjA1OSwxNjAuOTYxLDE4MC44OTMsMTU4LjUzOSwxODAuODkzeiIvPg0KCQk8L2c+DQoJCTxnPg0KCQkJPHBvbHlnb24gZmlsbD0iIzRDNEM0QyIgcG9pbnRzPSIxNzkuNDM2LDE4MC41NzQgMTcxLDE3Mi4xMzkgMTcxLDE4MC41NzQgMTY4LjM3OSwxODAuNTc0IDE2OC4zNzksMTU2LjAxMiAxNzEsMTU2LjAxMiANCgkJCQkxNzEsMTcwLjg2OSAxNzguMzczLDE2My4zMTQgMTgxLjgxMSwxNjMuMzE0IDE3My42NzgsMTcxLjQ0OCAxODIuODAzLDE4MC41MzkgMTgyLjgwMywxODAuNTc0IAkJCSIvPg0KCQk8L2c+DQoJCTxnPg0KCQkJPHBhdGggZmlsbD0iIzRDNEM0QyIgZD0iTTE5Ni43MTksMTgxLjAzNWMtOS40NTcsMC0xMi44MTItNi43NS0xMi44MTItMTIuNTI5Yy0wLjAyMS0zLjc2NSwxLjI1Ni03LjEyNSwzLjU4NC05LjQ2Nw0KCQkJCWMyLjI5My0yLjMwNSw1LjQ3My0zLjUyMyw5LjE5Mi0zLjUyM2MzLjM2NiwwLDYuNTM3LDEuMjc5LDguOTM4LDMuNjA0bC0xLjYwNCwxLjg2OWMtMS44OS0xLjc2My00LjY4NS0yLjg1My03LjMzLTIuODUzDQoJCQkJYy02Ljg1NCwwLTkuOTc5LDUuMzc1LTkuOTc5LDEwLjM2N2MwLDQuOTA4LDMuMTA0LDkuODczLDEwLjA1MSw5Ljg3M2MyLjUyNywwLDQuODg2LTAuODY1LDYuODEyLTIuNTE4bDAuMDkxLTAuMDcydi02LjA2Mg0KCQkJCWgtNy43Mjl2LTIuNDc5aDEwLjI3NnY5LjY0NkMyMDMuNTU1LDE3OS42OTEsMjAwLjQ2MywxODEuMDM1LDE5Ni43MTksMTgxLjAzNXoiLz4NCgkJPC9nPg0KCQk8Zz4NCgkJCTxwYXRoIGZpbGw9IiM0QzRDNEMiIGQ9Ik0yMTguNDUzLDE4MC44OTNjLTUuMTg4LDAtOC45NDktMy43NDgtOC45NDktOC45MTRjMC01LjI0NiwzLjc3LTkuMDU1LDguOTQ5LTkuMDU1DQoJCQkJYzUuMjg5LDAsOC45ODIsMy43MjMsOC45ODIsOS4wNTVDMjI3LjQzNiwxNzcuMTQ1LDIyMy42NTgsMTgwLjg5MywyMTguNDUzLDE4MC44OTN6IE0yMTguNDg2LDE2NS4zMzINCgkJCQljLTMuNzI3LDAtNi4zMjYsMi43MzQtNi4zMjYsNi42NDZjMCwzLjcyOSwyLjY0Niw2LjQzNiw2LjI5Myw2LjQzNmMzLjcwOSwwLDYuMzI2LTIuNjQ2LDYuMzYxLTYuNDM0DQoJCQkJQzIyNC44MTQsMTY4LjEyNywyMjIuMTU0LDE2NS4zMzIsMjE4LjQ4NiwxNjUuMzMyeiIvPg0KCQk8L2c+DQoJPC9nPg0KCTxnPg0KCQk8Zz4NCgkJCTxnPg0KCQkJCTxnPg0KCQkJCQk8Zz4NCgkJCQkJCTxnPg0KCQkJCQkJCTxnPg0KCQkJCQkJCQk8Zz4NCgkJCQkJCQkJCTxnPg0KCQkJCQkJCQkJCTxnPg0KCQkJCQkJCQkJCQk8Zz4NCgkJCQkJCQkJCQkJCTxnPg0KCQkJCQkJCQkJCQkJCTxkZWZzPg0KCQkJCQkJCQkJCQkJCQk8cGF0aCBpZD0iU1ZHSURfMV8iIGQ9Ik0xNzguNjg0LDc4LjgyNGMwLDI4LjMxNi0yMy4wMzUsNTEuMzU0LTUxLjM1NCw1MS4zNTRjLTI4LjMxMywwLTUxLjM0OC0yMy4wMzktNTEuMzQ4LTUxLjM1NA0KCQkJCQkJCQkJCQkJCQkJYzAtMjguMzEzLDIzLjAzNi01MS4zNDksNTEuMzQ4LTUxLjM0OUMxNTUuNjQ4LDI3LjQ3NSwxNzguNjg0LDUwLjUxMSwxNzguNjg0LDc4LjgyNHoiLz4NCgkJCQkJCQkJCQkJCQk8L2RlZnM+DQoJCQkJCQkJCQkJCQkJPGNsaXBQYXRoIGlkPSJTVkdJRF8yXyI+DQoJCQkJCQkJCQkJCQkJCTx1c2UgeGxpbms6aHJlZj0iI1NWR0lEXzFfIiAgb3ZlcmZsb3c9InZpc2libGUiLz4NCgkJCQkJCQkJCQkJCQk8L2NsaXBQYXRoPg0KCQkJCQkJCQkJCQkJCTxnIGNsaXAtcGF0aD0idXJsKCNTVkdJRF8yXykiPg0KCQkJCQkJCQkJCQkJCQk8cGF0aCBmaWxsPSIjRDVEN0Q4IiBkPSJNMTQ4LjI5MywxNTUuMTU4Yy0xLjgwMS04LjI4NS0xMi4yNjItMjcuMDM5LTE2LjIzLTM0Ljk2OQ0KCQkJCQkJCQkJCQkJCQkJYy0zLjk2NS03LjkzMi03LjkzOC0xOS4xMS02LjEyOS0yNi4zMjJjMC4zMjgtMS4zMTItMy40MzYtMTEuMzA4LTIuMzU0LTEyLjAxNQ0KCQkJCQkJCQkJCQkJCQkJYzguNDE2LTUuNDg5LDEwLjYzMiwwLjU5OSwxNC4wMDItMS44NjJjMS43MzQtMS4yNzMsNC4wOSwxLjA0Nyw0LjY4OS0xLjA2YzIuMTU4LTcuNTY3LTMuMDA2LTIwLjc2LTguNzcxLTI2LjUyNg0KCQkJCQkJCQkJCQkJCQkJYy0xLjg4NS0xLjg3OS00Ljc3MS0zLjA2LTguMDMtMy42ODdjLTEuMjU0LTEuNzEzLTMuMjc1LTMuMzYtNi4xMzgtNC44NzljLTMuMTg4LTEuNjk3LTEwLjEyMS0zLjkzOC0xMy43MTctNC41MzUNCgkJCQkJCQkJCQkJCQkJCWMtMi40OTItMC40MS0zLjA1NSwwLjI4Ny00LjExOSwwLjQ2MWMwLjk5MiwwLjA4OCw1LjY5OSwyLjQxNCw2LjYxNSwyLjU0OWMtMC45MTYsMC42MTktMy42MDctMC4wMjgtNS4zMjQsMC43NDINCgkJCQkJCQkJCQkJCQkJCWMtMC44NjUsMC4zOTItMS41MTIsMS44NzctMS41MDYsMi41OGM0LjkxLTAuNDk2LDEyLjU3NC0wLjAxNiwxNy4xLDJjLTMuNjAyLDAuNDEtOS4wOCwwLjg2Ny0xMS40MzYsMi4xMDUNCgkJCQkJCQkJCQkJCQkJCWMtNi44NDgsMy42MDgtOS44NzMsMTIuMDM1LTguMDcsMjIuMTMzYzEuODA0LDEwLjA3NSw5LjczOCw0Ni44NSwxMi4yNjIsNTkuMTI5DQoJCQkJCQkJCQkJCQkJCQljMi41MjUsMTIuMjY0LTUuNDA4LDIwLjE4OS0xMC40NTUsMjIuMzU0bDUuNDA4LDAuMzYzbC0xLjgwMSwzLjk2N2M2LjQ4NCwwLjcxOSwxMy42OTUtMS40MzksMTMuNjk1LTEuNDM5DQoJCQkJCQkJCQkJCQkJCQljLTEuNDM4LDMuOTY1LTExLjE3Niw1LjQxMi0xMS4xNzYsNS40MTJzNC42OTEsMS40MzgsMTIuMjU4LTEuNDQ3YzcuNTc4LTIuODgzLDEyLjI2My00LjY4OCwxMi4yNjMtNC42ODgNCgkJCQkJCQkJCQkJCQkJCWwzLjYwNCw5LjM3M2w2Ljg1NC02Ljg0N2wyLjg4NSw3LjIxMUMxNDQuNjg2LDE2NS4yNiwxNTAuMDk2LDE2My40NTMsMTQ4LjI5MywxNTUuMTU4eiIvPg0KCQkJCQkJCQkJCQkJCQk8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTUwLjQ3MSwxNTMuNDc3Yy0xLjc5NS04LjI4OS0xMi4yNTYtMjcuMDQzLTE2LjIyOC0zNC45NzkNCgkJCQkJCQkJCQkJCQkJCWMtMy45Ny03LjkzNi03LjkzNS0xOS4xMTItNi4xMy0yNi4zMjFjMC4zMzUtMS4zMDksMC4zNDEtNi42NjgsMS40MjktNy4zNzljOC40MTEtNS40OTQsNy44MTItMC4xODQsMTEuMTg3LTIuNjQ1DQoJCQkJCQkJCQkJCQkJCQljMS43NC0xLjI3MSwzLjEzMy0yLjgwNiwzLjczOC00LjkxMmMyLjE2NC03LjU3Mi0zLjAwNi0yMC43Ni04Ljc3My0yNi41MjljLTEuODc5LTEuODc5LTQuNzY4LTMuMDYyLTguMDIzLTMuNjg2DQoJCQkJCQkJCQkJCQkJCQljLTEuMjUyLTEuNzE4LTMuMjcxLTMuMzYxLTYuMTMtNC44ODJjLTUuMzkxLTIuODYyLTEyLjA3NC00LjAwNi0xOC4yNjYtMi44ODNjMC45OSwwLjA5LDMuMjU2LDIuMTM4LDQuMTY4LDIuMjczDQoJCQkJCQkJCQkJCQkJCQljLTEuMzgxLDAuOTM2LTUuMDUzLDAuODE1LTUuMDI5LDIuODk2YzQuOTE2LTAuNDkyLDEwLjMwMywwLjI4NSwxNC44MzQsMi4yOTdjLTMuNjAyLDAuNDEtNi45NTUsMS4zLTkuMzExLDIuNTQzDQoJCQkJCQkJCQkJCQkJCQljLTYuODU0LDMuNjAzLTguNjU2LDEwLjgxMi02Ljg1NCwyMC45MTRjMS44MDcsMTAuMDk3LDkuNzQyLDQ2Ljg3MywxMi4yNTYsNTkuMTI2DQoJCQkJCQkJCQkJCQkJCQljMi41MjcsMTIuMjYtNS40MDIsMjAuMTg4LTEwLjQ0OSwyMi4zNTRsNS40MDgsMC4zNTlsLTEuODAxLDMuOTczYzYuNDg0LDAuNzIxLDEzLjY5NS0xLjQzOSwxMy42OTUtMS40MzkNCgkJCQkJCQkJCQkJCQkJCWMtMS40MzgsMy45NzQtMTEuMTc2LDUuNDA2LTExLjE3Niw1LjQwNnM0LjY4NiwxLjQzOSwxMi4yNTgtMS40NDVjNy41ODEtMi44ODMsMTIuMjY5LTQuNjg4LDEyLjI2OS00LjY4OA0KCQkJCQkJCQkJCQkJCQkJbDMuNjA0LDkuMzczTDE0NCwxNTYuMzVsMi44OTEsNy4yMTVDMTQ2Ljg3NSwxNjMuNTcyLDE1Mi4yNzksMTYxLjc2OCwxNTAuNDcxLDE1My40Nzd6Ii8+DQoJCQkJCQkJCQkJCQkJCTxwYXRoIGZpbGw9IiMyRDRGOEUiIGQ9Ik0xMDkuMDIxLDcwLjY5MWMwLTIuMDkzLDEuNjkzLTMuNzg3LDMuNzg5LTMuNzg3YzIuMDksMCwzLjc4NSwxLjY5NCwzLjc4NSwzLjc4Nw0KCQkJCQkJCQkJCQkJCQkJYzAsMi4wOTQtMS42OTUsMy43ODYtMy43ODUsMy43ODZDMTEwLjcxNCw3NC40NzgsMTA5LjAyMSw3Mi43ODUsMTA5LjAyMSw3MC42OTF6Ii8+DQoJCQkJCQkJCQkJCQkJCTxwYXRoIGZpbGw9IiNGRkZGRkYiIGQ9Ik0xMTMuNTA3LDY5LjQyOWMwLTAuNTQ1LDAuNDQxLTAuOTgzLDAuOTgtMC45ODNjMC41NDMsMCwwLjk4NCwwLjQzOCwwLjk4NCwwLjk4Mw0KCQkJCQkJCQkJCQkJCQkJYzAsMC41NDMtMC40NDEsMC45ODQtMC45ODQsMC45ODRDMTEzLjk0OSw3MC40MTQsMTEzLjUwNyw2OS45NzIsMTEzLjUwNyw2OS40Mjl6Ii8+DQoJCQkJCQkJCQkJCQkJCTxwYXRoIGZpbGw9IiMyRDRGOEUiIGQ9Ik0xMzQuODY3LDY4LjQ0NWMwLTEuNzkzLDEuNDYxLTMuMjUsMy4yNTItMy4yNWMxLjgwMSwwLDMuMjU2LDEuNDU3LDMuMjU2LDMuMjUNCgkJCQkJCQkJCQkJCQkJCWMwLDEuODAxLTEuNDU1LDMuMjU4LTMuMjU2LDMuMjU4QzEzNi4zMjgsNzEuNzAzLDEzNC44NjcsNzAuMjQ2LDEzNC44NjcsNjguNDQ1eiIvPg0KCQkJCQkJCQkJCQkJCQk8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTM4LjcyNSw2Ny4zNjNjMC0wLjQ2MywwLjM3OS0wLjg0MywwLjgzOC0wLjg0M2MwLjQ3OSwwLDAuODQ2LDAuMzgsMC44NDYsMC44NDMNCgkJCQkJCQkJCQkJCQkJCWMwLDAuNDY5LTAuMzY3LDAuODQyLTAuODQ2LDAuODQyQzEzOS4xMDQsNjguMjA1LDEzOC43MjUsNjcuODMyLDEzOC43MjUsNjcuMzYzeiIvPg0KCQkJCQkJCQkJCQkJCQkNCgkJCQkJCQkJCQkJCQkJCTxsaW5lYXJHcmFkaWVudCBpZD0iU1ZHSURfM18iIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4MT0iMTg5My4zMTg0IiB5MT0iLTIzODEuOTc5NSIgeDI9IjE5MDEuODg2NyIgeTI9Ii0yMzgxLjk3OTUiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoMSAwIDAgLTEgLTE3ODggLTIzMjEpIj4NCgkJCQkJCQkJCQkJCQkJCTxzdG9wICBvZmZzZXQ9IjAuMDA1NiIgc3R5bGU9InN0b3AtY29sb3I6IzYxNzZCOSIvPg0KCQkJCQkJCQkJCQkJCQkJPHN0b3AgIG9mZnNldD0iMC42OTEiIHN0eWxlPSJzdG9wLWNvbG9yOiMzOTRBOUYiLz4NCgkJCQkJCQkJCQkJCQkJPC9saW5lYXJHcmFkaWVudD4NCgkJCQkJCQkJCQkJCQkJPHBhdGggZmlsbD0idXJsKCNTVkdJRF8zXykiIGQ9Ik0xMTMuODg2LDU5LjcxOGMwLDAtMi44NTQtMS4yOTEtNS42MjksMC40NTNjLTIuNzcsMS43NDItMi42NjgsMy41MjMtMi42NjgsMy41MjMNCgkJCQkJCQkJCQkJCQkJCXMtMS40NzMtMy4yODMsMi40NTMtNC44OTJDMTExLjk3Miw1Ny4xOTMsMTEzLjg4Niw1OS43MTgsMTEzLjg4Niw1OS43MTh6Ii8+DQoJCQkJCQkJCQkJCQkJCQ0KCQkJCQkJCQkJCQkJCQkJPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF80XyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSIxOTIwLjI3MzQiIHkxPSItMjM3OS4zNzExIiB4Mj0iMTkyOC4wNzgxIiB5Mj0iLTIzNzkuMzcxMSIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCgxIDAgMCAtMSAtMTc4OCAtMjMyMSkiPg0KCQkJCQkJCQkJCQkJCQkJPHN0b3AgIG9mZnNldD0iMC4wMDU2IiBzdHlsZT0ic3RvcC1jb2xvcjojNjE3NkI5Ii8+DQoJCQkJCQkJCQkJCQkJCQk8c3RvcCAgb2Zmc2V0PSIwLjY5MSIgc3R5bGU9InN0b3AtY29sb3I6IzM5NEE5RiIvPg0KCQkJCQkJCQkJCQkJCQk8L2xpbmVhckdyYWRpZW50Pg0KCQkJCQkJCQkJCQkJCQk8cGF0aCBmaWxsPSJ1cmwoI1NWR0lEXzRfKSIgZD0iTTE0MC4wNzgsNTkuNDU4YzAsMC0yLjA1MS0xLjE3Mi0zLjY0My0xLjE1MmMtMy4yNzEsMC4wNDMtNC4xNjIsMS40ODgtNC4xNjIsMS40ODgNCgkJCQkJCQkJCQkJCQkJCXMwLjU0OS0zLjQ0NSw0LjczMi0yLjc1NEMxMzkuMjczLDU3LjQxNywxNDAuMDc4LDU5LjQ1OCwxNDAuMDc4LDU5LjQ1OHoiLz4NCgkJCQkJCQkJCQkJCQk8L2c+DQoJCQkJCQkJCQkJCQk8L2c+DQoJCQkJCQkJCQkJCTwvZz4NCgkJCQkJCQkJCQk8L2c+DQoJCQkJCQkJCQk8L2c+DQoJCQkJCQkJCTwvZz4NCgkJCQkJCQk8L2c+DQoJCQkJCQk8L2c+DQoJCQkJCTwvZz4NCgkJCQk8L2c+DQoJCQk8L2c+DQoJCQk8cGF0aCBmaWxsPSIjRkREMjBBIiBkPSJNMTI0LjQsODUuMjk1YzAuMzc5LTIuMjkxLDYuMjk5LTYuNjI1LDEwLjQ5MS02Ljg4N2M0LjIwMS0wLjI2NSw1LjUxLTAuMjA1LDkuMDEtMS4wNDMNCgkJCQljMy41MS0wLjgzOCwxMi41MzUtMy4wODgsMTUuMDMzLTQuMjQyYzIuNTA0LTEuMTU2LDEzLjEwNCwwLjU3Miw1LjYzMSw0LjczOGMtMy4yMzIsMS44MDktMTEuOTQzLDUuMTMxLTE4LjE3Miw2Ljk4Nw0KCQkJCWMtNi4yMTksMS44NjEtOS45OS0xLjc3Ni0xMi4wNiwxLjI4MWMtMS42NDYsMi40MzItMC4zMzQsNS43NjIsNy4wOTksNi40NTNjMTAuMDM3LDAuOTMsMTkuNjYtNC41MjEsMjAuNzE5LTEuNjI1DQoJCQkJYzEuMDY0LDIuODk1LTguNjI1LDYuNTA4LTE0LjUyNSw2LjYyM2MtNS44OTMsMC4xMTEtMTcuNzcxLTMuODk2LTE5LjU1NS01LjEzN0MxMjYuMjg1LDkxLjIwNSwxMjMuOTA2LDg4LjMxMywxMjQuNCw4NS4yOTV6Ii8+DQoJCTwvZz4NCgkJPGc+DQoJCQk8cGF0aCBmaWxsPSIjNjVCQzQ2IiBkPSJNMTI4Ljk0MywxMTUuNTkyYzAsMC0xNC4xMDItNy41MjEtMTQuMzMyLTQuNDdjLTAuMjM4LDMuMDU2LDAsMTUuNTA5LDEuNjQzLDE2LjQ1MQ0KCQkJCWMxLjY0NiwwLjkzOCwxMy4zOTYtNi4xMDgsMTMuMzk2LTYuMTA4TDEyOC45NDMsMTE1LjU5MnoiLz4NCgkJCTxwYXRoIGZpbGw9IiM2NUJDNDYiIGQ9Ik0xMzQuMzQ2LDExNS4xMThjMCwwLDkuNjM1LTcuMjg1LDExLjc1NC02LjgxNWMyLjExMSwwLjQ3OSwyLjU4MiwxNS41MSwwLjcwMSwxNi4yMjkNCgkJCQljLTEuODgxLDAuNjktMTIuOTA4LTMuODEzLTEyLjkwOC0zLjgxM0wxMzQuMzQ2LDExNS4xMTh6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjNDNBMjQ0IiBkPSJNMTI1LjUyOSwxMTYuMzg5YzAsNC45MzItMC43MDksNy4wNDksMS40MSw3LjUxOWMyLjEwOSwwLjQ3Myw2LjEwNCwwLDcuNTE4LTAuOTM4DQoJCQkJYzEuNDEtMC45MzgsMC4yMzItNy4yNzktMC4yMzItOC40NjVDMTMzLjc0OCwxMTMuMzMxLDEyNS41MjksMTE0LjI3MywxMjUuNTI5LDExNi4zODl6Ii8+DQoJCQk8cGF0aCBmaWxsPSIjNjVCQzQ2IiBkPSJNMTI2LjQyNiwxMTUuMjkyYzAsNC45MzMtMC43MDcsNy4wNSwxLjQwOSw3LjUxOWMyLjEwNiwwLjQ3OSw2LjEwNCwwLDcuNTE5LTAuOTM4DQoJCQkJYzEuNDEtMC45NDEsMC4yMzEtNy4yNzktMC4yMzYtOC40NjZDMTM0LjY0NSwxMTIuMjM0LDEyNi40MjYsMTEzLjE4LDEyNi40MjYsMTE1LjI5MnoiLz4NCgkJPC9nPg0KCTwvZz4NCgk8Y2lyY2xlIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0RFNTgzMyIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGN4PSIxMjcuMzMxIiBjeT0iNzguOTY1IiByPSI1Ny41Ii8+DQo8L2c+DQo8L3N2Zz4NCg=="
            },
            {
                command: "base64 string:\"my big string sample\"",
                qualifier: "is",
                test: "bXkgYmlnIHN0cmluZyBzYW1wbGU="
            },
            {
                command: "comm version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "commands",
                qualifier: "contains",
                test: `Commands are tested using the ${text.green}simulation${text.none} command.`
            },
            {
                command: "commands base64",
                qualifier: "contains",
                test: `   ${text.cyan + version.command} base64 encode string:"my string to encode"${text.none}`
            },
            {
                command: "commands version",
                qualifier: "contains",
                test: "Prints the current version number and date to the shell."
            },
            {
                command: "copy",
                qualifier: "contains",
                test: "The copy command requires a source path and a destination path."
            },
            {
                command: "copy js",
                qualifier: "contains",
                test: "The copy command requires a source path and a destination path."
            },
            {
                artifact: `${projectPath}temp`,
                command: `copy ${projectPath}js ${projectPath}temp`,
                qualifier: "filesystem contains",
                test: `temp${sep}test${sep}simulations.js`
            },
            {
                artifact: `${projectPath}temp`,
                command: `copy ${projectPath}js ${projectPath}temp 2`,
                file: `${projectPath}temp${sep}test${sep}simulations.js`,
                qualifier: "file begins",
                test: "// tests structure"
            },
            {
                command: "directory",
                qualifier: "contains",
                test: "No path supplied for the directory command."
            },
            {
                command: `directory ".${supersep}" ignore ["node_modules", ".git", ".DS_Store", "2", "3", "beta", "ignore"] --verbose`,
                qualifier: "contains",
                test: ` matching items from address `
            },
            {
                command: `directory ${projectPath}js`,
                qualifier: "contains",
                test: `js${supersep}test${supersep}simulations.js","file"`
            },
            {
                command: `directory ${projectPath}js 2`,
                qualifier: "contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js ignore ["test"]`,
                qualifier: "not contains",
                test: `js${supersep}test${supersep}simulations.js"`
            },
            {
                command: `directory ${projectPath}js listonly`,
                qualifier: "not contains",
                test: `,"ctime":`
            },
            {
                command: `directory ${projectPath}js typeof`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js`,
                qualifier: "is",
                test: "directory"
            },
            {
                command: `directory typeof ${projectPath}js${sep}test${sep}simulations.js`,
                qualifier: "is",
                test: "file"
            },
            {
                command: "get https://duckduckgo.com/",
                qualifier: "contains",
                test: `DDG.page = new DDG.Pages.Home();`
            },
            {
                command: "hash",
                qualifier: "contains",
                test: `Command ${text.cyan}hash${text.none} requires some form of address of something to analyze, ${text.angry}but no address is provided${text.none}.`
            },
            {
                command: "hash asdf",
                qualifier: "contains",
                test: `${sep}asdf${text.none} is not a file or directory.`
            },
            {
                command: `hash ${projectPath}tsconfig.json`,
                qualifier: "is",
                test: "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
            },
            {
                command: `hash ${projectPath}tsconfig.json --verbose`,
                qualifier: "contains",
                test: "File hashing complete."
            },
            {
                command: `hash ${projectPath} list ignore ["node_modules", ".git", ".DS_Store", "2", "3", "beta", "ignore", "sparser"]`,
                qualifier: "contains",
                test: `tsconfig.json":"db4fe9a7253ad5906c25f362fc3b94dc8c38db0564ec0d181370b54c6cbd6d17f53fcb5192183ca9ec842d96b99d913709d6b1dc965284efb5248876a2daffb1"`
            },
            {
                command: `hash ${projectPath} list ignore [.git, "node_modules", ".DS_Store", "2", "3", "beta", "ignore", "sparser", "tests", "js", "api", "beautify", "minify", "css", 'space test']`,
                qualifier: "contains",
                test: `tsconfig.json":"db4fe9a7253ad5906c25f362fc3b94dc8c38db0564ec0d181370b54c6cbd6d17f53fcb5192183ca9ec842d96b99d913709d6b1dc965284efb5248876a2daffb1"`
            },
            {
                command: `hash ${projectPath} list ignore [.git, "node_modules", ".DS_Store", "2", "3", "beta", "ignore", "sparser", "tests", "js", "api", "beautify", "minify", "css", "space test", "test"]`,
                qualifier: "not contains",
                test: "test"
            },
            {
                command: "hash https://duckduckgo.com/assets/logo_homepage.normal.v107.svg",
                qualifier: "is",
                test: "ca5259a8e10a06cae407fa016f94a7a7f44ff55047a03857ab5f3ceae4ed443f59e684dc3dba99c8fc1a847e992e008b234766327bd28265e16c8a549b40633e"
            },
            {
                command: "help",
                qualifier: "contains",
                test: `To see all the supported features try:`
            },
            {
                command: "help 2",
                qualifier: "ends",
                test: " seconds total time"
            },
            {
                command: "version",
                qualifier: "ends",
                test: " seconds total time"
            },
            {
                command: "version 2",
                qualifier: "begins",
                test: `${version.name} version ${text.angry}`
            }
        ];
    module.exports = tests;
}());