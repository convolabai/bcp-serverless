const Util = require("../util/index")
const default_thumnail = process.env['default_pic']

const TemplateFormatter = {
    carouselAskShop: (rawMsg, data) => {
        console.log("carouselAskShop rawMsg :", JSON.stringify(rawMsg))
        rawMsg.messages[1].columns[0].title = data.title ? data.title : ""
        rawMsg.messages[1].columns[0].text = data.text ? data.text : ""
        rawMsg.messages[1].columns[0].thumbnailImageUrl = Util.thumbnailImageUrlValidation(rawMsg.messages[1].columns[0], data)
        rawMsg.messages[1].columns[0].actions[0] = Util.phoneValidation(rawMsg.messages[1].columns[0].actions[0], data.phoneNo)
        rawMsg.messages[1].columns[0].actions[1] = Util.uriMapValidation(rawMsg.messages[1].columns[0].actions[1], data.uri)
        return rawMsg
    },
    multiCarouselAskShop: (rawMsg, datas, metadata) => {
        console.log("multiCarouselAskShop rawMsg :", JSON.stringify(rawMsg))
        console.log("multiCarouselAskShop datas :", JSON.stringify(datas))

        const carouselTemp = rawMsg.messages[1].columns[0]
        let newDatas = []
        for (let i = 0; i < datas.length; i++) {
            const newCarousel = carouselTemp
            if (i === 9) { // custom last index
                const lastCard = TemplateFormatter.getSeeMoreCardTemplate(newCarousel, metadata.unitId, metadata.branchId, metadata.language, metadata.unitName, metadata.branchName, metadata.round)
                console.log("lastCard :", lastCard)
                newDatas.push({ ...lastCard })
            } else {
                newCarousel.title = datas[i].title ? datas[i].title : ""
                newCarousel.text = datas[i].text ? datas[i].text : ""
                newCarousel.thumbnailImageUrl = Util.thumbnailImageUrlValidation(newCarousel, datas[i])
                const actions = carouselTemp.actions.map((action, idx) => {
                    if (idx === 0) {
                        action = Util.phoneValidation(action, datas[i].phoneNo)
                    }
                    if (idx === 1) {
                        action = Util.uriMapValidation(action, datas[i].uri)
                    }

                    return { ...action }
                })
                newDatas.push({ ...newCarousel, actions: [...actions] })
            }
            console.log("newDatas :", JSON.stringify(newDatas))
        }
        console.log("newDatas length :", newDatas.length)
        rawMsg.messages[1].columns = newDatas
        return rawMsg
    },
    datasFormatter: (datas) => {
        return datas.map((data) => {
            return {
                title: data.unitname,
                text: Util.textDescFormatter(data),
                thumbnailImageUrl: data.logo,
                phoneNo: data.contact,
                uri: data.lineurl
            }
        })
    },
    shopFlowFailShopTemplate: (rawMsg, shopName, branchName) => {
        rawMsg.messages[0].text = `ขออภัยค่ะ เซ็นทรัลพัฒนาไม่พบร้าน ${shopName} ที่ท่านค้นหาในสาขา${branchName} แต่เซ็นทรัลพัฒนายังมีร้านค้าอื่น ๆ ที่น่าสนใจมาแนะนำค่ะ`
        return rawMsg
    },
    getSeeMoreCardTemplate: (card, unitId, branchId, language, unitName, branchName, round) => {
        console.log("card 1 :", card)
        card.title = "โปรโมชันอื่นๆ"
        card.text = "กดปุ่มด้านล่างเพื่อดูโปรโมชันเพิ่มเติมตามหมวดหมู่ต่างๆ"
        // card.thumbnailImageUrl = card.thumbnailImageUrl
        card.thumbnailImageUrl = default_thumnail
        card.actions[0] = Util.seeMoreValidation(card.actions[0], unitId, branchId, language, unitName, branchName, round+=10)
        card.actions[1] = Util.seeOpenWebsite(card.actions[1])
        // card.actions.pop()
        console.log("card 2 :", card)
        return card
    }
}

module.exports = TemplateFormatter