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
   * Retreive course record.
   *
   * @param {object} filter_params
   * @param {callback} callback Handle results
   * @returns
   */
  getCourses(filter_params = {}) {
    return this.getCourse('', filter_params)
  }

  /**
   * Retreive course record.
   *
   * @param {object} filter_params
   * @param {callback} callback Handle results
   * @returns
   */
  getCourse(id, filter_params = {}) {
    return this.get(`/courses/${id}`, filter_params)
      .then(response => {
        console.debug(response)
        return response.json()
      })
      .catch(error => {
        console.error('Error fetching courses:', error)
      })
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
} // class ScormApi
