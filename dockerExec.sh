#!/bin/bash
docker run  -t --rm --name naivechain -e HOST=0.0.0.0 -v /$(pwd):/naivecoin -p 3001:3001 naivechain