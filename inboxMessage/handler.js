'use strict';
const axios = require('axios')

const username = "bangchakcc-dev@amitysolutions.com"
const password = "1qazZAQ!"
const clientId = "1cgb3gg81l348m66f06251nv7d"
const cloud = "amitysolutions.com"
const cognito = 'https://cognito-idp.ap-southeast-1.amazonaws.com/'
const sfDomain = 'https://bangchakcorporation2--partial.sandbox.my.salesforce.com'
const sfClientId = '3MVG9Po2PmyYruukeqcsVqYm7PEKuBTwUxAlq_USHWT_uHQDkA3RqcdAQv.zKwyaJREe8tkl93TOwcvOXWkmc'
const sfClientSecret = '844D0505D984934725CE1DD4281069C08236B2DB979D8D2CB6AFBEFA1108337E'
const sfUserName = 'crmadmin1@bangchak.co.th.partial'
const sfPassword = 'crm@dmin2021uinCClvzcNK1R4xdzOeCUJ3L'
const sfChannelId = '123456789'

module.exports.inboxMessage = async (event) => {
  const rawData = event.body;
  const jsonRawData = JSON.parse(rawData);
  console.log('jsonRawData : ', jsonRawData)
  //decode part
  const rawBody = jsonRawData.message.data;
  const decodedData = Buffer.from(rawBody, 'base64').toString('utf-8');
  const requestData = JSON.parse(decodedData);
  console.log("inbox event: ", JSON.stringify(requestData));

  let isCheckMessage = requestData?.message ? requestData.message : false
  if (requestData?.type === "follow" || requestData?.payload === "") {
    let credential = await access_credential()
    let uid = requestData?.source?.userId ? requestData.source?.userId : requestData.userId
    const config = {
      method: 'post',
      url: `https://chatbot.${cloud}/api/v1/messages/action`,
      data: {
        channelId: jsonRawData?.message?.attributes?.channelId ? jsonRawData?.message?.attributes?.channelId : requestData.channelId,
        userId: uid,
        action: {
          action: `@${credential.flowEngine[ 1 ].flowEngineId}/${uid.startsWith('U') ? "get_start_line" : "get_start_webchat"}` // template name
        }
      },
      headers: {
        'x-api-key': credential.apiKey,
        'Content-Type': 'application/json'
      }
    }
    console.log(JSON.stringify(config))

    try {
      await axios.request(config)
      console.log(`greeting ${requestData.source.userId} sucess!!`)

    } catch (error) {
      console.log("Cant send greeting message!!!")
    }
  } else if (isCheckMessage) {

    if (requestData.message.type !== "text") {
      let credential = await access_credential()

      const config = {
        method: 'post',
        url: `https://chatbot.${cloud}/api/v1/messages/action`,
        data: {
          channelId: jsonRawData.message.attributes.channelId,
          userId: requestData.source.userId,
          action: {
            action: `@${credential.flowEngine[ 1 ].flowEngineId}/fail_template`
          }
        },
        headers: {
          'x-api-key': credential.apiKey,
          'Content-Type': 'application/json'
        }
      }
      console.log(JSON.stringify(config))

      try {
        await axios.request(config)
        console.log(`Image message ${requestData.source.userId} sucess!!`)

      } catch (error) {
        console.log("Image message Fail !!!")
      }


    }

    let userId = jsonRawData.message?.attributes?.channelId === "2004036487" ? requestData?.source?.userId : requestData?.userId

    const currentDate = new Date();
    const timestampInSeconds = Math.floor(currentDate.getTime() / 1000);
    const isoString = currentDate.toISOString();

    let bodyConfig = {}
    if (jsonRawData.message?.attributes?.channelId === "2004036487") {
      const info = await userInfo(userId)
      console.log('user info : ', info)

      bodyConfig = {
        "contents": [ {
          "type": "TEXT",
          "message": requestData?.message?.text
        } ],
        "channelType": "LINE",
        "senderType": "USER",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": sfChannelId,
        "users": [
          {
            "displayName": info.displayName,
            "imageUrl": info.imageUrl,
            "status": "Active",
            "userId": userId
          } ]
      }
      
    } else {
      console.log('webChat')
      const info = await userInfo(userId)
      console.log('user info : ', info)

      bodyConfig = {
        "contents": [ {
          "type": "TEXT",
          "message": requestData.payload
        } ],
        "channelType": "WEBCHAT",
        "senderType": "USER",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": sfChannelId,
        "users": [
          {
            "displayName": "",
            "imageUrl": "",
            "status": "Active",
            "userId": userId
          } ]
      }
    }


    try {
      const token_sf = await getSFToken()
      await sendHistory(token_sf, bodyConfig)
    } catch (error) {
      console.log("Error status: ", error)
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