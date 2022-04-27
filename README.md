## About

It's a fullstack repo used for checking factor performance rapidly  
Online address is https://anka.ricequant.com/factor-perf

## Tech Stack

- mongodb
- fasitfy
- pm2
- vue3
- element-plus
- parcel2
- highcharts

## Developer Guide

1. npm ci (global npm package need zx/pm2/nodemon)

### server

2. mongo import test data from 'packages/factor-perf-server/assets' to local DB, (or use online DB)
3. configure packages/factor-perf-server/.env, (like .env.example)
4. npm run server dev

### page

5. configure packages/factor-perf-page/.env, (like .env.example)
6. setup nginx for your page dist directory
7. npm run page dev
