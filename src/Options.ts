/**
 * Options class encapsulates options for Ob2ss.
 */
class Options {
  /**
   * Offsets the header row during reading. Not yet implemented.
   * ---
   * When Ob2ss reads the "header row" of a sheet, it always uses the 1st row or the last frozen row. This is
   * problematic when sorting/viewing data. This option lets you offset it so that it's the 2nd to last or 3rd to last
   * frozen row. This is useful if you want to filter/sort the sheet because the column headers must be directly
   * adjacent to the data to work properly. May not be positive.
   */
  headerOffset = 0;

  /**
   * When this is true, Ob2ss will use shortcuts that are sometimes inaccurate.
   * ---
   * For example, `getCount()` can approximate counts using the number of rows in a sheet or it can actually count how
   * many non-blank records are in that sheet. The former is faster while the latter is more accurate.
   */
  prioritizeSpeed = false;

  /**
   * When this is true, Ob2ss will clear the cache after every major operation.
   * ---
   * This will be removed eventually.
   */
  wipeCacheEveryOperation = false;
}

export {Options}