# SEP-30 Recoverysigner Demo Client

A limited feature demo client for a [SEP-30 Recoverysigner] server.

Implements the basic endpoints required for registration and recovery of a Stellar account with one or more recoverysigner servers. Designed specifically for use with the [experimental implementation] that uses Firebase for email and phone number authentication.

## Usage
### Running
The demo client is HTML, JavaScript, and just a few lines of CSS. The files in this repository do not need compiling, just serve the files on localhost and you're good to go.

You can use `make run` to use Ruby to run a simple file web server of the directory, or any other method to host the files in this repository at a URL.

### Using the UI
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
[experimental implementation]: https://github.com/stellar/go/tree/master/exp/services/recoverysigner
