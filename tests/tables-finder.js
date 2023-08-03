import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict'
import { getTablesFromSQL, getTablesFromPackage } from '../parser.js'

describe('Getting tables from SQL', () => {

  it('should get the table in a simple query', () => {
    const input = `SELECT * FROM users;`
    const tables = getTablesFromSQL(input)
    assert.deepEqual(tables, [{type: 'TABLE', name: 'USERS'}])
  })

  it('should get the table in a simple query with a DBLink', () => {
    const input = `SELECT * FROM remote@users;`
    const tables = getTablesFromSQL(input)
    assert.deepEqual(tables, [
      {
        type: 'DBLINK',
        name: 'REMOTE',
        table: 'USERS',
      },
    ])
  })

  it('should get the tables from the joined tables', () => {
    const input = `SELECT * FROM users u INNER JOIN employees e ON e.user_id = u.id;`
    const tables = getTablesFromSQL(input)
    assert.deepEqual(tables, [
      {type: 'TABLE', name: 'USERS'},
      {type: 'TABLE', name: 'EMPLOYEES'},
    ])
  })

  it('get tables from nested queries', () => {
    const input = `SELECT
      users.id,
      (SELECT deleted_at FROM log WHERE users.id = log.owner_id) as deleted_at
    FROM users;`
    const tables = getTablesFromSQL(input)
    assert.deepEqual(tables, [
      {type: 'TABLE', name: 'LOG'},
      {type: 'TABLE', name: 'USERS'},
    ])
  })

  it('get tables from DDL', () => {
    const input = `ALTER TABLE users ADD COLUMN name VARCHAR2(255) NOT NULL DEFAULT 'default-value';`
    const tables = getTablesFromSQL(input)
    assert.deepEqual(tables, [
      {type: 'TABLE', name: 'USERS'},
    ])
  })

})

// describe('Getting tables from packages', () => {

//   it('should parse a simple package', async () => {
//     const input = await fs.readFile(path.join(process.cwd(), 'tests/examples/employees.sql'))
//     const tables = getTablesFromPackage(input.toString())
//     assert.deepEqual(tables, ['EMPLOYEES'])
//   })

// })
