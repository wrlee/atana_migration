
export default class Migration {
  constructor(api, db) {
    this.api = api
    this.db = db

    this.migrateRegistrations.bind(this)
  }

  /**
   * Insert Registration object into DB. This results in records being inserted
   * into multiple tables (e.g. learners, registrations).
   */
  async migrateRegistration(registration) {
    try {
      const promises = []
      const dbRegistration = {
        ...registration,
      }
      await this.db.beginTransaction()

      // Ensure learner exists and update registration object
      promises.push( this.db.upsertLerner(registration.learner) )
      dbRegistration.learner_id = registration.learner.id
      delete dbRegistration.learner
      dbRegistration.learner_id = registration.learner.id

      promises.push( this.db.upsertRegistration(registration) )

      promises.push( this.db.commit() )
      return await Promise.all(promises)

    } catch (error) {
      console.error('Error inserting registration:', error)
      await this.connection.rollback()
    }
  }

  /**
   * Callback function to process array of Registrations
   *
   * @param {Registration[]} registrations
   */
  async migrateRegistrations(registrations) {
    console.log('Migrating registrations...')

    registrations.forEach((reg) => {
      this.migrateRegistration(reg)
        .then(() => {
          console.log('Inserted registration:', reg.id)
        })
        .catch((error) => {
          console.error('Error inserting registration:', error)
        })
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
  processRegistrations(filter_params) {
    return this.api.getRegistrations(filter_params)
      .then(response => {
        const promises = []
        if (Array.isArray(response.registrations))
          promises.push(this.migrateRegistrations(response.registrations))
        if (response.more) {    // Handle pagination
          console.log(`More registrations available (${response.more}).`)
          promises.push(this.api.getRegistrations({more: response.more}))
        }
        return Promise.all(promises)
      })
      .catch(error => {
        console.error('Error fetching registrations:', error)
      })
  }
}
