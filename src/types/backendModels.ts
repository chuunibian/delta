export interface InitDisk {
  name: string;
  desc: string;
}

interface DirViewMetaDiff {
    new_dir_flag: boolean,
    previous_size: number,
    prev_num_files: number,
    prev_num_subdir: number,
}

interface FileViewMetaDiff {
    new_file_flag: boolean,
    previous_size: number,
}

export interface DirViewMeta {
  size: number;
  num_files: number;
  num_subdir: number;

  diff?: DirViewMetaDiff;

  created: { secs_since_epoch: number, nanos_since_epoch: number };
  modified: { secs_since_epoch: number, nanos_since_epoch: number };
}

interface File {
  meta: FileViewMeta;
  name: string;
  id: string;
}

export interface FileViewMeta {
  size: number;

  diff?: FileViewMetaDiff;

  created: { secs_since_epoch: number, nanos_since_epoch: number };
  modified: { secs_since_epoch: number, nanos_since_epoch: number };
}

export interface DirView {
  meta: DirViewMeta;
  name: string;
  id: string;
}

export interface DirViewChildren {
  subdirviews: DirView[];
  files: File[];
}