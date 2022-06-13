import { ObjectUtilities } from './ObjectUtilities';
import { Options } from './Options'
import { SheetUtilities } from './SheetUtilities';

// Please keep comemnts here and in `api.ts` aligned.

/**
 * This class represents a virtual table on top of a sheet.
 * ---
 * It primarily orchestrates operations, leaving actual sheet interactions and object flattening/unflattening to utility
 * classes. Some orchestration is actually just routing specific functions to general ones, like `addAppend` is really
 * just a specialization of `addAt`. Table also protects its utilities from most invalid inputs, though utilities will
 * have some error checking during processing.
 */
export class Table {
  private sheet:GoogleAppsScript.Spreadsheet.Sheet;
  options:Options;
  private oUtils:ObjectUtilities;
  private sUtils:SheetUtilities;

  constructor(sheet:GoogleAppsScript.Spreadsheet.Sheet, options?:Options){
    this.sheet = sheet;
    this.options = options || new Options();
    this.oUtils = new ObjectUtilities(this.options);
    this.sUtils = new SheetUtilities(this.sheet, this.options);

    // Prune empty rows and columns. They mess up the math.
    if (!this.sUtils.hasBody()) return;
    this.sUtils.cleanup(sheet);
  }

  ////////////////////////////////
  /////// WRITE //////////////////
  ////////////////////////////////

  /**
   * Adds objects to the bottom (end) of the sheet.
   * ---
   * Converts the provided array of objects into rows, and adds them to the bottom of the spreadsheet. This means
   * they'll appear at the end of the array of all objects stored.
   * 
   * @param {object[]} objects An array of objects to insert into the sheet.
   */
  addAppend(objects:object[]){
    if (!Array.isArray(objects)) objects = [objects];
    this.addAt( -1, objects);
  }

  /**
   * Adds objects to the top (beginning) of the sheet.
   * ---
   * Converts the provided array of objects into rows, and adds them to the top of the spreadsheet. This means
   * they'll appear at the beginning of the array of all objects stored.
   * 
   * @param {object[]} objects An array of objects to insert into the sheet.
   */
  addPrepend(objects:object[]){
    if (!Array.isArray(objects)) objects = [objects];
    this.addAt(0, objects);
  }

  /**
   * Adds objects at the specified position in the sheet.
   * ---
   * Converts the provided array of objects into rows, and adds them starting at the index provided. This means
   * they'll push other existing objects down on the sheet. Remember that the index is _not_ the same as the row number
   * of the sheet. The index represents the position in the data.
   * 
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').addAt(newCars, 5);
   * ```
   * This code will insert the new cars after the first 4 cars in the table, at indices 5 through 9.
   * 
   * @param {object[]} objects An array of objects to insert into the sheet.
   * @param {number} index The position in the "data" to insert the objects.
   */
  addAt(index:number, objects:object[]){
    if (!Array.isArray(objects)) objects = [objects];
    if (objects.length == 0) return; // Skip empties.

    this.sUtils.prepareHeaders(objects);
    const headers = this.sUtils.headerArray;
    const rowData = this.oUtils.convertToRows(objects, headers);
    this.sUtils.addAt(rowData, index);
  }

  ////////////////////////////////
  /////// READ ///////////////////
  ////////////////////////////////

  /**
   * Gets the number of objects in the sheet.
   * ---
   * Gets the total number of objects currently in the sheet.
   * @returns {number} The number of records in this sheet.
   */
  getCount(){
    if (!this.sUtils.hasBody()) return 0;
    
    return this.sUtils.getCount();
  }

  /**
   * Returns all objects from the sheet.
   * ---
   * Returns every object in the sheet as an array, in order.
   * @returns {object[]} An array of objects.
   */
  getAll(){
    if (!this.sUtils.hasBody()) return [];

    const bodyRange = this.sUtils.bodyArray;
    const headers = this.sUtils.headerArray;
    const allObjects = this.oUtils.convertToObjects(bodyRange, headers);

    return allObjects;
  }

  /**
   * Returns one or more first ("top") objects.
   * ---
   * This function will fetch and return any number of objects from the top of the sheet. For example,
   * `Ob2ss.getFirst(5)` will return the first 5 rows from the sheet as objects. A count parameter is not required. If
   * none is present, this will return the single first object.
   * 
   * @param {number} count [Optional] The number of top objects to return. If not supplied, the default is 1.
   * @returns {object[]} An array of objects representing the requested rows.
   */
  getFirst(count?:number){
    if (count == undefined) count = 1;
    if (count == 0) return [];

    return this.getSequence(0, count);
  }

  /**
   * Returns one or more last ("bottom") objects.
   * ---
   * This function will fetch and return any number of objects from the bottom of the sheet. For example,
   * `Ob2ss.getLast(3)` will return the last 3 rows from the sheet as objects in the same order as they appear in the
   * sheet. For example, if you use `getLast(3)` on `[1,2,3,4,5,6]` you would get back `[4,5,6]`;
   * 
   * A count parameter is not required. If none is present, this will return the single last object.
   * 
   * @param {number} count [Optional] The number of top objects to return. If not supplied, the default is 1.
   * @returns {object[]} An array of objects representing the requested rows.
   */
  getLast(count?:number){
    if (count == undefined) count = 1;
    if (count == 0) return [];

    const numObjects = this.getCount();
    return this.getSequence(numObjects-count, count);
  }

  /**
   * Returns a number of rows after skipping some.
   * ---
   * This function will fetch and return any number of objects starting at an arbitrary position in the sheet. For
   * example, `Ob2ss.getRange(5, 3)` will return the 6th, 7th, and 8th objects from the sheet.
   * 
   * **Notes**
   * 1. The `skip` parameter refers to the data range of the sheet. If you have 3 header rows in your sheet and
   *    you skip 3, Ob2ss will begin taking at row 7 (that's index 4).
   * 2. If there are fewer rows available than were requested by the `count` parameter, those will be returned.
   * @param {number} skip The number of rows to skip. Remember that this is 1 based.
   * @param {number} count The number of rows to try to read and return.
   * @returns {object[]} An array of objects representing the requested rows.
  */
  getSequence(skip:number, take:number){
    if (!this.sUtils.hasBody()) return [];

    const numRows = this.getCount();
    const headers = this.sUtils.headerArray;

    skip = Math.max(0, skip);
    take = Math.max(0, take);

    if (take == 0) return [];
    if (skip >= numRows) return [];

    take = Math.min(numRows - skip, take); // The lower of the request or num rows remaining.
    const rows = this.sUtils.getSequence(skip, take);
    let objects = this.oUtils.convertToObjects(rows, headers);
    return objects;
  }

  /**
   * Returns the requested columns for all objects.
   * ---
   * This function will fetch and return the data columns for the specified headers, not including the header text
   * itself. This works identically to the built-in `getRange` feature in that it returns a 2 dimensional array of
   * values, first by rows and then by columns.
   * 
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').getColumns(['make', 'year']);
   * // Returns [['toyota', 2012],
   * //          ['honda',  2014],
   * //          ['honda',  2016]]
   * ```
   * @param {[string]} headers An array of strings representing the headers to fetch.
   * @returns {[object]} A 2-dimensional array representing the column values.
   */
  getColumns(headers:string[]){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getColumns(headers);
  }

  /**
   * Gets a single column as a flat array.
   * ---
   * This function will return a single column as a flat array, and is faster than calling `getColumns()` on a single
   * column. Also, unlike `getColumns()`, this returns a 1-D array of values.
   * @param {string} header The header to fetch.
   * @returns {any[]} A 1-D array of values of the column from top to bottom.
   */
  getColumnAsArray(header:string){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getColumnAsArray(header);
  }
  
  /**
   * Returns objects filtered by the selector function.
   * ---
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').getLike((car) => {
   *   return car.model == 'camry' && car.year > 2016);
   * }
   * ```
   * @param {function} selector A function callback that accepts one argument (a candidate object) and returns a boolean
   * indicating whether it should be selected.
   * @returns {object[]} An array of objects the `selector` selected.
   */
  getLike(selector:(target:any) => boolean){
    if (!this.sUtils.hasBody()) return [];

    return this.sUtils.getLikeObjects(selector);
  }
  
  /**
   * Finds and changes objects in the table.
   * ---
   * Changes the fields of objects found with the `selector` and applies the `mutator` to them before writing the mutator
   * result them back to the sheet. Objects are updated in-place and don't move. Updated fields can include new fields
   * but removed fields don't delete the column. 
   * 
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').updateLike(
   *   (car) => car.make == 'ford',
   *   (car) => { car.last_wash_date = Date.now(); return car; }
   * );
   * ```
   * @param {function} selector A function callback that accepts one argument (a candidate object) and returns a boolean
   * indicating whether it should be selected.
   * @param {function} mutator A function callback that accepts one argument (an object) and returns an object to replace
   * it. Don't forget to return the resultant object!
   */
  updateLike(selector:(candidate:any) => boolean, mutator:(target:any) => object){
    if (!this.sUtils.hasBody()) return;

    this.sUtils.updateLike(selector, mutator);
  }

  /**
   * Deletes the selected objects.
   * ---
   * Removes rows (objects) found with the `selector` from the sheet.
   * 
   * _Example:_
   * ```
   * Ob2ss.getTableByName('cars').removeLike((car) => car.make == 'saturn');
   * ```
   * @param {function} selector A function callback that accepts one argument (a candidate object) and returns a boolean
   * indicating whether it should be selected.
   */
  removeLike(selector:(candidate:any) => boolean){
    if (!this.sUtils.hasBody()) return;

    const filteredIndices = this.sUtils.getLikeIndices(selector);
    if (filteredIndices.length == 0) return;
    this.sUtils.removeIndices(filteredIndices);
  }

  clear(){
    this.sheet.clear();
  }

  destroy(){
    this.sheet.getParent().deleteSheet(this.sheet);
  }
}