import 'dotenv/config'
import mysql from 'mysql2/promise'
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite'

export class AtanaDb {
  constructor() {
    this.connection = null
    this.migrateRegistrations = this.migrateRegistrations.bind(this)

    this.initialize()
  }

  /**
   * Ensure that DB connection is open member variable is set.
   *
   * @returns Promise to DB connection
   */
  async connect() {
    if (!this.connection) {
      try {
        this.connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            multipleStatements: true
        })
        console.log('Connected to MySQL database!')
      } catch (error) {
        console.error('Error connecting to MySQL database:', error)
        throw error
      }
    }
    return this.connection
  }

  /**
   * Close the DB connection.
   */
  async close() {
    if (this.connection) {
      await this.connection.end()
      this.connection = null
      console.log('MySQL connection closed.')
    }
  }

  /**
   * Initialize tables in the database, if necessary.
   *
   * @returns
   */
  async initialize() {
    try {
      await this.connect()

      const ID_LENGTH = 255
      const COURSE_ID_LENGTH = 300
      const COURSE_TITLE_LENGTH = 512

      const tableStatements = [
        `CREATE TABLE IF NOT EXISTS courses (
            id VARCHAR(${COURSE_ID_LENGTH}) PRIMARY KEY,
            title VARCHAR(${COURSE_TITLE_LENGTH}) NOT NULL, -- Title of the course
            xapiActivityId VARCHAR(255),
            created DATETIME NOT NULL,
            updated DATETIME NOT NULL,
            version INT,
            registrationCount INT,
            activityId VARCHAR(255), -- Activity ID
            courseLearningStandard ENUM(
                'UNKNOWN',
                'SCORM11',
                'SCORM12',
                'SCORM20042NDEDITION',
                'SCORM20043RDEDITION',
                'SCORM20044THEDITION',
                'AICC',
                'XAPI',
                'CMI5',
                'LTI13'
            ), -- Enum for course learning standard
            tags JSON, -- Tags stored as JSON
            dispatched BOOLEAN,
            metadata JSON, -- Metadata stored as JSON (assuming MetadataSchema can be represented as JSON)
            rootActivity JSON -- Root activity stored as JSON (assuming CourseActivitySchema can be represented as JSON)
        );`,
       `CREATE TABLE IF NOT EXISTS learners (
            id VARCHAR(${ID_LENGTH}) PRIMARY KEY, -- Unique identifier for the learner
            email VARCHAR(128), -- Optional email push associated with the learner
            firstName VARCHAR(100), -- First name of the learner
            lastName VARCHAR(100) -- Last name of the learner
        );`,
        `CREATE TABLE IF NOT EXISTS registrations (
            id VARCHAR(${ID_LENGTH}) PRIMARY KEY, -- check max length
            instance INT NOT NULL,
            xapiRegistrationId VARCHAR(255),
            dispatchId VARCHAR(255),
            updated DATETIME,
            registrationCompletion ENUM('UNKNOWN', 'COMPLETED', 'INCOMPLETE'),
            registrationCompletionAmount DOUBLE,
            registrationSuccess ENUM('UNKNOWN', 'PASSED', 'FAILED'),
            score DOUBLE, -- Can this be a complex value?
            totalSecondsTracked DOUBLE,
            firstAccessDate DATETIME,
            lastAccessDate DATETIME,
            completedDate DATETIME,
            createdDate DATETIME,
            course JSON,
            learner_id VARCHAR(${ID_LENGTH}) NOT NULL,
            tags JSON, -- Consider tags table to manage tags across the system
            globalObjectives JSON, -- Assuming globalObjectives is an array that can be stored as JSON
            sharedData JSON, -- Assuming sharedData is an array that can be stored as JSON
            suspendedActivityId VARCHAR(255),,
            activityDetails JSON -- Assuming ActivityResultSchema can be represented as JSON
        );`
      ]

      const promises = tableStatements.map(statement => connection.execute(statement))
      await Promise.all(promises)
      console.log('Created tables.')

      return connection

    } catch (error) {
      console.error('Error initializing database:', error)
    }
  } // initialize()

  /**
   * Match JSON registration object to DB schema.
   *
   * @param {object} registration
   */
  transformRegistrationToStore(registration) {
    const db_reg = {
      ...registration,
      learner_id: registration.learner.id
    }
    delete db_reg.learner

    return db_reg
  }

  /**
   * Insert Registration object into DB. This may result in records being inserted
   * into multiple tables (e.g. learners, registrations). This will not overwrite an existing
   * matching record so that it can be run mutiple times over the same data.
   *
   * TODO: Ensure record chagnes update existing records.
   */
  async insertRegistration(registration) {
    try {
      await this.connect()
      await this.connection.beginTransaction()
      const promises = []

      let sql = `INSERT IGNORE INTO registrations SET ?`
      promises.push( this.connection.execute(sql, this.transformRegistrationToStore(registration)) )

      sql = `INSERT IGNORE INTO learners SET ?`
      promises.push( this.connection.execute(sql, registration.learner) )

      promises.push( this.connection.commit() )
      await Promise.all(promises)

    } catch (error) {
      console.error('Error inserting registration:', error)
      await this.connection.rollback()
    }
  }

  /**
   * Callback function to process array of Registrations
   * @param {Registration[]} registrations
   */
  async migrateRegistrations(registrations) {
    console.log('Migrating registrations...')
    console.log(this)
    // const db = await this.connect()

    registrations.forEach((reg) => {
      this.insertRegistration(reg)
        .then(() => {
          console.log('Inserted registration:', reg.id)
        })
        .catch((error) => {
          console.error('Error inserting registration:', error)
        })
    })
  }

} // class AtanaDb
