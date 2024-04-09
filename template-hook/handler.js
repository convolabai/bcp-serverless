'use strict';
const TemplateFormatter = require("./template/index")
const Services = require("./services/index")
const Util = require("./util/index")

module.exports.templateHook = async (event) => {
  console.log("event :", JSON.stringify(event))
  const rawBody = event.body
  const jsonBody = JSON.parse(rawBody);
  console.log("jsonBody :", JSON.stringify(jsonBody));
  const rawOutgoingMessage = jsonBody.outgoingMessage
  const metadata = {
    unitId: jsonBody?.action?.metadata?.unit_id,
    branchId: jsonBody?.action?.metadata?.branch_id,
    language: jsonBody?.action?.metadata?.language,
    unitName: jsonBody?.action?.metadata?.unit_name,
    branchName: jsonBody?.action?.metadata?.branch_name,
    round: parseInt(jsonBody?.action?.metadata?.round)
  }

  if (jsonBody.action.action === "carousel_temp") {
    console.log("match carousel_temp")
    try {
      const getUnits = await Services.getUnits(jsonBody.action.metadata.language, jsonBody.action.metadata.branch_id, jsonBody.action.metadata.unit_id)
      console.log("getUnits with unit and branch response :", getUnits)
      if (getUnits.status !== 200) return
      console.log("getUnits response data :", getUnits.data)
      const data = {
        title: getUnits.data[0].unitname,
        text: Util.textDescFormatter(getUnits.data[0]),
        thumbnailImageUrl: getUnits.data[0].logo,
        phoneNo: getUnits.data[0].contact,
        uri: getUnits.data[0].lineurl,
      }
      let formatOutgoingMessage = TemplateFormatter.carouselAskShop(rawOutgoingMessage, data)
      console.log("formatOutgoingMessage :", formatOutgoingMessage)

      const sendTemplate = {
        "outgoingMessage": formatOutgoingMessage,
        "shouldContextualize": true
      }
      console.log("sendTemplate: ", JSON.stringify(sendTemplate))

      return {
        statusCode: 200,
        body: JSON.stringify(sendTemplate)
      }
    } catch (error) {
      console.log("Err : getUnit with unit and branch", error)
      try {
        const getUnits = await Services.getUnits(jsonBody.action.metadata.language, jsonBody.action.metadata.branch_id, undefined)
        console.log("getUnits with uinit id response :", getUnits)
        if (getUnits.status !== 200) return

        const datas = TemplateFormatter.datasFormatter(getUnits.data)
        console.log("datasFormatter :", datas.length, datas)

        // custom carousels
        const start = metadata.round == 10 ? 0 : metadata.round - 10
        const end = metadata.round
        console.log("start end :", start, "-->", end)
        let formatOutgoingMessage = TemplateFormatter.multiCarouselAskShop(rawOutgoingMessage, datas.slice(start, end), metadata)
        console.log("formatOutgoingMessage multiCarouselAskShop:", JSON.stringify(formatOutgoingMessage))

        // custom text fail flow
        if(metadata.round == 10){
          formatOutgoingMessage = TemplateFormatter.shopFlowFailShopTemplate(formatOutgoingMessage, jsonBody.action.metadata.unit_name, jsonBody.action.metadata.branch_name)
          console.log("formatOutgoingMessage shopFlowFailShopTemplate :", JSON.stringify(formatOutgoingMessage))
        }else {
          formatOutgoingMessage.messages.shift()
        }

        const sendTemplate = {
          "outgoingMessage": rawOutgoingMessage,
          "shouldContextualize": true
        }
        console.log("sendTemplate: ", JSON.stringify(sendTemplate))

        return {
          statusCode: 200,
          body: JSON.stringify(sendTemplate)
        }
      } catch (error) {
        console.log("Err : getUnit with uinit id", error)
      }
    }
  } else if (jsonBody.action.action === "flow_shop_no_phone") {
    let formatOutgoingMessage = rawOutgoingMessage
    const data = JSON.parse(jsonBody.action.metadata.data)
    console.log("data parse:", data)
    if (data.phone !== 'no_phone') {
      formatOutgoingMessage.messages[0].text = data.phone
    }
    const sendTemplate = {
      "outgoingMessage": formatOutgoingMessage,
      "shouldContextualize": true
    }
    console.log("sendTemplate: ", JSON.stringify(sendTemplate))

    return {
      statusCode: 200,
      body: JSON.stringify(sendTemplate)
    }
  } else if (jsonBody.action.action === "flow_shop_no_map") {
    let formatOutgoingMessage = rawOutgoingMessage
    if (jsonBody.action.metadata.data !== 'no_uri') {
      formatOutgoingMessage.messages[0].text = jsonBody.action.metadata.data
    }
    const sendTemplate = {
      "outgoingMessage": formatOutgoingMessage,
      "shouldContextualize": true
    }
    console.log("sendTemplate: ", JSON.stringify(sendTemplate))

    return {
      statusCode: 200,
      body: JSON.stringify(sendTemplate)
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

