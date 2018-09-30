#!/usr/bin/env node
const concord = require('./../lib/concord')

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

if(!argv.port || argv.port === "" || argv.port === 0){
    let UPNP = require('bupnp');
    UPNP.discover().then((wan)=>{
        console.log("DISCOVERED " + wan);
        wan.getExternalIP().then((host)=>{
            console.log("I am " + host);
           wan.addPortMapping(host, 3001, 3001).then(()=>{
               if(argv.host !== ""){
                   host = argv.host;
               } else {
                   host = "::";
               }
               console.log("Got the ports!");
               concord(host, 3001, argv.peers, argv.logLevel, argv.name);
           }).catch((err)=>{
               console.error(err);
               concord("::", 3001, argv.peers, argv.logLevel, argv.name);
           });
        }).catch((err)=>{
            console.log(err);
            concord("::", 3001, argv.peers, argv.logLevel, argv.name);

        });
    }).catch((err)=>{
        console.log(err);
        concord("::", 3001, argv.peers, argv.logLevel, argv.name);

    });

}else{
    concord(argv.host, argv.port, argv.peers, argv.logLevel, argv.name);
}

