const default_thumnail = process.env['default_pic']
const Util = {
    phoneValidation: (raw, data) => {
        const reg = /^\d+$/;
        if (reg.test(data)) {
            raw.phoneNo = data
        } else {
            const jsonData = JSON.stringify({ phone: data ? data : "no_phone" })
            console.log("data :",data)
            if(data !== "" && data !== null && data !== "null" && data !== undefined && data.length <= 12)
            {
                raw.phoneNo = data.replace(/[-\s]/g, '')
                raw.type = "call_action"
                delete raw.data
            }
            else{
                raw.type = "postback"
                raw.data = `action=flow_shop_no_phone&data=${jsonData}`
                delete raw.phoneNo
            }
            // const jsonData = JSON.stringify({ phone: data ? data : "no_phone" })
            // raw.type = "postback"
            // raw.data = `action=flow_shop_no_phone&data=${jsonData}`
            // delete raw.phoneNo
        }
        return raw
    },
    uriMapValidation: (raw, data) => {
        if (data) {
            raw.uri = data
        } else {
            raw.type = "postback"
            raw.data = `action=flow_shop_no_map&data=${data ? data : "no_uri"}`
            delete raw.uri
        }
        return raw
    },
    seeMoreValidation: (raw, unitId, branchId, language, unitName, branchName, round) => {
        raw.type = "postback"
        raw.data = `action=carousel_temp&unit_id=${unitId}&branch_id=${branchId}&language=${language}&unit_name=${unitName}&branch_name${branchName}&round=${round}`
        // raw.label = "รายละเอียดเพิ่มเติม"
        raw.label = "ดูเพิ่มเติม"
        delete raw.phoneNo
        return raw
    },
    seeOpenWebsite: (raw) => {
        raw.type = "uri"
        raw.uri = "https://www.centralpattana.co.th/th/our-business/shopping-center"
        raw.label = "เว็บไซต์"
        return raw
    },
    thumbnailImageUrlValidation: (raw, data) => {
        return data?.thumbnailImageUrl?.slice(0, 5) === 'https' ? data.thumbnailImageUrl : default_thumnail
    },
    textDescFormatter: (data) => {
        return `${data.branchname ? `${data.branchname ? data.branchname : ""} ${data.floorname ? `ชั้น ${data.floorname}` : ""} \n` : ""}${data.open ? data.open : ""}`
    }
}

module.exports = Util