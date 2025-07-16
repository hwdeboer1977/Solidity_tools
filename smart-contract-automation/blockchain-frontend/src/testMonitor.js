// We cant fetch the monitor data from the browser
// Also, server.js not working
// See documentation:    https://api-docs.defender.openzeppelin.com/#get-actions-runs-2
// And:                  https://docs.openzeppelin.com/defender/module/actions

const { Defender } = require("@openzeppelin/defender-sdk");

const dotenv = require("dotenv");

dotenv.config();

const DEFENDER_MONITOR_KEY = process.env.DEFENDER_MONITOR_KEY;
const DEFENDER_MONITOR_SECRET = process.env.DEFENDER_MONITOR_SECRET;

const creds = {
  apiKey: DEFENDER_MONITOR_KEY,
  apiSecret: DEFENDER_MONITOR_SECRET,
};

const client = new Defender(creds);

async function main() {
  //const result = await client.monitor.listBlockwatchers();
  const result = await client.monitor.list();
  console.log(result);

  //Monitor ID: 48e8b373-d102-46a3-af20-12654ef677f2
  const monitorId = "48e8b373-d102-46a3-af20-12654ef677f2";
  //const monitorId = await result.monitorId;
  //console.log(monitorId);

  const result2 = await client.monitor.get(monitorId);
  console.log(result2);

  console.log("Monitor ID:" + result2.monitorId);
  console.log("Network: " + result2.network);
  console.log("Monitor Name: " + result2.name);

  const notifyConfig = result2.notifyConfig;
  console.log(notifyConfig);

  // Accessing the notifyConfig fields
  const messageBody = notifyConfig.messageBody; // The full template string
  const messageSubject = notifyConfig.messageSubject; // '[Alert] OpenZeppelin Defender Monitor UniswapV2Swap'
  const notifications = notifyConfig.notifications; // The array, [Object] (you'd need to access it further)
  const timeoutMs = notifyConfig.timeoutMs; // 0

  console.log(notifyConfig.messageBody.timestamp);

  // If you want to programmatically access the data, you can set up a webhook
  // that sends the event data to your server or another endpoint.
  // The webhook will contain the formatted notification message with all the information replaced.
}

main();

// exports.handler = async function (payload) {
//   const conditionRequest = payload.request.body;
//   const matches = [];
//   const events = conditionRequest.events;
//   for (const evt of events) {
//     // add custom logic for matching here

//     // metadata can be any JSON-marshalable object (or undefined)
//     matches.push({
//       hash: evt.hash,
//       metadata: {
//         id: "customId",
//         timestamp: new Date().getTime(),
//         numberVal: 5,
//         nested: { example: { here: true } },
//       },
//     });
//   }
//   return { matches };
// };
