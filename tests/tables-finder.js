import { describe, it } from 'node:test';
import assert from 'node:assert/strict'
import { getTables } from '../parser.js'

describe('Getting tables from queries', () => {

  it('should get the table in a simple query', () => {
    const input = `SELECT * FROM users;`
    const tables = getTables(input)
    assert.deepEqual(tables, ['users'])
  })

  it('should get the tables from the joined tables', () => {
    const input = `SELECT * FROM users u INNER JOIN employees e ON e.user_id = u.id;`
    const tables = getTables(input)
    assert.deepEqual(tables, ['users', 'employees'])
  })

  it('get tables from nested queries', () => {
    const input = `SELECT
      users.id,
      (SELECT deleted_at FROM log WHERE users.id = log.owner_id) as deleted_at
    FROM users;`
    const tables = getTables(input)
    assert.deepEqual(tables, ['log', 'users'])
  })

})
