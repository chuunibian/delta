export interface TreeDataNode {
    id: string;
    name: string;
    directory: boolean;
    icon?: any;
    selectedIcon?: any;
    openIcon?: any;
    children?: TreeDataNode[];
    path?: string;
    size?: number;
    numsubdir?: number;
    numsubfiles?: number;
    created?: Date;
    modified?: Date;
    diff?: { // represents prev snapshot data it is ? checking if it is undef acts as a cond rend flag
      new_flag?: boolean;
      deleted_flag?: boolean;
      prevnumsubdir?: number;
      prevnumfiles?: number;
      prevsize?: number;
    }
}

export interface BackendError {
  user_error_string_desc: String,
  library_generated_error_desc: String, 
  err_code: number,
}

export interface CurrentEntryDetails {
  numsubdir: number,
  numsubfile: number,
}