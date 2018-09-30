# Concord Core - Concord's Multi-Purpose Desktop Application

## Introduction

Concord Core is the main desktop application of the Concord Ecosystem, with a built-in blockchain wallet for the Concord Coin (CXD).

Concord Core aims to create a new blockchain structure, based on a new validation and storage-based consensus protocol, without removing the security and decentralized nature of the average cryptocurrency blockchain. The consensus will be kept via optionally-participating Validator Nodes, which in the future will be referred to and abbreviated as "VN(s)".

VNs scan, emulate, and validate the blockchain and the network at all times. In order for a block to be broadcasted into the network, it must first be submitted to all VNs. Once all available VNs have received the block, they will perform their validation checks against their own copy of the blockchain. There must be a collective consensus percentage of at least 50% for a block to pass validation and be broadcasted to all nodes throughout the Core Chain via Masternodes (which will be referred to as "MN(s)" in the future).

MNs store, distribute, and serve the blockchain to all Lightnodes and Light-Validators. Each Masternode must have its own copy of the full blockchain to distribute to any nodes connected to it. This means having many of these across the globe is essentially a large validator-secured distributed database. MNs allow Lightnodes "LN(s)" and Light-Validators to function properly, without forcing them to store a full copy of the blockchain by themselves.


## Setting up Core in a Developer Environment

Please keep in mind this is **NOT** a final release. Public and stable releases are not as complex to setup and are only found inside the [Releases page](https://github.com/Concord-Ecosystem/Concord-Core/releases).

### Windows

The Windows Installation has been tested on the following Windows Versions:
```
Windows 10
Windows 7
```

1. Install [Node.js](https://nodejs.org/en/).
2. Clone/Download the latest version of Concord Core via this Repository.
3. (If you downloaded the zip) - Unzip the folder.
4. Open Command Prompt, type `cd <concord-core-directory>`.
5. Type `npm i` and wait for the Dependencies to install, this may take some time.

After step 5, Concord Core should be ready to launch. You can launch Concord Core with the following command:

`npm start`

(which must be ran in the same directory as the Concord Core folder/clone)

### Linux

```
Not tested or scripted, coming in the future
```

### Mac

```
Not tested or scripted, coming in the future
```

## Command-line Client


**WARNING** - Command-line options are currently overridden by our automated launch script in GUI-Mode. This will be changed in future Releases.

If you are sure you want to use Command-line options, you must use Core without the GUI. Visit `concord-core-dir/bin` and run any of the following options:

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

## Development

```sh
# Cloning repository
$ git clone git@github.com:Concord-Ecosystem/Concord-Core.git
$ cd Concord-Core
$ npm install

# Testing
$ npm test // Likely to fail, this will be worked on later
```

## Contribution and License Agreement

If any issues are discovered within the project, you are free to correct and Fork/PR or send an issue within the Concord Repo.

If you contribute code to this project, you are implicitly allowing your code to be distributed under the Apache 2.0 License. You are also implicitly verifying that all code is your original work.

Copyright (c) 2018, Eupharia. (Apache 2.0 License)

This project contains a modified version of [Naivecoin](https://github.com/conradoqg/naivecoin) by [conradoqg](https://github.com/conradoqg)

Copyright (c) 2015-2015, Conrado Quilles Gomes. (Apache 2.0 License)

[GitHub license](https://github.com/Concord-Ecosystem/Concord-Core/blob/master/LICENSE)
