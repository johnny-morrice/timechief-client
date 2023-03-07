#!/bin/bash
set -e
source env/setenv.sh
npm install
npm run build
npm start 
