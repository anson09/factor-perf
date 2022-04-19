#!/usr/bin/env bash
set -eo pipefail

ENV=$(grep -v '^#' .env | xargs)
REQUIRES=('PUBLIC_PATH')

for ITEM in ${REQUIRES[@]}; do
    if [[ ! $ENV =~ $ITEM ]]; then
        echo "script fail: .env missing item - < ${ITEM} >\n"
        exit 1
    fi
done

export $ENV
