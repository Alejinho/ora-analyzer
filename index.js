
async function pullDatabaseObjects() {
}

const table1 = {
  type: 'TABLE',
  name: 'table_1',
  dependencies: [],
}
const table2 = {
  type: 'TABLE',
  name: 'table_2',
  dependencies: [],
}
const table3 = {
  type: 'TABLE',
  name: 'table_3',
  dependencies: [],
}

const dblink1 = {
  type: 'DBLINK',
  name: 'dblink_1',
  dependencies: [],
}

const view1 = {
  type: 'VIEW',
  name: 'view_1',
  dependencies: [table1, dblink1],
}
const view2 = {
  type: 'VIEW',
  name: 'view_2',
  dependencies: [view1],
}
const view3 = {
  type: 'VIEW',
  name: 'view_3',
  dependencies: [view1],
}
const view4 = {
  type: 'VIEW',
  name: 'view_4',
  dependencies: [view3],
}

const select1 = {
  type: 'SELECT',
  name: 'select_1',
  dependencies: [view3],
}

const select2 = {
  type: 'SELECT',
  name: 'select_2',
  dependencies: [table1],
}

const usage1 = {
  type: 'USAGE',
  name: 'index.js',
  dependencies: [select1],
}
const usage2 = {
  type: 'USAGE',
  name: 'sign-in-form.js',
  dependencies: [select2],
}

async function processDatabaseObjects(content) {
  return [
    table1,
    table2,
    table3,
    view1,
    view2,
    view3,
    view4,
    dblink1,
  ]
}

async function loadDatabaseObjects() {
  const dbcontent = await pullDatabaseObjects()
  return processDatabaseObjects(dbcontent)
}

async function loadUsages(sources, objects) {
  return [
    usage1,
    usage2,
    select1,
    select2,
  ]
}

async function getObjectsFromScript(script, objects) {
  return [
    {
      object: table1,
      actions: ['change'],
    },
    {
      object: view1, 
      actions: ['change'],
    },
  ]
}

async function getUsageTree(usages, objects, intersections) {
  const result = [...intersections]
  const sourcesIndex = {};

  [...usages, ...objects]
    .map(element => {
      element.children = []
      element.map = {}

      return element
    })
    .forEach(element => {
      element.dependencies.forEach(dependency => {
        if (!sourcesIndex[dependency.name]) {
          sourcesIndex[dependency.name] = {}
        }

        sourcesIndex[dependency.name][element.name] = element
      })
    });

  for (let i = 0; i < result.length; i++) {
    const operation = result[i]
    const node = operation.object
    const changed = !!operation.actions.some(action => action === 'change')

    if (!changed) {
      continue;
    }

    const elements = sourcesIndex[node.name]
    if (!elements) {
      continue
    }

    const values = Object.values(elements)
    values.forEach(element => {
      result.push({
        object: element,
        actions: ['change'],
      })

      if (!node.map[element.name]) {
        node.map[element.name] = true
        node.children.push(element)
      }
    })
  }

  return intersections.map(intersection => intersection.object)
}

async function drawTree(objects, level = 0) {
  let spaces  = ''
  for (let i = 0; i < level; i++) {
    spaces += '  '
  }

  objects.forEach((object, index) => {
    console.log(`${spaces}${level+1}. ${object.name}`)
    drawTree(object.children, level + 1)
  })
}

async function run(script) {
  // 1. Read tables, packages, views, functions, stored procedures, etc.
  const dbobjects = await loadDatabaseObjects()

  // 2. Create the usage index from the database objects. This will looks like:
  //    file: java/com/example/com/SignInForm.java
  //    dbObjects:
  //      - package1.view1
  //      - package2.view1
  const usages = await loadUsages(
    // TODO Pass the sources to process
    [ /* java/com/example/com/SignInForm.java */ ],
    dbobjects,
  )

  // 3. Read incoming script and search for the elements that match out database, for example:
  //  Input: >a
  //    SELECT v1.* FROM package1.view1 v1 INNER JOIN package2.view2 v2 ON v1.id = v2.id;
  //    ALTER TABLE package2.table2 ADD COLUMN new_column VARCHAR2(255);
  //
  //  Output:
  //    - object: package1.view1
  //      action:
  //        - usage
  //    - object: package2.view2
  //      action:
  //        - usage
  //    - object: package2.table2
  //      action:
  //        - change
  const scriptObjects = await getObjectsFromScript(script, dbobjects)

  // 4. Get the usage tree. Depending on the 'action' property:
  //    - If The operation value is 'usage', then it will return only the same value because
  //      it doesn't affect it children directly.
  //    - If the operation value is 'change', the it will return all the children in depth.
  const tree = await getUsageTree(usages, dbobjects, scriptObjects)

  await drawTree(tree)
}

(async () => {
  await run("ALTER TABLE table_1 ADD COLUMN new_column VARCHAR2(255);")
})()
