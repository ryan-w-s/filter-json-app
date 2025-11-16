use serde::{Deserialize, Serialize};

pub type JsonValue = serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum FilterComparisonOperator {
    #[serde(rename = "==")]
    Eq,
    #[serde(rename = "!=")]
    Ne,
    #[serde(rename = ">")]
    Gt,
    #[serde(rename = ">=")]
    Ge,
    #[serde(rename = "<")]
    Lt,
    #[serde(rename = "<=")]
    Le,
    Contains,
    Exists,
}

pub type JsonPath = String;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FilterCondition {
    pub path: JsonPath,
    pub operator: FilterComparisonOperator,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<JsonValue>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ProjectionMode {
    Keep,
    Drop,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub enum ProjectionMatchMode {
    Exact,
    KeyAnywhere,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectionRule {
    pub path: JsonPath,
    /// Serialized as `match` to align with the TypeScript shape.
    #[serde(default, rename = "match")]
    pub match_mode: ProjectionMatchMode,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FilterProjection {
    pub mode: ProjectionMode,
    #[serde(default)]
    pub rules: Vec<ProjectionRule>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FilterSpec {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub conditions: Vec<FilterCondition>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projection: Option<FilterProjection>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rule {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub spec: FilterSpec,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RuleSet {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub rules: Vec<Rule>,
}


