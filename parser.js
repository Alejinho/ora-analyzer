import antlr4 from 'antlr4';
import PlSQLGrammarLexer from './storage/grammar/PlSqlLexer.js';
import PlSQLGrammarParser from './storage/grammar/PlSqlParser.js';
import PlSQLGrammarListener from './storage/grammar/PlSqlParserListener.js';

class TablesFinderListener extends PlSQLGrammarListener {
  tables = [];

  clearTables() {
    this.tables = []
  }

  exitTable_ref_aux_internal_one(ctx) {
    this.tables.push(ctx.getText())
  }
}

export function getTables(input) {
  const chars = new antlr4.InputStream(input);
  const lexer = new PlSQLGrammarLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new PlSQLGrammarParser(tokens);

  parser.buildParseTrees = true;
  const tree = parser.sql_script(); 

  const finder = new TablesFinderListener()
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(finder, tree);

  return finder.tables
}
