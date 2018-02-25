#!/bin/bash

usage () {
    echo "Usage: $0 -a HOST -p PORT -l LOG_LEVEL -e PEERS -n NAME"
    exit
}

echo_err_help () {
    echo "$1" >&2
    usage
    exit 1
}

# cli options
options="ha:p:l:e:n"
while getopts $options OPTION; do
    case $OPTION in
        a)
            HOST=$OPTARG
            ;;
        p) 
            PORT=$OPTARG
            ;;
        l) 
            LOG_LEVEL=$OPTARG
            ;;
        e)
            PEERS=$OPTARG
            ;;
        n)
            NAME=$OPTARG
            ;;
        h) 
            usage 
            ;;
        \?) 
            echo_err_help "Unknown option: -$OPTARG"
            ;;
        :) 
            echo_err_help "Missing option argument for -$OPTARG" 
            ;;
        *) 
            echo_err_help "Unimplemented option: -$OPTARG" 
            ;;
    esac
done

shift $((OPTIND - 1))

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3001}"
NAME="${NAME:-1}"

echo "Running naivecoin inside docker with the following arguments:
  HOST:  $HOST
  PORT:  $PORT
  LOG_LEVEL:  $LOG_LEVEL
  PEERS: $PEERS
  NAME: $NAME

"
if [ -z "$HOST" ]; then HOST_ARG=""; else HOST_ARG="-e HOST=$HOST"; fi
if [ -z "$PORT" ]; then PORT_ARG=""; else PORT_ARG="-e PORT=$PORT"; fi
if [ -z "$PEERS" ]; then PEERS_ARG=""; else PEERS_ARG="-e PEERS=$PEERS"; fi
if [ -z "$NAME" ]; then NAME_ARG=""; else NAME_ARG="-e NAME=$NAME"; fi
if [ -z "$LOG_LEVEL" ]; then LOG_LEVEL_ARG=""; else LOG_LEVEL_ARG="-e LOG_LEVEL=$LOG_LEVEL"; fi

docker run -t --rm --name naivecoin_$NAME $HOST_ARG $NAME_ARG $PORT_ARG $PEERS_ARG $LOG_LEVEL_ARG -v /$(pwd):/naivecoin -p $PORT:$PORT naivecoin