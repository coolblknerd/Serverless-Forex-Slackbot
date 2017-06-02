/* eslint-disable no-console */
const qs = require('querystring');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getCode = (event) => {
  var code = null;
  if (event.queryStringParameters && event.queryStringParameters.code) {
    code = event.queryStringParameters.code;
  }
  return code;
};

const requestToken = (code) => {
  console.log(`Requesting token with ${code}`);
  if (code === null) { return null; } // Skip if triggered without code
  const params = {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code,
  };
  const url = `https://slack.com/api/oauth.access?${qs.stringify(params)}`;
  console.log(`Fetching ${url}`);
  return fetch(url)
    .then(response => response.json()) // Convert response to JSON
    .then((json) => {
      if (json.ok) return json; // Verify is valid JSON
      throw new Error('SlackAPIError');
    });
};

const saveResponse = (response) => {
  const params = {
    TableName: process.env.TEAMS_TABLE,
    Item: response,
  };
  console.log('Put', params);
  return dynamodb.put(params).promise();
};

const successResponse = callback => callback(null, {
  statusCode: 302,
  headers: { Location: process.env.SUCCESS_URL },
});

const errorResponse = (error, callback) => {
  console.error(error);
  return callback(null, {
    statusCode: 302,
    headers: { Location: process.env.ERROR_URL },
  });
};

module.exports.handler = (event, context, callback) =>
  Promise.resolve(event)
    .then(getCode)
    .then(requestToken)
    .then(saveResponse)
    .then(() => successResponse(callback))
    .catch(error => errorResponse(error, callback));
