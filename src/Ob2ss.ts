import { Backend } from './Backend';

// Please keep comemnts here and in `Table.ts` aligned.

/**
 * The Ob2ss class can be used to include all of Ob2ss, as source, in a project.
 * 
 * If you are including the Ob2ss project in your Typescript project, you can import this one class.
 */
export class Ob2ss{
	private backend = new Backend();
	constructor(){}

	/**
	 * Sets a spreadsheet as the "database".
	 * ---
	 * An optional call to open a Google Spreadsheet as an Ob2ss database. The sheets within the database are considered
	 * "tables".
	 * 
	 * If you do not call `open`, Ob2ss will default to the following, in order:
	 * 1. A [bound spreadsheet](https://developers.google.com/apps-script/guides/bound), if available.
	 * 2. A new spreadsheet with its name set to the script running Ob2ss. If one already exists, Ob2ss will use that.
	 * 
	 * @param {Spreadsheet} spreadsheet A Spreadsheet to open as an Ob2ss database.
	 */
	open(spreadsheet:GoogleAppsScript.Spreadsheet.Spreadsheet){
		this.backend.open(spreadsheet);
	}

	/**
	 * Sets a table as the default so you can call operations directly.
	 * ---
	 * Setting a table as default means you can call other Ob2ss functions directly (e.g. `Ob2ss.addAppend()`) and they'll
	 * operate on that default table. This serves two purposes:
	 * 1. You don't have to use `Ob2ss.getTableByName()` before every call, and
	 * 2. You can see the JSDoc documentation in the Apps Script IDE for when you _do_ want to use `Ob2ss.getTableByName()`.
	 * 
	 * _Example:_
	 * ```
	 * Ob2ss.getTableByName('cars').addAppend(obj);
	 * ```
	 * is the same as
	 * ```
	 * Ob2ss.doSetDefaultTable('cars');
	 * Ob2ss.addAppend(obj);
	 * ```
	 * 
	 * @param {string} tableName The name of the sheet to set as the default.
	 */
	doSetDefaultTable(tableName:string){
		this.backend.doSetDefaultTable(tableName);
	}

	/**
	 * Clears an entire sheet of its contents.
	 * ---
	 * This will delete all the records in a sheet. This is useful for testing or resetting a database. A `tableName` is
	 * required and not inferred via any other calls to help avoid accidentally clearing a useful table.
	 * @param {string} tableName The name of the sheet to clear.
	 */
	doClear(tableName:string){
		this.backend.doClear(tableName);
	}

	/**
	 * Deletes an entire sheet.
	 * ---
	 * This will delete a sheet from the Spreadsheet. This is useful for testing or resetting a database. A `tableName` is
	 * required and not inferred via any other calls to help avoid accidentally deleting a useful table.
	 * @param {string} tableName The name of the sheet to delete.
	 */
	doDestroy(tableName:string){
		this.backend.doDestroy(tableName);
	}

	/**
	 * Fetches an Ob2ss table where you can write and read objects.
	 * ---
	 * This is optional and returns a table you can call functions against like `addAppend()` or `deleteLike()`. If you call
	 * those functions on Ob2ss, they'll run on the default table. You can set the default table with
	 * `doSetDefaultTable()` if you want to simplify your code. If you do not use this function and do not use
	 * `doSetDefaultTable()` then Ob2ss will operate on a table called `default`.
	 * 
	 * _Example:_
	 * ```
	 * Ob2ss.getTableByName('cars').addAppend(obj);
	 * ```
	 * is the same as
	 * ```
	 * Ob2ss.doSetDefaultTable('cars');
	 * Ob2ss.addAppend(obj);
	 * ```
	 * @param {string} tableName The name of the sheet to fetch.
	 */
	getTableByName(tableName:string){
		this.backend.getTableByName(tableName);
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
		this.backend.default.addAppend(objects);
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
		this.backend.default.addPrepend(objects);
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
		this.backend.default.addAt(index, objects);
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
		this.backend.default.getCount();
	}

	/**
	 * Returns all objects from the sheet.
	 * ---
	 * Returns every object in the sheet as an array, in order.
	 * @returns {object[]} An array of objects.
	 */
	getAll(){
		this.backend.default.getAll();
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
		this.backend.default.getFirst(count);
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
		this.backend.default.getLast(count);
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
	getSequence(skip:number, count:number){
		this.backend.default.getSequence(skip, count);
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
		this.backend.default.getColumns(headers);
	}

	/**
	 * Gets a single column as a flat array.
	 * ---
	 * This will return a single column as a flat array, and is faster than calling `getColumns()` on a single
	 * column. Also, unlike `getColumns()`, this returns a 1-D array of values.
	 * @param {string} header The header to fetch.
	 * @returns {any[]} A 1-D array of values of the column from top to bottom.
	 */
	getColumnAsArray(header:string){
		this.backend.default.getColumnAsArray(header);
	}

	/**
	 * Returns objects filtered by the selector function.
	 * ---
	 * _Example:_
	 * ```
	 * Ob2ss.getTableByName('cars').getLike((car){
		{
	*   return car.model == 'camry' && car.year > 2016);
	* }
	* ```
	* @param {function} selector A callback that accepts one argument (a candidate object) and returns a boolean
	* indicating whether it should be selected.
	* @returns {object[]} An array of objects the `selector` selected.
	*/
	getLike(selector:(candidate:object) => boolean){
		this.backend.default.getLike(selector);
	}
		

	/////// UPDATE ///////
	/**
	 * Finds and changes objects in the table.
	 * ---
	 * Changes the fields of objects found with the `selector` and applies the `mutator` to them before writing the mutator
	 * result them back to the sheet. Objects are updated in-place and don't move. Updated fields can include new fields. 
	 * 
	 * _Example:_
	 * ```
	 * Ob2ss.getTableByName('cars').updateLike(
	 *   (car){
		car.make == 'ford',
	*   (car){
		{ car.last_wash_dateDate.now(); return car; }
	* );
	* ```
	* @param {function} selector A callback that accepts one argument (a candidate object) and returns a boolean
	* indicating whether it should be selected.
	* @param {function} mutator A callback that accepts one argument (an object) and returns an object to replace
	* it. Don't forget to return the resultant object!
	*/
	updateLike(selector:(candidate:object) => boolean, mutator:(target:object) => object){
		this.backend.default.updateLike(selector, mutator);
	}

	/////// DELETE ///////
	/**
	 * Deletes the selected objects.
	 * ---
	 * Removes rows (objects) found with the `selector` from the sheet.
	 * 
	 * _Example:_
	 * ```
	 * Ob2ss.getTableByName('cars').removeLike((car){
		car.make == 'saturn');
	* ```
	* @param {function} selector A callback that accepts one argument (a candidate object) and returns a boolean
	* indicating whether it should be selected.
	*/
	removeLike(selector:(candidate:object) => boolean){
		this.backend.default.removeLike(selector);
	}
}