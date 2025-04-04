import 'dotenv/config'
import mysql from 'mysql2/promise'
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite'

export default class AtanaDb {
  constructor() {
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

  async beginTransaction() {
    await this.connect()
    return this.connection.beginTransaction()
  }
  commit() {
    return this.connection.commit()
  }
  rollback() {
    return this.connection.rollback()
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
            id VARCHAR(${ID_LENGTH}) PRIMARY KEY,
            email VARCHAR(128),
            firstName VARCHAR(100),
            lastName VARCHAR(100)
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
            globalObjectives JSON,
            sharedData JSON,
            suspendedActivityId VARCHAR(255),
            activityDetails JSON
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
   * Insert or update a row in the specified table.
   *
   * @param {string} table Table name to update/insert
   * @param {object} data Row data to insert/update
   * @returns Promise
   */
  upsert(tablename, data) {
    const sql = `INSERT INTO ${tablename} SET ? ON DUPLICATE KEY UPDATE ?`
    return this.connection.execute(sql, [data, data])
  }

  /**
   * Insert or update course record.
   */
  upsertCourse(course) {
    return this.upsert('courses', course)
  }

  /**
   * Insert or update lerner record.
   */
  upsertLerner(lerner) {
    return this.upsert('lerners', lerner)
  }

  /**
   * Insert or update registration record.
   */
  upsertRegistration(registration) {
    return this.upsert('registrations', registration)
  }

} // class AtanaDb
