import { Backend } from "../Backend";
import { Options } from "../Options";

/**
 * PressureTest is about trying to trip up Ob2ss with edge-cases, tricky situations, and other mayhem. While
 * not everything will get fixed, it's nice to see what can happen.
 */
function pressureTest(QUnit:QUnit){
  const options = new Options();
  const Ob2ss = new Backend(options);
  const spreadsheet = SpreadsheetApp.openById('1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI');

  QUnit.module('Testing Adding.');
  QUnit.test("Adding strange objects.", (assert) => {
    Ob2ss.open(spreadsheet);
    let table = Ob2ss.getTableByName('default');
    
    let date1 = new Date(1653924474000);
    let date2 = new Date("123456");
    let trickyTestObj = {
      'string': '/notreally/&bsp;',
      'equation': '=ISNA("12")',
      'naughtyArray': [ , 2, 3, "4"],
      'dates': [ date1, date2]
    };

    table.addAppend([trickyTestObj]);
    let expected = {
      "dates": [
        "Mon May 30 2022 11:27:54 GMT-0400 (Eastern Daylight Time)",
        "Tue Jan 01 123456 00:00:00 GMT-0500 (Eastern Standard Time)"
      ],
      "equation": false,
      "naughtyArray": [
        undefined,
        2,
        3,
        4
      ],
      "string": "/notreally/&bsp;"
    };
    let result = table.getLast()[0];
    assert.deepEqual(result, expected, 'Mild object transformation occurred.');
    table.destroy();
  });

  QUnit.module('Testing Updating.');
  QUnit.test("Adding strange objects.", (assert) => {
    
  });

  QUnit.module('Testing Reading.');
  QUnit.module('Testing Deleting.');
}

function testHeaderOffset(){
  // SPECIFIC TESTS
  let spreadsheetId = '1w7lhdf2wSi4JkmlWWirydF9eYNhnb22FnjYYNhNBtAI';
  let spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let Ob2ss = new Backend();
  Ob2ss.open(spreadsheet);
  let table = Ob2ss.getTableByName('default');
  let date1 = new Date("1653924474000");
  let date2 = new Date("123456");
  let trickyTestObj = {
    'string': '/notreally/&bsp;',
    'equation': '=ISNA("12")',
    'naughtyArray': [ , 2, 3, "4"],
    'dates': [ new Date(), new Date("123456")]
  };

  table.addAppend([trickyTestObj]);
  Logger.log(table.getCount());
  Logger.log(table.getLast()[0]);
}