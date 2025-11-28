#!/bin/bash
set -ev

if [ "${SANITY}" = "true" ]; then
  /usr/bin/yarn check
  node scripts/sanity_check_translations.js
  ember build -prod
fi

if [ "${PARTITION}" ]; then
  node_modules/ember-cli/bin/ember exam --split=${PARTITIONS} --partition="${PARTITION}"
fi
