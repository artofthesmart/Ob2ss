import { Backend } from "../Backend";
import { Options } from "../Options";
import { Timer } from "../Timer";

/**
 * Benchmarking is about seeing how fast operations are and making adjustments where needed.
 * They're all from the API level.
 */

let options = new Options();

function benchmarkTest(QUnit:QUnit){
  constructorsTest();
  addingTest();
  readingTest();
  deletingTest();
}

function deletingTest(){
  let t:Timer;
  const Ob2ss = new Backend(); 
  
  Ob2ss.open(SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI'));
  const table = Ob2ss.getTableByName('records');
  const loggingTable = Ob2ss.getTableByName('logs');

  const logFunction = (message:string, time:number) => {
    loggingTable.addAppend([{date:new Date(), message, time}]);
  };

  const records = [];
  for (let i = 0; i < 101; i++) {
    records.push({
      id: i,
      name: 'User',
      address_number: 123,
      address_street: 'main',
      address_zip: 90210,
      children: Array.from({length: Math.round(Math.random()*5)}, () => Math.random())
                     .map(v => v > .5 ? 'boy_name' : 'girl_name'),
      pet: ['dog', 'cat', 'snake'][Math.round(Math.random()*2)]
    });
  }
  table.addAppend(records);

  t = new Timer('Table.removeLike(1)', logFunction);
  table.removeLike(record => record.id == 10);
  t.stop();

  t = new Timer('Table.removeLike(50 interleaved)', logFunction);
  table.removeLike(record => record.id%2 == 1);
  t.stop();

  t = new Timer('Table.removeLike(50 sequential)', logFunction);
  table.removeLike(record => true);
  t.stop();

  table.destroy();
}

function readingTest(){
  let t:Timer;
  const Ob2ss = new Backend(); 
  const spreadsheet = SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI');
  const sheet = spreadsheet.getSheetByName('users'); if (!sheet) return;
  
  Ob2ss.open(SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI'));
  const table = Ob2ss.getTableByName('users');

  const logFunction = (message:string, time:number) => {
    Ob2ss.getTableByName('logs').addAppend([{date:new Date(), message, time}]);
  };

  t = new Timer('Table.getFirst()', logFunction);
  let records = table.getFirst();
  records.pop();
  t.stop();

  t = new Timer('Table.getFirst(10)', logFunction);
  records = table.getFirst(10);
  records.pop();
  t.stop();

  t = new Timer('Get A1:F11 from table by hand. Just values', logFunction);
  records = sheet?.getRange('A1:F11').getValues();
  records.pop();
  t.stop();

  t = new Timer('Table.getLast()', logFunction);
  records = table.getLast();
  records.pop();
  t.stop();

  t = new Timer('Table.getLast(10)', logFunction);
  records = table.getLast(10);
  records.pop();
  t.stop();

  t = new Timer('Table.getAll()', logFunction);
  records = table.getAll();
  records.pop();
  t.stop();

  t = new Timer('Table.getLike()', logFunction);
  records = table.getLike(record => record.id > 10);
  records.pop();
  t.stop();

  t = new Timer('Table.getColumns(3)', logFunction);
  records = table.getColumns(['id', 'email', 'gender']);
  records.pop();
  t.stop();

  t = new Timer('Table.getColumnValues(1)', logFunction);
  records = table.getColumnValues('email');
  records.pop();
  t.stop();
}

function addingTest(){
  let t:Timer;
  const Ob2ss = new Backend(); 
  
  Ob2ss.open(SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI'));
  const table = Ob2ss.getTableByName('records');
  const loggingTable = Ob2ss.getTableByName('logs');

  const records = [];
  for (let i = 0; i < 100; i++) {
    records.push({
      name: 'User',
      address_number: 123,
      address_street: 'main',
      address_zip: 90210,
      children: Array.from({length: Math.round(Math.random()*5)}, () => Math.random())
                     .map(v => v > .5 ? 'boy_name' : 'girl_name'),
      pet: ['dog', 'cat', 'snake'][Math.round(Math.random()*2)]
    });
  }

  const logFunction = (message:string, time:number) => {
    loggingTable.addAppend([{date:new Date(), message, time}]);
  };

  t = new Timer('Table.addAppend(1)', logFunction);
  table.addAppend([records[0]]);
  t.stop();

  t = new Timer('Table.addAppend(100)', logFunction);
  table.addAppend(records);
  t.stop();

  t = new Timer('Table.addPrepend(1)', logFunction);
  table.addPrepend([records[0]]);
  t.stop();

  t = new Timer('Table.addPrepend(100)', logFunction);
  table.addPrepend(records);
  t.stop();

  t = new Timer('Table.addAt(1)', logFunction);
  table.addAt([records[0]], 10);
  t.stop();

  t = new Timer('Table.addAt(100)', logFunction);
  table.addAt(records, 50);
  t.stop();

  table.destroy();
}

function constructorsTest(){
  let t:Timer;
  let Ob2ss:Backend;
  let be = new Backend(); be.open(SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI'));
  let logTable = be.getTableByName('logs');
  const logFunction = (message:string, time:number) => {
    logTable.addAppend([{date:new Date(), message, time}]);
  };

  // 1ms
  t = new Timer('Backend.constructor', logFunction);
  Ob2ss = new Backend(options);
  t.stop();

  // 1500ms
  let spreadsheet = SpreadsheetApp.openById('1SQdNXQetSFytNzRtwXV38orFAODaqpMe2XeY6kBS83g');
  t = new Timer('Backend.open', logFunction);
  Ob2ss.open(spreadsheet);
  t.stop();

  // 1ms
  t = new Timer('Backend.getTableByName (exists)', logFunction);
  let table = Ob2ss.getTableByName('default');
  t.stop();

  // 600ms
  t = new Timer('Backend.getTableByName (does not exist)', logFunction);
  table = Ob2ss.getTableByName('not_default');
  t.stop();

  Ob2ss.doDestroy('not_default');
}