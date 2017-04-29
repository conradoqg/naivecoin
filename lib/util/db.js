const fs = require('fs-extra');
const path = require('path');

class Db {
    constructor(filePath, defaultData) {
        this.filePath = filePath;
        this.defaultData = defaultData;
    }

    read(prototype) {
        if (!fs.existsSync(this.filePath)) return this.defaultData;

        var fileContent = fs.readFileSync(this.filePath);
        if (fileContent.length == 0) return this.defaultData;

        return (prototype) ? prototype.fromJson(JSON.parse(fileContent)) : JSON.parse(fileContent);        
    }

    write(data) {
        fs.ensureDirSync(path.dirname(this.filePath));
        fs.writeFileSync(this.filePath, JSON.stringify(data));
    }
}

module.exports = Db;