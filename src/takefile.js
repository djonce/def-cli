const fs = require("fs");
const path = require("path");

// 1. 读取指定文件目录下所有的文件
module.exports = function getFills(directoryPath) {
    let allFiles = []

    function readDir(dirPath) {
        let files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const filePath = path.join(dirPath, file)
            const fileStat = fs.statSync(filePath)

            if (fileStat.isDirectory()) {
                readDir(filePath)
            } 
    
            if (fileStat.isFile()) {
                allFiles.push(filePath)
            }
        })   
    }

    readDir(directoryPath)

    return allFiles
}