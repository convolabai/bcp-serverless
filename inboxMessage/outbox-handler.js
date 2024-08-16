'use strict';
const axios = require('axios')
require('dotenv').config();

const username = process.env.userAmity
const password = process.env.passwordAmity
const clientId = process.env.clientId
const cloud = process.env.cloud
const cognito = process.env.cognito
const sfDomain = process.env.sfDomain
const sfClientId = process.env.sfClientId
const sfClientSecret = process.env.sfClientSecret
const sfUserName = process.env.sfUserName
const sfPassword = process.env.sfPassword


module.exports.outboxMessage = async (event) => {
  const rawData = event.body;
  const jsonRawData = JSON.parse(rawData);
  console.log('jsonRawData : ', jsonRawData)
  //decode part
  const rawBody = jsonRawData.message.data;
  const decodedData = Buffer.from(rawBody, 'base64').toString('utf-8');
  const requestData = JSON.parse(decodedData);
  console.log("outboxMessage event: ", JSON.stringify(requestData));

  const transformedData = {
    contents: requestData.payload.map(item => {
      if (item.type === 'image') {
        return {
          type: 'IMG',
          message: item.originalContentUrl
        };
      } else if (item.type === 'text') {
        return {
          type: 'TEXT',
          message: item.text
        };
      } else if (item.type === 'template') {
        return {
          type: 'TEXT',
          message: item.template.text
        };
      }
    })
  };

  console.log('transformedData : ', transformedData)

  const currentDate = new Date();
  const timestampInSeconds = Math.floor(currentDate.getTime() / 1000);
  const isoString = currentDate.toISOString();

  let bodyConfig = {}
  const info = await userInfo(requestData.userId)
  if (info.metadata.ticket_status === 'close') {
    if (requestData.type === "LINE") {
      console.log('user info : ', info)

      bodyConfig = {
        "contents": transformedData.contents,
        "channelType": "LINE",
        "senderType": "BOT",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": requestData.channelId,
        "users": [
          {
            "displayName": info.displayName,
            "imageUrl": info.imageUrl,
            "status": "Active",
            "userId": requestData.userId
          } ]
      }
      console.log(new Date())
    } else {
      console.log('webChat')
      console.log('user info : ', info)

      bodyConfig = {
        "contents": transformedData.contents,
        "channelType": "WEBCHAT",
        "senderType": "BOT",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": requestData.channelId,
        "users": [
          {
            "displayName": requestData.userId,
            "imageUrl": "",
            "status": "Active",
            "userId": requestData.userId
          } ]
      }
    }
  }

  try {
    const token_sf = await getSFToken()
    await sendHistory(token_sf, bodyConfig)
  } catch (error) {
    console.log("Error status: ", error)
  }


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
    url: `${cognito}`,
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


async function userInfo(userId) {
  let tokenId = await getToken();
  let config = {
    method: 'GET',
    url: `https://campaign.${cloud}/api/v1/audience?keyword=${userId}`,
    headers: {
      'Authorization': `Bearer ${tokenId}`
    }
  }

  try {
    let res = await axios.request(config);
    console.log('info : ', res.data[ 0 ].info)
    return res.data[ 0 ].info
  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }
}

async function getSFToken() {
  let config = {
    method: 'POST',
    url: `${sfDomain}/services/oauth2/token?grant_type=password&client_id=${sfClientId}&client_secret=${sfClientSecret}&username=${sfUserName}&password=${sfPassword}`,

  }

  try {
    let res = await axios.request(config);
    let tokenSF = `${res.data.token_type} ${res.data.access_token}`
    return tokenSF
  } catch (error) {
    console.log("Error status: ", error.data)
  }
}

async function sendHistory(token_sf, bodyConfig) {


  let config = {
    method: 'post',
    url: `${sfDomain}/services/apexrest/api/ChatMessagingService/message/send`,
    headers: {
      'Authorization': token_sf,
      'Content-Type': 'application/json'
    },

    data: bodyConfig
  }
  console.log('config >> ', config)
  try {
    const send = await axios.request(config);
    console.log("send: ", send.data)
  } catch (error) {
    console.log("Error status: ", error)
  }
}