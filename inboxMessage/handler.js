'use strict';
const axios = require('axios')

// let username = process.env.USERNAME
// let password = process.env.PASSWORD
// let clientId = process.env.CLIENTID
// const cloud = process.env.CLOUDURL

let username = "bangchakcc-dev@amitysolutions.com"
let password = "1qazZAQ!"
let clientId = "1cgb3gg81l348m66f06251nv7d"
const cloud = "amitysolutions.com"

module.exports.inboxMessage = async (event) => {
  console.log("event: ", event);
  const rawData = event.body;

  const jsonRawData = JSON.parse(rawData);

  //decode part
  const rawBody = jsonRawData.message.data;
  const decodedData = Buffer.from(rawBody, 'base64').toString('utf-8');
  const requestData = JSON.parse(decodedData);
  console.log("inbox event: ", JSON.stringify(requestData));

  let isCheckMessage = requestData.message ? requestData.message : false

  if (requestData.type == "follow") {
    let credential = await access_credential()

    const config = {
      method: 'post',
      url: `https://chatbot.${cloud}/api/v1/messages/action`,
      data: {
        channelId: jsonRawData.message.attributes.channelId,
        userId: requestData.source.userId,
        action: {
          action: 'greeting_template' // template name
        }
      },
      headers: {
        'x-api-key': credential.apiKey,
        'Content-Type': 'application/json'
      }
    }
    console.log(JSON.stringify(config))

    try {
      const res = await axios.request(config)
      console.log(`greeting ${requestData.source.userId} sucess!!`)

    } catch (error) {
      console.log("Cant send greeting message!!!")
    }
  }

  else if (isCheckMessage) {

    if (requestData.message.type != "text") {
      let credential = await access_credential()

      const config = {
        method: 'post',
        url: `https://chatbot.${cloud}/api/v1/messages/action`,
        data: {
          channelId: jsonRawData.message.attributes.channelId,
          userId: requestData.source.userId,
          action: {
            action: 'fail_template' // template name
            // action: '@8fD78yTr4K99D77z9MGe/fail_flow' // template name
          }
        },
        headers: {
          'x-api-key': credential.apiKey,
          'Content-Type': 'application/json'
        }
      }
      console.log(JSON.stringify(config))

      try {
        const res = await axios.request(config)
        console.log(`Image message ${requestData.source.userId} sucess!!`)

      } catch (error) {
        console.log("Image message Fail !!!")
      }
    }
  }

  return {
    statusCode: 200,
  };
};

async function getToken() {
  const body = {
    "AuthParameters": {
      "USERNAME": username,
      "PASSWORD": password
    },
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": clientId
  }

  let config = {
    method: 'post',
    url: 'https://cognito-idp.ap-southeast-1.amazonaws.com/',
    headers: {
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      'Content-Type': 'application/x-amz-json-1.1'
    },

    data: body
  }

  try {
    let res = await axios.request(config);
    return res.data.AuthenticationResult.IdToken
  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }
}

async function getNetworkId() {
  let tokenId = await getToken();
  let config = {
    method: 'get',
    url: `https://cim.${cloud}/api/v1/channels`,
    headers: {
      'Authorization': `Bearer ${tokenId}`
    }
  }

  try {
    let res = await axios.request(config);
    let networkId = res.data[0].networkId
    return {
      tokenId,
      networkId
    }
  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }
}

async function access_credential() {
  let access_credential = await getNetworkId();

  let tokenId = access_credential.tokenId;
  let networkId = access_credential.networkId;
  let config = {
    method: 'get',
    url: `https://cim.${cloud}/api/v1/networks/${networkId}`,
    headers: {
      'Authorization': `Bearer ${tokenId}`
    }
  }
  try {
    let res = await axios.request(config);
    let apiKey = res.data.apiKey;
    let flowEngine = res.data.config.flowEngines
    return {
      tokenId,
      networkId,
      apiKey,
      flowEngine,
    }

  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }
}
