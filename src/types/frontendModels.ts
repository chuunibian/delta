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
      prevnumsubdir?: number;
      prevnumfiles?: number;
      prevsize?: number;
    }
}