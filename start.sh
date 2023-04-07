#!/bin/bash

echo Starting bot

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

echo $NVM_DIR
echo Loaded nvm

yarn exec -- ts-node .