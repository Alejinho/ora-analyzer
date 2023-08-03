import nodeSQL from 'node-sql-parser';
import plsqlParser from 'oracle-plsql-parser';

import antlr4 from 'antlr4';
import PlSQLGrammarLexer from './storage/grammar/PlSqlLexer.js';
import PlSQLGrammarParser from './storage/grammar/PlSqlParser.js';
import PlSQLGrammarListener from './storage/grammar/PlSqlParserListener.js';

class TablesFinderListener extends PlSQLGrammarListener {
  tables = {};

  clearTables() {
    this.tables = {}
  }

  getTables() {
    return Object.keys(this.tables)
  }

  exitTable_ref_aux_internal_one(ctx) {
    this.tables[ctx.getText().toUpperCase()] = null
  }
}

export function getTablesFromPackage(input) {
  const chars = new antlr4.InputStream(input);
  const lexer = new PlSQLGrammarLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new PlSQLGrammarParser(tokens);

  // parser.buildParseTrees = true;
  const tree = parser.sql_script(); 

  const finder = new TablesFinderListener()
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(finder, tree);

  return finder.getTables()

  // const ast = plsqlParser.default(input)
  // console.log(ast)
  // console.log(plsqlParser.getInterpretation(ast.cst))
}

export function getTablesFromSQL(input) {
  const parser = new nodeSQL.Parser();
  const list = parser.tableList(
    input.toUpperCase()

      // Sanitize the default varchar.
      .replace(/VARCHAR2/, 'VARCHAR')

      // Sanitize DBLinks, transform 'remote@users' into 'DBLINK_remote.users', later
      // we'll use this prefix to check the object type.
      .replace(/([\w\d]+)@([\w\d]+)/, 'DBLINK_$1.$2')
  );

  return list.map(table => {
    const [type, db, name] = table.split('::')
    const isDBLink = db && db.startsWith('DBLINK_')

    if (isDBLink) {
      return {
        type: 'DBLINK',
        name: db.replace('DBLINK_', '').toUpperCase(),
        table: name.toUpperCase(),
      }
    }

    return {
      type: 'TABLE',
      name: name.toUpperCase(),
    }
  })
}
