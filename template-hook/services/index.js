const axios = require("axios")

const urlEnpoint = process.env['url_enpoint']
const token = process.env['token']

const Services = {
    getUnits: async (lng, branchId, unitId) => {
        const branchIdParam = branchId !== undefined ? `&branchid=${branchId}` : ""
        const unitIdParam = unitId !== undefined ? `&unitid=${unitId}` : ""
        console.log("branchIdParam :", branchIdParam, unitIdParam)
        const url = `${urlEnpoint}get_units?language=${lng}${branchIdParam}${unitIdParam}`
        const config = {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        };
        console.log("url getUnit : ", url)
        return axios.get(url, config)
    }
}

module.exports = Services