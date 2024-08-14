'use strict';
require('dotenv').config();
const AWS = require('aws-sdk');
const axios = require('axios');

// const username = process.env.username
// const password = process.env.password
// const clientId = process.env.clientId
// const cloud = process.env.cloud
// const cognito = process.env.cognito
// const sfDomain = process.env.sfDomain
// const sfClientId = process.env.sfClientId
// const sfClientSecret = process.env.sfClientSecret
// const sfUserName = process.env.sfUserName
// const sfPassword = process.env.sfPassword
// const sfChannelId = process.env.sfChannelId
// const line_token = process.env.line_token
// const line_domain = process.env.line_domain
// const s3Bucket = process.env.s3Bucket
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
const line_token = '7lMwHQOUUj5A5OSnRSRfxGs5ERkBixZA6XXbFF7rmLeuSyquojlgkF+dJoIyYZxsj6G8jXTUo7KP61CHa0g4mzx2CZXxp0yXtiDRBdILMXBs8EGjMysKeRZw9QTzx9uNI5bpMQupEYlpf+7Q1+8ucwdB04t89/1O/w1cDnyilFU=';
const line_domain = 'https://api-data.line.me/v2/bot/message';
const s3Bucket = 'deposit-files';
const aws_key = process.env.aws_key
const aws_secret = process.env.aws_secret

let fileType;

AWS.config.update({
  accessKeyId: aws_key,
  secretAccessKey: aws_secret,
  region: 'ap-southeast-1',
});

module.exports.inboxMessage = async (event) => {

  console.log("event: ", event);
  const rawData = event.body;
  // console.log(rawData)

  const jsonRawData = JSON.parse(rawData);
  console.log('jsonRawData : ', jsonRawData)
  //decode part
  const rawBody = jsonRawData.message.data;
  const decodedData = Buffer.from(rawBody, 'base64').toString('utf-8');
  const requestData = JSON.parse(decodedData);
  console.log("inbox event: ", JSON.stringify(requestData));


  let isCheckMessage = requestData?.message ? requestData.message : requestData?.type ? requestData : false;
  console.log('isCheckMessage : ', isCheckMessage)
  if (requestData?.type === "follow" || requestData?.payload === "") {
    let credential = await access_credential()
    console.log('credential : ', credential)
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
    let img_url = ''
    if (isCheckMessage.type !== "text" && isCheckMessage.type !== 'postback') {
      let credential = await access_credential()
      const config = {
        method: 'post',
        url: `https://chatbot.${cloud}/api/v1/messages/action`,
        data: {
          channelId: jsonRawData?.message?.attributes?.channelId,
          userId: requestData?.source?.userId ? requestData?.source?.userId : requestData.userId,
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
        console.log("Fail action success !!!")
      } catch (error) {
        console.log("Fail !!!")
      }

      if (isCheckMessage.type !== "text" && isCheckMessage.type !== 'sticker' && requestData?.type !== 'postback') {
        let configUpload = {}
        if (jsonRawData?.message?.attributes?.channelId === '65eec63a33071c0231bdc094') {
          configUpload = {
            method: 'GET',
            url: requestData?.url,
            responseType: 'arraybuffer', // Ensure the response is returned as a binary buffer
          };

        } else {
          configUpload = {
            method: 'GET',
            url: `${line_domain}/${requestData?.message?.id}/content`,
            headers: {
              'Authorization': `Bearer ${line_token}`,
            },
            responseType: 'arraybuffer', // Ensure the response is returned as a binary buffer
          };
        }

        try {
          const response = await axios.request(configUpload);
          console.log('Image message fetched successfully!');

          // Dynamically import fileType
          if (!fileType) {
            const module = await import('file-type');
            fileType = module.default || module; // Handle ES Module default export
          }

          // Get the file type using the imported function
          const file_type = await fileType.fileTypeFromBuffer(response.data);

          // Generate a file name
          const fileName = `image_${Date.now()}.${file_type.ext}`;

          // Upload to S3
          const uploadResult = await uploadToS3(response.data, fileName, file_type.mime);

          if (uploadResult) {
            console.log('Image uploaded to S3 successfully!', uploadResult.file_url);
            // return uploadResult.file_url;

            img_url = uploadResult.file_url
          } else {
            console.error('Image upload to S3 failed!');
          }

        } catch (error) {
          console.error('Image message fetch failed!', error);
        }

      }




    }


    let userId = jsonRawData.message?.attributes?.channelId === "2004036487" ? requestData?.source?.userId : requestData?.userId

    const currentDate = new Date();
    const timestampInSeconds = Math.floor(currentDate.getTime() / 1000);
    const isoString = currentDate.toISOString();
    console.log(timestampInSeconds)
    console.log(isoString)

    const info = await userInfo(userId)

    let bodyConfig = {}

    if (jsonRawData.message?.attributes?.channelId === "2004036487") {
      console.log('isCheckMessage.type : ', isCheckMessage.type)
      console.log('user info : ', info)
      let messageToSF = ''
      let typeSF = ''
      if(isCheckMessage.type === 'text'){
        typeSF = 'TEXT'
        messageToSF = isCheckMessage.text
      }else if(isCheckMessage.type === 'postback'){
        typeSF = 'TEXT'
        messageToSF = isCheckMessage.postback.data
      }else if(isCheckMessage.type === 'image'){
        typeSF = 'IMG'
        messageToSF = img_url
      }else if(isCheckMessage.type === 'video'){
        typeSF = 'VIDEO'
        messageToSF = img_url
      }else if(isCheckMessage.type === 'sticker'){
        typeSF = 'STICKER'
        messageToSF = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${requestData.message.stickerId}/android/sticker.png`
      }
     

      bodyConfig = {
        "contents": [ {
          "type": typeSF,
          "message": messageToSF
        } ],
        "channelType": "LINE",
        "senderType": "USER",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": jsonRawData.message?.attributes?.channelId,
        "users": [
          {
            "displayName": info.displayName,
            "imageUrl": info.imageUrl,
            "status": "Active",
            "userId": userId
          } ]
      }
      console.log(bodyConfig.contents)
      console.log(bodyConfig.users)
    } else {
      console.log('webChat')

      bodyConfig = {
        "contents": [ {
          "type": requestData?.type === 'text' ? "TEXT" : requestData?.type === 'image' ? "IMG" : requestData?.type === 'video' ? "VIDEO" : "STICKER",
          "message": requestData?.type === 'text' ? requestData?.payload : requestData?.type === 'image' ? img_url : requestData?.payload
        } ],
        "channelType": "WEBCHAT",
        "senderType": "USER",
        "CreatedAt": timestampInSeconds,
        "CreateDateTime": isoString,
        "ChannelId": jsonRawData.message?.attributes?.channelId,
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




  };

}


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
    url: cognito,
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
  console.log('tokenId : ', tokenId)
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

const uploadToS3 = async (fileBody, fileName, contentType) => {
  try {
    const s3key = `${process.env.S3_FOLDER_NAME ? process.env.S3_FOLDER_NAME + '/' : ''}${fileName}`;

    const s3Option = {
      Bucket: s3Bucket,
      Key: s3key,
      Body: Buffer.from(fileBody),
      ContentType: contentType,
      ACL: 'public-read',
    };

    const s3 = new AWS.S3();
    const s3result = await s3.upload(s3Option).promise();
    return {
      // file_url: encodeURI(`https://${s3Option.Bucket}/${s3key}`),
      file_url: encodeURI(`https://${s3Option.Bucket}.s3.ap-southeast-1.amazonaws.com/${s3key}`),
      file_name: fileName,
    };
  } catch (err) {
    console.error('uploadToS3 Error: ', err);
    return false;
  }
};