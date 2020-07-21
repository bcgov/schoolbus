"use strict";
const options = require("@bcgov/pipeline-cli").Util.parseArguments();

const changeId = options.pr; //aka pull-request
const version = "1.4.0";
const name = "sbi"; //project name prefix

const phases = {
  build: {
    namespace: "tran-schoolbus-tools",
    name: `${name}`,
    phase: "build",
    changeId: changeId,
    suffix: `-build-${changeId}`,
    instance: `${name}-build-${changeId}`,
    version: `${version}-${changeId}`,
    tag: `build-${version}-${changeId}`,
    transient: true,
  },
  dev: {
    namespace: "tran-schoolbus-dev",
    name: `${name}`,
    phase: "dev",
    changeId: changeId,
    suffix: `-dev-${changeId}`,
    instance: `${name}-dev-${changeId}`,
    version: `${version}-${changeId}`,
    tag: `dev-${version}-${changeId}`,
    host: `cerberus-${changeId}-tran-schoolbus-dev.pathfinder.gov.bc.ca`,
    dotnet_env: "Development",
    dbUser: "userUXN",
    dbSize: "1Gi",
    transient: true,
  },
  test: {
    namespace: "tran-schoolbus-test",
    name: `${name}`,
    phase: "test",
    changeId: changeId,
    suffix: `-test`,
    instance: `${name}-test`,
    version: `${version}`,
    tag: `test-${version}`,
    host: `cerberus-tran-schoolbus-tst.pathfinder.gov.bc.ca`,
    dbUser: "user7KU",
    dbSize: "1Gi",
    dotnet_env: "Staging",
  },
  prod: {
    namespace: "tran-schoolbus-prod",
    name: `${name}`,
    phase: "prod",
    changeId: changeId,
    suffix: `-prod`,
    instance: `${name}-prod`,
    version: `${version}`,
    tag: `prod-${version}`,
    host: `cerberus-tran-schoolbus-prd.pathfinder.gov.bc.ca`,
    dbUser: "userKIX",
    dbSize: "50Gi",
    dotnet_env: "Production",
  },
};

// This callback forces the node process to exit as failure.
process.on("unhandledRejection", (reason) => {
  console.log(reason);
  process.exit(1);
});

module.exports = exports = { phases, options };
