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

        if (prototype) {
            return prototype.fromJson(JSON.parse(fileContent));
        } else {
            return JSON.parse(fileContent);
        }
    }

    write(data) {
        fs.ensureDirSync(path.dirname(this.filePath));
        let self = this;
        return new Promise(function (resolve, reject) {
            fs.writeFile(self.filePath, JSON.stringify(data), function (err, data) {
                if (err !== null) return reject(err);
                resolve(data);
            });
        });
    }
}

module.exports = Db;