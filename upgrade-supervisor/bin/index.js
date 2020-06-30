#!/usr/bin/env node

const fs = require('fs');
const yargs = require('yargs');

const getSdk = require('balena-sdk');
const balena = getSdk({
  apiUrl: "https://api.balena-staging.com/"
});

const options = yargs
      .usage("Usage: -u [uuid of device] -a [application]")
      .option("u", {alias: "uuid",
		    describe: "UUID of device",
		    type: "string",
		    demandOption: true})
      .option("a", {alias: "application",
		    describe: "Application name",
		    type: "string",
		    demandOption: true})
      .argv;

var personalToken = fs.readFileSync('/home/hugh/.balena/token.staging', 'utf8');

balena.auth.loginWithToken(personalToken, function(error) {
  if (error) throw error;
})

balena.auth.whoami()
  .then(username => {
    if(username) {
      console.log("I am", username);
    } else {
      console.log("I am nobody? I guess?")
    }
  });


// FIXME: Actually, we just grab a hardcoded version
async function listSupervisorReleases() {
  return await balena.request.send({url: "https://api.balena-staging.com/v5/supervisor_release?$filter=device_type%20eq%20'intel-nuc'"})
    .then( data => {
      // note implicit assumption that there will be one-and-only-one result
      var result = data.body.d.filter(function (release) { return release.supervisor_version === "v10.8.0"; });
      return result[0];
    });
}

async function setSupervisorRelease(id) {
  // # Set supervisor version
  // PATCH :my-url/v5/device?$filter=uuid%20eq%20':my-uuid'
  // :my-auth

  // {"should_be_managed_by__supervisor_release": "6175"}

  console.log(id);
  // For doc on this, see github.com/balena-io/balena-sdk/typings/balena-request.d.ts
  await balena.request.send({
    url: `https://api.balena-staging.com/v5/device?filter=uuid%20eq%20'${myDevice}'`,
    method: "PATCH",
    // Doesn't work: "`${id}` -- Request error: Expected an ID for the supervisor_release
    body: {"should_be_managed_by__supervisor_release": `${id}`}

  }).then(resp => {
    console.log(resp);
    balena.models.device.update(myDevice, {
      force: true
    })},
	  fail => {
	    console.log(fail);
	  });
};

balena.models.device.getSupportedDeviceTypes().then(function(supportedDeviceTypes) {
    supportedDeviceTypes.forEach(function(supportedDeviceType) {
        console.log('Balena supports:', supportedDeviceType);
    });
});

balena.models.device.get(myDevice)
  .then(device => {
    console.log(device);
})

listSupervisorReleases()
  .then(release => {
    console.log(release);
    setSupervisorRelease(release.id);
  });

// subscribeToLogs(myApplication)
//   .then(logs => {
//     getDeviceServicesIds(myDevice).then(data => allServiceIds = data);
//     logs.on('line', function(line){
//       logutil.dispatch(line, allServiceIds);
//     })
//   });