'use strict';
const axios = require('axios')


module.exports.templateHook = async (event) => {
  console.log("event :", JSON.stringify(event))
  const rawBody = event.body
  const jsonBody = JSON.parse(rawBody);
  console.log("jsonBody :", JSON.stringify(jsonBody));
  let metadata = JSON.stringify(jsonBody.action.metadata?.data);
  const rawOutgoingMessage = jsonBody.outgoingMessage

  if (jsonBody.action.action === "oil_price_webchat") {
    console.log("match oil_price_webchat")
    try {

      console.log("rawOutgoingMessage :", JSON.stringify(rawOutgoingMessage));
      let oli_price_template = rawOutgoingMessage;
      let oli_price_template_message = oli_price_template.messages;

      console.log("oli_price_template_message :", JSON.stringify(oli_price_template_message));
      console.log("oli_price_template_message.contents :", JSON.stringify(oli_price_template_message[ 0 ].contents));
      console.log("oli_price_template_message[0].contents.body.contents.length :", oli_price_template_message[ 0 ].contents.body.contents.length);

      const oil_price_today = await getOilPrice();

      for (let i = 0; i < oli_price_template_message[ 0 ].contents.body.contents.length; i++) {
        console.log("item : ", oli_price_template_message[ 0 ].contents.body.contents[ i ].contents[ 1 ]?.text)
        if (oli_price_template_message[ 0 ].contents.body.contents[ i ].contents[ 1 ]?.text === "oil_price_" + (i - 1)) {
          console.log("HIT!!");

          oli_price_template_message[ 0 ].contents.body.contents[ i ].contents[ 1 ].text = JSON.stringify(oil_price_today[ i - 2 ].PriceToday);
        }
        else {
          console.log("NOT HIT!!");
        }
      }

      console.log("oil_price_today : ", oil_price_today);

      // oli_price_template_message[0].contents.body.contents[2].contents[1].text = "41.25";

      oli_price_template.messages = oli_price_template_message;


      ////////////////////////////
      const sendTemplate = {
        "outgoingMessage": oli_price_template,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Template ERROR : oil_price_webchat with ", error)
    }
  } else if (jsonBody.action.action === "gpt_answer_template") {
    console.log("match gpt_answer_template")
    try {

      console.log("rawOutgoingMessage :", JSON.stringify(rawOutgoingMessage));
      console.log("metadata :", metadata);
      let gpt_answer_template = rawOutgoingMessage;
      let gpt_answer_template_message = gpt_answer_template.messages;

      console.log("gpt_answer_template_message :", JSON.stringify(gpt_answer_template_message));

      // gpt_answer_template_message.text = JSON.stringify(metadata)
      // console.log("oli_price_template_message.contents :", JSON.stringify(oli_price_template_message[0].contents));
      // console.log("oli_price_template_message[0].contents.body.contents.length :", oli_price_template_message[0].contents.body.contents.length);


      // gpt_answer_template.messages[0].text = metadata.slice(1,metadata.length-1);
      gpt_answer_template.messages[ 0 ].text = metadata.slice(1, metadata.length - 1).replace(/\\n/g, '\n');


      // let newString = metadata.replace(/\\n/g, '\n');

      // console.log("gpt_answer_template :", JSON.stringify(newString));

      // gpt_answer_template.messages[0].text = newString


      console.log("gpt_answer_template :", JSON.stringify(gpt_answer_template));
      // console.log("gpt_answer_template_message :", JSON.stringify(gpt_answer_template_message));


      ////////////////////////////
      const sendTemplate = {
        "outgoingMessage": gpt_answer_template,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Template ERROR : gpt_answer_template with ", error)
    }
  } else if (jsonBody.action.action === "agent_message") {
    console.log("match agent_message")
    try {

      console.log("rawOutgoingMessage :", JSON.stringify(rawOutgoingMessage));
      console.log("metadata :", JSON.stringify(metadata));
      let agent_message_template = rawOutgoingMessage;
      let agent_message_template_message = agent_message_template.messages;

      console.log("agent_message_template_message :", JSON.stringify(agent_message_template_message));


      agent_message_template.messages[ 0 ].text = jsonBody.action.metadata?.custom_text

      console.log("agent_message_template :", JSON.stringify(agent_message_template));

      ////////////////////////////
      const sendTemplate = {
        "outgoingMessage": agent_message_template,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Template ERROR : agent_message_template with ", error)
    }


  } else if (jsonBody.action.action === "agent_img") {
    console.log("match agent_img")
    try {

      console.log("rawOutgoingMessage :", JSON.stringify(rawOutgoingMessage));
      console.log("metadata :", JSON.stringify(metadata));
      let agent_img_template = rawOutgoingMessage;
      let agent_img_template_message = agent_img_template.messages;

      console.log("agent_img_template_message :", JSON.stringify(agent_img_template_message));


      agent_img_template.messages[ 0 ].originalContentUrl = jsonBody.action.metadata?.custom_text
      agent_img_template.messages[ 0 ].previewImageUrl = jsonBody.action.metadata?.custom_text
      console.log("agent_img_template :", JSON.stringify(agent_img_template));

      ////////////////////////////
      const sendTemplate = {
        "outgoingMessage": agent_img_template,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Template ERROR : agent_img_template with ", error)
    }


  } else if (jsonBody.action.action === "agent_video") {
    console.log("match agent_video")
    try {

      console.log("rawOutgoingMessage :", JSON.stringify(rawOutgoingMessage));
      console.log("metadata :", JSON.stringify(metadata));
      let agent_video_template = rawOutgoingMessage;
      let agent_video_template_message = agent_video_template.messages;

      console.log("agent_video_template_message :", JSON.stringify(agent_video_template_message));


      agent_video_template.messages[ 0 ].originalContentUrl = jsonBody.action.metadata?.custom_text
      agent_video_template.messages[ 0 ].previewImageUrl = jsonBody.action.metadata?.custom_text
      
      console.log("agent_video_template :", JSON.stringify(agent_video_template));

      ////////////////////////////
      const sendTemplate = {
        "outgoingMessage": agent_video_template,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Template ERROR : agent_video_template with ", error)
    }


  }
  else {
    const sendTemplate = {
      "outgoingMessage": rawOutgoingMessage,
      "shouldContextualize": true
    }
    console.log("sendTemplate: ", JSON.stringify(sendTemplate))

    return {
      statusCode: 200,
      body: JSON.stringify(sendTemplate)
    }
  }
};

async function getOilPrice() {
  // const body = {
  //   "AuthParameters": {
  //     "USERNAME": username,
  //     "PASSWORD": password
  //   },
  //   "AuthFlow": "USER_PASSWORD_AUTH",
  //   "ClientId": clientId
  // }

  let config = {
    method: 'get',
    url: 'https://oil-price.bangchak.co.th/ApiOilPrice2'
    // headers: {
    //   'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    //   'Content-Type': 'application/x-amz-json-1.1'
    // },

    // data: body
  }

  try {
    let res = await axios.request(config);
    console.log("res : ", res.data);
    let data = res.data[ 0 ].OilList;
    let jsonData = JSON.parse(data);
    return jsonData;
  } catch (error) {
    console.log("Error status: ", error.statusCode)
  }
};
