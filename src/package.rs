use std::{
    cell::Cell,
    fmt::{self, Debug, Formatter},
    rc::Rc,
    sync::{
        atomic::{AtomicU16, Ordering},
        Arc,
    },
};

use cargo_metadata::{semver::Version, Package as MetaPackage};
use serde::{Serialize, Serializer};

use crate::{
    dep_info::{DepInfo, DepInfoInner, DepKind},
    util::is_proc_macro,
};

#[derive(Clone, Serialize)]
pub(crate) struct Package {
    #[serde(skip)]
    pub id: String,
    pub name: String,
    pub version: Version,
    pub dep_info: DepInfoInner,
    pub is_ws_member: bool,
    pub is_proc_macro: bool,

    #[serde(serialize_with = "serialize_name_uses")]
    pub name_uses: Option<Arc<AtomicU16>>,
}

fn serialize_name_uses<S>(v: &Option<Arc<AtomicU16>>, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_u16(v.as_ref().map(|v| v.load(Ordering::SeqCst)).unwrap_or(0))
}

impl Package {
    pub fn new(pkg: &MetaPackage, is_ws_member: bool) -> Self {
        let mut dep_info = DepInfoInner::default();
        let is_proc_macro = is_proc_macro(pkg);
        if is_proc_macro {
            dep_info.kind = DepKind::BUILD;
        }

        Self {
            id: format!("{} {}", pkg.name, pkg.version),
            name: pkg.name.clone(),
            version: pkg.version.clone(),
            dep_info,
            is_ws_member,
            is_proc_macro,
            name_uses: None,
        }
    }
}

impl Debug for Package {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)?;
        if self.name_uses.is_none()
            || self.name_uses.as_ref().is_some_and(|c| c.load(Ordering::SeqCst) > 1)
        {
            write!(f, " {}", self.version)?;
        }

        Ok(())
    }
}
