import CryptoJS from 'crypto-js'

interface TrackData {
    visitTime: string
    url: string
    deviceType: string
    os?: string
    browser?: string
}
let startTime = Date.now();
let url = window.location.href

/**
 * Returns the device type based on the user agent.
 * @returns The device type ('desktop', 'mobile', or 'tablet') or null if the user agent is not available in the browser version.
 */
const getDeviceType = () => {
    const ua = navigator.userAgent
    if(ua){
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "tablet"
        if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile"
        }
        return "desktop"
    } else {
        console.error('Unable to load user agent in the browser')
        return null
    }
}

/** 
* Encrypts the given data using AES encryption algorithm.
* @param {TrackData} data - The data to be encrypted.
* @returns {string} The encrypted data as a string.
* @throws If an error occurs during the encryption process.
*/
const encryptData = (data: TrackData): string => {
    try {
        const jsonString = JSON.stringify(data)
        const encryptionKey = process.env.TRACKER_ENCRYPTION_KEY
        const initializationVector = process.env.TRACKER_INITIALIZATION_VECTOR
        const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionKey!, { initializationVector: CryptoJS.enc.Hex.parse(initializationVector!) })
        const encryptedResult = encrypted.toString()
        return encryptedResult
    } catch (error: any) {
        console.log(error)
        throw error.message
    }
}

/**
 * Sends trackig data to the backend server using the sendBeacon method of the navigator object.
 * @param {string} url - The url of the previous page.
 */
const sendData = (url: string) => {
    const visitTime = Date.now() - startTime
    
    //Represents the tracked data for a visit.
    const trackData: TrackData = {
        visitTime: visitTime.toString(),
        url,
        deviceType: getDeviceType()!,
    }

    localStorage.setItem('trackData', JSON.stringify(visitTime))
    const trackDataEncrypted = encryptData(trackData)

    navigator.sendBeacon(process.env.TRACKER_ENDPOINT!, JSON.stringify(trackDataEncrypted))  
    startTime = Date.now() 
}

//Check if the document is hidden and execute the sendData function if it is.
const handleVisibilityChange = () => {
    if(document.visibilityState === 'hidden') sendData(url)
}

/**
 * Adds an event listener to the document to check if the visibility state of the document changes. 
 * Use the handleVisibilityChange function to handle the change.
 */
document.addEventListener('visibilitychange', handleVisibilityChange)

//Adds an event listener to the document to check if the url of the page changes.
document.body.addEventListener('click', () => {
    requestAnimationFrame(()=>{
        if(url!==window.location.href){
            sendData(url)
            url = window.location.href
        }
      });
}, true)
