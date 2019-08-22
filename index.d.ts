
type qualifier = "begins" | "contains" | "ends" | "file begins" | "file contains" | "file ends" | "file is" | "file not" | "file not contains" | "filesystem contains" | "filesystem not contains" | "is" | "not" | "not contains";

interface applications {
    [key:string]: Function;
}
interface appName {
    command: string,
    name: string
}
interface commandList {
    [key:string]: {
        description: string;
        example: {
            code: string,
            defined: string
        }[];
    }
}
interface flags {
    error: boolean;
    write: string;
}
interface nodeCopyParams {
    callback:Function;
    destination:string;
    exclusions:string[];
    target:string;
}
interface nodeError extends Error {
    code: string;
}
interface nodeFileProps {
    atime: number;
    mode: number;
    mtime: number;
}
interface nodeLists {
    emptyline: boolean;
    heading: string;
    obj: any;
    property: "eachkey" | string;
    total: boolean;
}
interface readDirectory {
    callback: Function;
    exclusions: string[];
    path: string;
    recursive: boolean;
    symbolic: boolean;
}
interface simulationItem {
    artifact?: string;
    command: string;
    file?: string;
    qualifier: qualifier;
    test: string;
}
interface version {
    command: string;
    date: string;
    name: string;
    number: string;
}