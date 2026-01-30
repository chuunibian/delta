import { Tree } from "react-arborist";
import { userStore } from "./store";
import useResizeObserver from "use-resize-observer";
import { Folder, File, FolderOpen, ArrowRight } from "lucide-react";
import { filesize } from "filesize";
import { Badge } from "./ui/badge";
import InfoFlagBar from "./info_flag_bar";
import {formatBytes} from "../lib/utils"
import { Progress } from "./ui/progress";


function parsePathToSegment(path: string | undefined): string[] {
  const checked = path ?? "";
  const segments = checked.split('\\');
  return segments.slice(1).filter(s => s.length > 0);
}

const INDENT_SIZE = 20;

// Header and node column widths
const COL_WIDTHS = {
  size: "w-24",      
  prev: "w-24",
  change: "w-24",
  diff: "w-26",
};

// Header
const TreeHeader = () => (
  <div className="flex items-center h-8 text-xs font-mono font-bold text-gray-400 select-none min-w-[600px]">
    <div className="flex-1 pl-1">Name</div>
    
    <div className={`${COL_WIDTHS.size} text-right px-2 border-l border-gray-300`}>Size</div>
    <div className={`${COL_WIDTHS.prev} text-right px-2 border-l border-gray-300`}>Prev</div>
    <div className={`${COL_WIDTHS.change} text-right px-2 border-l border-gray-300`}>Change</div>
    <div className={`${COL_WIDTHS.diff} text-right px-2 border-l border-gray-300`}>Flag</div>
  </div>
);

const SimpleNode = ({ node, style, dragHandle }: any) => {

  const addNewDirView = userStore((state) => state.addNewDirView);
  const changeCurrentPath = userStore((state) => state.changeCurrentPath);
  const updateCurrentClickedOverview = userStore((state) => state.changeCurrentOverviewNode);
  const changeCurrentEntryDetails = userStore((state) => state.changeCurrentEntryDetails);

  // padding that react arborist injects is stripped but the rest of the stuff is not, padding self handle
  const { paddingLeft, ...restStyle } = style;

  // Handle current entry size
  let current_size = node.data.diff?.deleted_flag ? ("0 B") : (formatBytes(node.data.size));

  // Handle prev entry size
  let previous_size = "-";
  if (node.data.diff) {
    if (node.data.diff.deleted_flag) { // if deleted then do workaround curr -> prev
      previous_size = formatBytes(node.data.size);
    } else {
      previous_size = formatBytes(node.data.diff.prevsize);
    }
  }

  // file name color
  let file_name_text_color = node.data.diff?.deleted_flag ? "text-red-500" : "text-grey-200";

  let row_bg_color = node.data.diff?.deleted_flag ? "bg-red-950/30" : "bg-transparent";
  
  // Handle new, deleted, gray
  let status_field_color = "bg-transparent";
  if (node.data.diff) {
    if (node.data.diff.new_flag) {
      status_field_color = "bg-green-500";
    } else if (node.data.diff.deleted_flag) {
      status_field_color = "bg-red-500";
    }
  }

  // Handle for the change field
  let change_field_color = "text-gray-500";
  let change_field_value = "-";
  if (node.data.diff) {
    // Check if file is deleted if so workaround, else do the normal change calc (curr - prev)
    let diff = node.data.diff.deleted_flag ? node.data.diff.prevsize - node.data.size : node.data.size - node.data.diff.prevsize; 
    if (diff < 0) {
      change_field_color = "text-green-400"
    } else if (diff > 0) { // current > prev
      change_field_color = "text-red-400"
    }
    change_field_value = formatBytes(diff);
  }

  // subbar ratio
  let ratioValue = 99;
  if (node.isRoot) {
    ratioValue = 99;
  } else if(node.parent?.data.size) { // should be undef
    ratioValue = (node.data.size / node.parent.data.size) * 100
  } else {
    ratioValue = 100;
  }

  return (
    <div
      style={restStyle}
      ref={dragHandle}
      className={`
        flex 
        hover:bg-gray-600 cursor-pointer 
        ${node.isSelected ? 'bg-gray-700' : ''}
      `}
      onClick={() => {
        updateCurrentClickedOverview(node.data);
        if (!node.isOpen && !node.isLeaf && (!node.data.children || node.data.children.length === 0)) {
          addNewDirView(node.data, parsePathToSegment(node.data.path));
        }
        node.toggle();
      }}
      onMouseEnter={
        () => {
          changeCurrentPath(node.data.path)
          // New
          changeCurrentEntryDetails(node.data.numsubdir, node.data.numsubfiles)
        }
      }
    >
      
      <div 
        style={{ width: `${node.level * INDENT_SIZE}px` }} 
        className="flex-shrink-0 relative h-full"
      >
        {/* {Array.from({ length: node.level }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-gray-500/30"
            style={{ left: `${i * INDENT_SIZE}px` }}
          />
        ))} */}
        {/* node.data.children?.length > 0  */}
      </div>

      <div className={`flex flex-1 items-center border-b border-gray-600/50 min-w-0 ${row_bg_color}`}>
        <div className="flex-1 flex items-center min-w-0 pr-4">
          <div className="mr-2 flex-shrink-0 text-gray-400">
             {node.isLeaf ? (
               <File className="h-4 w-4 text-sky-400" />
             ) : (
               node.isOpen ? <FolderOpen className="h-4 w-4 text-amber-400" /> : <Folder className="h-4 w-4 text-amber-400" />
             )}
          </div>
          <span className={`truncate text-xs font-mono ${file_name_text_color}`}>
            {node.data.name}
          </span>
        </div>

        <div className={`${COL_WIDTHS.size} flex-shrink-0 text-right px-2 text-xs font-mono tabular-nums text-gray-100`}>
          {current_size}
        </div>

        <div className={`${COL_WIDTHS.prev} flex-shrink-0 text-right px-2 text-xs font-mono tabular-nums text-gray-500`}>
          {previous_size}
        </div>

        <div className={`${COL_WIDTHS.change} flex-shrink-0 text-right px-2 text-xs font-mono tabular-nums ${change_field_color}`}>
           {change_field_value}
        </div>

        <div className={`${COL_WIDTHS.diff} flex-shrink-0 flex justify-center items-center px-2 gap-2`}>
          <Progress value={ratioValue} className="h-2 flex-1 bg-muted [&>div]:bg-yellow-200"></Progress>

          {/* {node.data.diff?.new_flag ? (
            <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]"/>
           ) :
           (
            <div 
              className="h-2 w-2 shrink-0 rounded-full border border-gray-500 bg-transparent"  
            />
           )} */}

           <div className={`h-2 w-2 shrink-0 rounded-full border-gray-500 ${status_field_color}`} />

        </div>

      </div>
    </div>
  );
};

function TestFileTreeSecond() {
  const rootState = userStore((state) => state.root);
  const { ref, width, height } = useResizeObserver();

  if (!rootState) return <div>Loading...</div>;

  return (
    <div ref={ref} className="h-full w-full overflow-hidden flex flex-col text-white">
      <div className="h-full w-full overflow-auto">
        <div className="min-w-[600px] h-full flex flex-col">
          
          <TreeHeader />
          <Tree 
            data={[rootState]} 
            children={SimpleNode} 
            width={width && width > 600 ? width : 600}
            height={height ? height - 32 : 300}
            rowHeight={20}
            className="
                h-full w-full 
                overflow-y-auto 
                overflow-x-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                [&::-webkit-scrollbar-thumb]:rounded-full
                dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-400
                dark:hover:[&::-webkit-scrollbar-thumb]:bg-neutral-400"
            overscanCount={20}
            openByDefault={false}
          />
        </div>
      </div>
    </div>
  );
}

export default TestFileTreeSecond;

