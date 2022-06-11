/**
 * Options class encapsulates options for Ob2ss.
 */
export class Options {
  /**
   * Offsets the header row during reading. Not yet implemented.
   * ---
   * When Ob2ss reads the "header row" of a sheet, it always uses the 1st row or the last frozen row. This is
   * problematic when sorting/viewing data. This option lets you offset it so that it's the 2nd to last or 3rd to last
   * frozen row. This is useful if you want to filter/sort the sheet because the column headers must be directly
   * adjacent to the data to work properly. May not be positive.
   */
  headerOffset = 0;
}