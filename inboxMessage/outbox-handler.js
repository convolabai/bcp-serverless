'use strict';
const axios = require('axios')

let username = "bangchakcc-dev@amitysolutions.com"
let password = "1qazZAQ!"
let clientId = "1cgb3gg81l348m66f06251nv7d"
const cloud = "amitysolutions.com"

module.exports.outboxMessage = async (event) => {
  console.log("event: ", event);
  const rawData = event.body;
  console.log(rawData)

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
          url: item.originalContentUrl
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

  console.log('transformedData : ',transformedData)

  const currentDate = new Date();
  const timestampInSeconds = Math.floor(currentDate.getTime() / 1000);
  const isoString = currentDate.toISOString();
  console.log(timestampInSeconds)
  console.log(isoString)


  let bodyConfig = {}
  if (requestData.type === "LINE") {
    const info = await userInfo(requestData.userId)
    console.log('user info : ', info)

    bodyConfig = {
      "contents":  transformedData.contents ,
      "channelType": "LINE",
      "senderType": "BOT",
      "CreatedAt": timestampInSeconds,
      "CreateDateTime": isoString,
      "ChannelId": "123456789",
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
    const info = await userInfo(requestData.userId)
    console.log('user info : ', info)

    bodyConfig = {
      "contents":  transformedData.contents ,
      "channelType": "WEBCHAT",
      "senderType": "BOT",
      "CreatedAt": timestampInSeconds,
      "CreateDateTime": isoString,
      "ChannelId": "123456789",
      "users": [
        {
          "displayName": "",
          "imageUrl": "",
          "status": "Active",
          "userId": requestData.userId
        } ]
    }
  }

  try {
    console.log('bodyConfig users: ', bodyConfig.users)
    console.log('bodyConfig c  : ', bodyConfig.contents)
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
    let networkId = res.data[ 0 ].networkId
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

async function userInfo(userId) {
  let tokenId = await getToken();
  let config = {
    method: 'GET',
    url: `https://campaign.amitysolutions.com/api/v1/audience?keyword=${userId}`,
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
    url: `https://bangchakcorporation2--partial.sandbox.my.salesforce.com/services/oauth2/token?grant_type=password&client_id=3MVG9Po2PmyYruukeqcsVqYm7PEKuBTwUxAlq_USHWT_uHQDkA3RqcdAQv.zKwyaJREe8tkl93TOwcvOXWkmc&client_secret=844D0505D984934725CE1DD4281069C08236B2DB979D8D2CB6AFBEFA1108337E&username=crmadmin1@bangchak.co.th.partial&password=crm@dmin2021uinCClvzcNK1R4xdzOeCUJ3L`,

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
    url: 'https://bangchakcorporation2--partial.sandbox.my.salesforce.com/services/apexrest/api/ChatMessagingService/message/send',
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