# Concord Core - Concord's Multi-Purpose Desktop Application

## Introduction

Concord Core is the main Desktop Application of the Concord Ecosystem, with a built-in Blockchain Wallet for the Concord Coin (CXD).

Concord Core aims to create a new Blockchain structure, based on a new Validation and Storage-Based consensus protocol, without removing the security and decentralized nature of the average Cryptocurrency Blockchain.


### Client

```sh
# Command-line options
$ node bin/concord.js -h
Usage: bin\concord.js [options]

Options:
  -a, --host       Host address. (localhost by default)
  -p, --port       HTTP port. (3001 by default)
  -l, --log-level  Log level (7=dir, debug, time and trace, 6=log and info,
                   4=warn, 3=error, assert, 6 by default).
  --peers          Peers list.                                           [array]
  --name           Node name/identifier.
  -h, --help       Show help                                           [boolean]
```

### Development

```sh
# Cloning repository
$ git clone git@github.com:Concord-Ecosystem/Concord-Core.git
$ cd Concord-Core
$ npm install

# Testing
$ npm test
```

### Contribution and License Agreement

If any issues are discovered within the project, you are free to correct and Fork/PR, or send an issue within our Repo.

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the Apache 2.0 license. You are also implicitly verifying that
all code is your original work.

Copyright (c) 2018, Eupharia. (Apache 2.0 License)

This project contains a modified version of [Naivecoin](https://github.com/conradoqg/naivecoin) by [conradoqg](https://github.com/conradoqg)

Copyright (c) 2015-2015, Conrado Quilles Gomes. (Apache 2.0 License)

[GitHub license](https://github.com/Concord-Ecosystem/Concord-Core/blob/master/LICENSE)
