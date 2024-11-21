use core::fmt;
use std::ops::Deref;

use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct BoundString<const MIN: usize, const MAX: usize>(String);

impl<const MIN: usize, const MAX: usize> Deref for BoundString<MIN, MAX> {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        self.0.as_str()
    }
}

impl<const MIN: usize, const MAX: usize> fmt::Display for BoundString<MIN, MAX> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        fmt::Display::fmt(&self.0, f)
    }
}

impl<const MIN: usize, const MAX: usize> fmt::Debug for BoundString<MIN, MAX> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        fmt::Debug::fmt(&self.0, f)
    }
}

impl<const MIN: usize, const MAX: usize> BoundString<MIN, MAX> {
    pub fn into_inner(self) -> String {
        self.0
    }

    pub fn new_unchecked(s: String) -> Self {
        Self(s)
    }

    pub fn new(s: String) -> Option<Self> {
        if !(MIN..=MAX).contains(&s.len()) {
            return None;
        }

        Some(Self(s))
    }
}

struct ExpectedSize(usize, usize);

impl serde::de::Expected for ExpectedSize {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(
            f,
            "string size must be between {} and {} bytes",
            self.0, self.1
        )
    }
}

impl<'de, const MIN: usize, const MAX: usize> Deserialize<'de> for BoundString<MIN, MAX> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;

        let byte_count = s.len();

        if !(MIN..=MAX).contains(&byte_count) {
            return Err(serde::de::Error::invalid_length(
                byte_count,
                &ExpectedSize(MIN, MAX),
            ));
        }

        Ok(Self(s))
    }
}

impl<const MIN: usize, const MAX: usize> Serialize for BoundString<MIN, MAX> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}
