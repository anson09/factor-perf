#!/usr/bin/env zx

const { name, version } = require("../package.json");

const pkg = `${name}@${version}~${new Date()
    .toLocaleString("en-US", { hour12: false })
    .replace(", ", "T")
    .replaceAll("/", "-")}`,
  tarball = `${name}-${version}.tgz`;

const host = "172.30.0.2",
  ssh_port = "22",
  remote_user = "rice",
  remote_path = "/build/snapshot/";

await $`npm pack`;

await $`time rsync -aczvh --stats --delete -e "ssh -p ${ssh_port}" ${tarball} ${remote_user}@${host}:${remote_path}`;

const workflow = [
  `set -euxo pipefail`,
  `cd ${remote_path}`,
  `tar -xzf ${tarball}`,
  `rm ${tarball}`,
  `mv package ${pkg}`,
  `cd ${pkg}`,
  `npm install`,
  `pm2 delete all || true`,
  `npm run start`,
  `pm2 save`,
  `cd ..`,
  `ls -1rt | head -n -3 | xargs rm -rf`,
];

await $`ssh -p ${ssh_port} ${remote_user}@${host} ${workflow.join(";")}`;
