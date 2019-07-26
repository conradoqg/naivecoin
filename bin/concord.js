#!/usr/bin/env node
const concord = require('./../lib/concord')

const os = require('os');
const publicIp = require('public-ip');

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('a', 'host')
    .describe('a', 'Host address. (localhost by default)')
    .alias('p', 'port')
    .describe('p', 'HTTP port. (3001 by default)')
    .alias('l', 'log-level')
    .describe('l', 'Log level (7=dir, debug, time and trace; 6=log and info; 4=warn; 3=error, assert; 6 by default).')
    .describe('peers', 'Peers list.')
    .describe('name', 'Node name/identifier.')
    .array('peers')
    .help('h')
    .alias('h', 'help')
    .argv
let interfaces = os.networkInterfaces();
let outwardInterfaces = [];
Object.keys(interfaces).forEach((interface) => {
    if(!interfaces[interface][0].internal) outwardInterfaces.push(interfaces[interface]);
});

let peers = argv.peers ? argv.peers : [];
/*for(let iface of outwardInterfaces){
    for(let ipstruct of iface){
        let ip = ipstruct.family == 'IPv6' ? '[' + ipstruct.address + ']' : ipstruct.address;
        peers.push('http://' + ip + ':' + (argv.port ? argv.port : '3001'));
    }
}*/
console.log('Retrieving public IP');
(async () =>{

    try{
        let publicV4 = await publicIp.v4();
        //if(peers.indexOf('http://' + publicV4 + ':' + (argv.port ? argv.port : '3001'))<0) peers.push('http://' + publicV4 + ':' + (argv.port ? argv.port : '3001'));
    }catch(error){
        console.log('error getting ipv4');
    }
    try{
        let publicV6 = await publicIp.v6();
        //if(peers.indexOf('http://' + publicV6 + ':' + (argv.port ? argv.port : '3001'))<0) peers.push('http://' + publicV6 + ':' + (argv.port ? argv.port : '3001'));
    }catch(error){
        console.log('error getting ipv4');
    }

    if (!argv.port || argv.port === '' || argv.port === 0) {
        let UPNP = require('bupnp')
        UPNP.discover().then((wan) => {
            console.log('DISCOVERED ' + wan)
            wan.getExternalIP().then((host) => {
                console.log('I am ' + host)
                wan.addPortMapping(host, 3001, 3001).then(() => {
                    if (argv.host !== '') {
                        host = argv.host
                    } else {
                        host = '::'
                    }
                    console.log('Got the ports!')
                    concord(host, 3001, peers, argv.logLevel, argv.name)
                }).catch((err) => {
                    console.error(err)
                    concord('::', 3001, peers, argv.logLevel, argv.name)
                })
            }).catch((err) => {
                console.log(err)
                concord('::', 3001, peers, argv.logLevel, argv.name)
            })
        }).catch((err) => {
            console.log(err)
            concord('::', 3001, peers, argv.logLevel, argv.name)
        })
    } else {
        let port = argv.port;
        concord(argv.host, port, peers, argv.logLevel, argv.name)
    }
})();
