use core::{error, panic};
use std::{collections::HashMap, fs, hash::Hash, path::PathBuf, thread::current, time::SystemTime};

use walkdir::WalkDir;

use crate::model;

// pub fn load_settings() {}
