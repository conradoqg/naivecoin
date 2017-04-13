const fs = require('fs-extra');
const path = require('path');

class Db {
    constructor(filePath, defaultData) {
        this.filePath = filePath;
        this.data = defaultData;
    }

    read() {
        if (!fs.existsSync(this.filePath)) return;

        var fileContent = fs.readFileSync(this.filePath);
        if (fileContent.length == 0) return;

        this.data = JSON.parse(fileContent);
    }

    write() {
        fs.ensureDirSync(path.dirname(this.filePath));
        fs.writeFile(this.filePath, JSON.stringify(this.data), function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }
}

module.exports = Db;