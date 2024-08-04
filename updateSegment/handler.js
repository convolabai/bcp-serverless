'use strict';
const axios = require('axios')
const FormData = require('form-data');
const fs = require('fs')

// let username = process.env.USERNAME
// let password = process.env.PASSWORD
// let clientId = process.env.CLIENTID
// const cloud = process.env.CLOUDURL

let username = "bangchakcc-dev@amitysolutions.com"
let password = "1qazZAQ!"
let clientId = "1cgb3gg81l348m66f06251nv7d"
const cloud = "amitysolutions.com"

module.exports.updateSegment = async (event) => {
  console.log("event: ", event);
  const rawData = event.body;

  const jsonRawData = JSON.parse(rawData);

  //decode part
  // const rawBody = jsonRawData.message.data;
  // const decodedData = Buffer.from(rawBody, 'base64').toString('utf-8');
  // const requestData = JSON.parse(decodedData);
  console.log("inbox event: ", JSON.stringify(jsonRawData));
  

// Data to be written to the CSV file
const data = [
    ['UUID/user info (custom field)'],
    ['6625f167274cfd43b9ca3e50']
];

// Name of the CSV file
const filename = 'example.csv';

// Convert data array to CSV format
const csvData = data.map(row => row.join(','));

console.log(csvData);

// Write to the CSV file
fs.writeFile(filename, csvData.join('\n'), err => {
    if(err) {
      console.log(err);
    }
    console.log(`Report file '${filename}' created successfully.`);

})

// Path to the file
const filePath = 'postman-cloud:///1ef03b5f-5acc-4840-bb78-fdf10a982152';
// const filePath = filename;

// Construct form-data
const formData = new FormData();

// Append the file to form-data
formData.append('file', fs.createReadStream(filePath));

// node.warn(fs.createReadStream(filePath))

// Append other fields if needed
// formData.append('otherField', 'otherValue');

// const formData = {
//     'file': {
//       'value': fs.createReadStream(filePath),
//       'options': {
//         'filename': filePath,
//         'contentType': null
//       }
//     }
//   }
  
// formData.append('file', fs.createReadStream(filePath));


// Set payload to form-data

let respond = await deleteSegment();
console.log("respond : ",respond);

let respond2 = await deleteSegment2();
console.log("respond2 : ",respond2);

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
      'Authorization': `  ${tokenId}`
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

async function deleteSegment() {
  let tokenId = await getToken();
  let data = new FormData();
  data.append('file', fs.createReadStream('postman-cloud:///1ef03b5f-5acc-4840-bb78-fdf10a982152'));

  console.log("tokenId : ",tokenId);

  let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://campaign.amitysolutions.com/api/v1/segments/upload/6628dfeae079922f5853bcf8/delete',
  headers: { 
    'Authorization': `Bearer ${tokenId}`,
    ...data.getHeaders()
  },
  data : data
};
  try {
    let res = await axios.request(config);
    console.log(JSON.stringify(res));
    return res
  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }

}

async function deleteSegment2() {
  let tokenId = await getToken();
//   const axios = require('axios');
// const FormData = require('form-data');
// const fs = require('fs');
// let data = new FormData();
// data.append('file', fs.createReadStream('postman-cloud:///1ef03b5f-5acc-4840-bb78-fdf10a982152'));

const data = [
  ['UUID/user info (custom field)'],
  ['6625f167274cfd43b9ca3e50']
];

// Name of the CSV file
const filename = 'example.csv';

// Convert data array to CSV format
const csvData = data.map(row => row.join(','));

console.log(csvData);

// Write to the CSV file
fs.writeFile(filename, csvData.join('\n'), err => {
  if(err) {
    console.log(err);
  }
  console.log(`Report file '${filename}' created successfully.`);

})

// Path to the file
const filePath = 'postman-cloud:///1ef03b5f-5acc-4840-bb78-fdf10a982152';
// const filePath = filename;

// Construct form-data
const formData = new FormData();

// Append the file to form-data
formData.append('file', fs.createReadStream(filePath));

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://campaign.amitysolutions.com/api/v1/segments/upload/6628dfeae079922f5853bcf8/delete',
  headers: { 
    'Authorization': `Bearer ${tokenId}`
    // ...data.getHeaders()
  },
  data : formData
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
  return response;
})
.catch((error) => {
  console.log(error);
  return error;
});

}
