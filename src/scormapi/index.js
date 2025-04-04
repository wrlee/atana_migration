import { URL, URLSearchParams } from 'url'

/**
 * SCORM API class to handle SCORM API calls
 */
export default class ScormApi {
  scormUrl = 'https://cloud.scorm.com/api/v2'

  constructor() {
    const app_id = process.env.APP_ID
    const app_secret = process.env.APP_SECRET

    this.basicAuth = Buffer.from(`${app_id}:${app_secret}`).toString('base64')
    this.headers = {
      'Authorization': `Basic ${this.basicAuth}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * HTTP Get call to SCORM API. This method handles authentication, query
   * paramesters, and headers.
   *
   * @param {string} path - suffix to the SCORM API URL to the desired endpoint
   * @param {object} params - Query parameters
   * @param {object} headers - Additional or override of headers
   * @returns {Promise<Response>} - Fetch response
   */
  get(path, params = {}, headers = {}) {
    try {
      const url = new URL(`${this.scormUrl}${path}`)
      url.search = new URLSearchParams(params).toString()

      return fetch(url.toString(), {
        headers: {
          ...this.headers,
          ...headers
        },
        method: 'GET',
      })
    } catch (error) {
      console.error('Error calling SCORM API:', error)
    }
  }

  /**
   * Retreive registrations.
   *
   * @param {object} filter_params
   * @param {callback} callback Handle results
   * @returns
   */
  getRegistrations(filter_params = {}) {
    return this.get('/registrations', filter_params)
      .then(response => {
        console.debug(response)
        return response.json()
      })
      .catch(error => {
        console.error('Error fetching registrations:', error)
      })
  }

  /**
   * This method allows registration data to be processed by a callback function. This
   * handles the case where there are multiple pages of data to be processed, calling the callback
   * for each page of data.
   *
   * @param {callback} callback(Registrations[]) Callback to handle retrieved registrations
   * @param {*} filter_params
   * @returns {Promise} - Promise that resolves when all registrations' pages have been processed
   */
  processRegistrations(callback, filter_params) {
    return this.getRegistrations(filter_params)
      .then(response => {
        const promises = []
        if (callback && Array.isArray(response.registrations))
          promises.push(callback(response.registrations))
        if (response.more) {    // Handle pagination
          console.log(`More registrations available (${response.more}).`)
          promises.push(this.getRegistrations({more: response.more}))
        }
        return Promise.all(promises)
      })
      .catch(error => {
        console.error('Error fetching registrations:', error)
      })
  }

} // class ScormApi
