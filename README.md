# SEP-30 Recoverysigner Demo Client

A limited feature demo client for a [SEP-30 Recoverysigner] server.

## Status
A work-in-progress.

## Usage
1. Update the config with the URLs for the recoverysigners and their corresponding webauth servers.
1. Create a new account by clicking `Create New Account`.
1. Copy the seed generated in the logs into the `Register` panel to register it with the configured recoverysigners.
1. Use the `Bump Sequence` panel to submit a transaction (it’s the only transaction offered by the client).
1. Take a look at the transactions, they’re signed by a device key, not the master key.
1. Copy the account `G` strkey into memory.
1. Click `Clear` next to the account details.
1. Click `Reset` next to the device key.
1. Paste the account `G` strkey into the `Recover` panel and kick off recovery.

[SEP-30 Recoverysigner]: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0030.md
