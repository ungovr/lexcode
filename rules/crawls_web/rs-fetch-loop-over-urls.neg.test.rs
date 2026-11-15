// lexcode-expect: 0
use std::collections::HashMap;

use reqwest::Client;
use serde_json::Value;

// Delivering to each subscriber's webhook is a POST to each address, not a read of pages.
pub async fn deliver(client: &Client, hooks: Vec<String>, event: &Value) -> anyhow::Result<()> {
    for hook in hooks {
        client.post(&hook).json(event).send().await?;
    }
    Ok(())
}

// A loop over ids that builds each address on the app's own API base: the loop variable is not the
// address.
pub async fn orders(client: &Client, base: &str, ids: &[u64]) -> anyhow::Result<()> {
    for id in ids {
        let order = client.get(format!("{base}/orders/{id}")).send().await?;
    }
    Ok(())
}

// A map lookup in a loop is not a request: `get` on a map is neither sent nor called.
pub fn names(cache: &HashMap<String, String>, keys: Vec<String>) -> Vec<String> {
    let mut out = Vec::new();
    for key in keys {
        if let Some(v) = cache.get(&key) {
            out.push(v.clone());
        }
    }
    keys.iter().filter_map(|k| cache.get(k)).cloned().collect()
}

// A pool of clients keyed by host is a map too, whatever it is called.
pub fn pick(clients: &HashMap<String, Client>, hosts: Vec<String>) {
    for host in hosts {
        let c = clients.get(&host);
    }
}

// One documented API called once is not a loop over addresses.
pub async fn weather(client: &Client) -> anyhow::Result<Value> {
    Ok(client
        .get("https://api.weather.gov/points/39.7456,-97.0892")
        .send()
        .await?
        .json()
        .await?)
}
