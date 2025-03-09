use std::{
    hash::Hash,
    ops::{BitAnd, BitAndAssign, BitOr, BitOrAssign},
};

use cargo_metadata::DependencyKind as MetaDepKind;
use serde::Serialize;

#[derive(Clone, Debug, Default, Serialize)]
pub(crate) struct DepInfo {
    #[serde(skip)]
    pub id: String,
    pub source: String,
    pub target: String,
    pub edge_no: u32,
    #[serde(flatten)]
    pub inner: DepInfoInner,
}

#[derive(Clone, Copy, Debug, Default, Serialize, Hash)]
pub(crate) struct DepInfoInner {
    pub kind: DepKind,

    // TODO: instead collect targets, once we can actually evaluate whether they apply
    // (would be a really nice feature to show a linux- or windows-specific depgraph)
    pub is_target_dep: bool,

    /// whether this dependency could be removed by deactivating a cargo feature
    pub is_optional: bool,

    /// if optional, whether this is optional directly or transitively
    pub is_optional_direct: bool,

    /// whether this edge has been updated by update_dep_info after being inserted into the graph
    // TODO: Store separately from DepInfo, make dedicated enum
    pub visited: bool,

    pub is_dev: bool,
    pub is_build: bool,
    pub is_normal: bool,
}

impl DepInfoInner {
    /// Used to gather edge info into node
    pub fn combine_incoming(&mut self, other: Self) {
        self.is_build |= other.is_build;
        self.is_dev |= other.is_dev;
        self.is_normal |= other.is_normal;
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Hash)]
pub(crate) struct DepKind {
    pub host: BuildFlag,
    pub target: BuildFlag,
}

impl DepKind {
    pub const NORMAL: Self = Self { host: BuildFlag::Never, target: BuildFlag::Always };
    pub const BUILD: Self = Self { host: BuildFlag::Always, target: BuildFlag::Never };
    pub const DEV: Self = Self { host: BuildFlag::Never, target: BuildFlag::Test };

    // or dev of build
    #[allow(unused)]
    pub const BUILD_OF_DEV: Self = Self { host: BuildFlag::Test, target: BuildFlag::Never };
    #[allow(unused)]
    pub const NORMAL_AND_BUILD: Self = Self { host: BuildFlag::Always, target: BuildFlag::Always };
    #[allow(unused)]
    pub const DEV_AND_BUILD: Self = Self { host: BuildFlag::Always, target: BuildFlag::Test };
    #[allow(unused)]
    pub const NORMAL_AND_BUILD_OF_DEV: Self =
        Self { host: BuildFlag::Test, target: BuildFlag::Always };
    #[allow(unused)]
    pub const DEV_AND_BUILD_OF_DEV: Self = Self { host: BuildFlag::Test, target: BuildFlag::Test };

    pub const UNKNOWN: Self = Self { host: BuildFlag::Never, target: BuildFlag::Never };

    pub fn new(kind: MetaDepKind, proc_macro: bool) -> Self {
        let res = Self::from(kind);

        if proc_macro {
            Self { host: res.target, target: BuildFlag::Never }
        } else {
            res
        }
    }

    pub fn combine_incoming(&mut self, other: Self) {
        if *self == Self::UNKNOWN || other == Self::UNKNOWN {
            *self = Self::UNKNOWN;
        } else {
            self.host |= other.host;
            self.target |= other.target;
        }
    }

    pub fn is_dev_only(&self) -> bool {
        self.host != BuildFlag::Always && self.target != BuildFlag::Always
    }
}

impl Default for DepKind {
    fn default() -> Self {
        Self::from(MetaDepKind::Normal)
    }
}

impl From<MetaDepKind> for DepKind {
    fn from(kind: MetaDepKind) -> Self {
        match kind {
            MetaDepKind::Normal => Self::NORMAL,
            MetaDepKind::Build => Self::BUILD,
            MetaDepKind::Development => Self::DEV,
            MetaDepKind::Unknown => Self::UNKNOWN,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Hash)]
pub enum BuildFlag {
    Always,
    Test,
    Never,
}

impl BitAnd for BuildFlag {
    type Output = Self;

    fn bitand(self, rhs: Self) -> Self {
        use BuildFlag::*;

        match (self, rhs) {
            (Always, Always) => Always,
            (Always, Test) | (Test, Always) | (Test, Test) => Test,
            _ => Never,
        }
    }
}

impl BitAndAssign for BuildFlag {
    fn bitand_assign(&mut self, rhs: Self) {
        *self = *self & rhs;
    }
}

impl BitOr for BuildFlag {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self {
        use BuildFlag::*;

        match (self, rhs) {
            (Never, Never) => Never,
            (Never, Test) | (Test, Never) | (Test, Test) => Test,
            _ => Always,
        }
    }
}

impl BitOrAssign for BuildFlag {
    fn bitor_assign(&mut self, rhs: Self) {
        *self = *self | rhs;
    }
}
