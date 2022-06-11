// Defines functions necessary to run QUnit tests.
// Ob2ss is both a library and a webapp (for testing).

var Qunit = QUnitGS2.QUnit; // Lower-case to avoid collisions.

// HTML get function
function doGet() {
   QUnitGS2.init();

   //testSheetUtilities(Qunit);
   //testTable(Qunit);

   //pressureTest(Qunit);
   benchmarkTest(Qunit);

   Qunit.start();
   return QUnitGS2.getHtml();
}

// Retrieve test results when ready.
function getResultsFromServer() {
   return QUnitGS2.getResultsFromServer();
}
