/* eslint-disable no-console */
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getSlackEvent = event => ({
  slack: JSON.parse(event.body)
});

const respond = callback => (event) => {
  const response = { statusCode: 200 };
  if (event.slack.type === 'url_verification') {
    response.body = event.slack.challenge;
  }
  callback(null, response);
  return event;
};

const verifyToken = (event) => {
  if (event.slack.token !== process.env.VERIFICATION_TOKEN) {
    throw new Error('Invalid token');
  }
  return event;
}

const getTeam = (event) => {
  const params = {
    TableName: process.env.TEAMS_TABLE,
    Key: {
      team_id: event.slack.team_id,
    },
  };
  console.log('dynamodb.get', params);
  return dynamodb.get(params)
    .promise()
    .then(data => Object.assign(event, { team: data.Item }));
};

module.exports.handler = (event, context, callback) => Promise.resolve(event)
    .then(getSlackEvent)
    .then(respond(callback))
    .then(verifyToken)
    .then(getTeam)
    .catch(callback);
