class New extends React.Component {
  constructor(props) {
    super(props);
    this.handleNew = this.handleNew.bind(this);
    this.createNewAccount = this.createNewAccount.bind(this);
  }

  render() {
    return (
      <fieldset>
        <legend>New</legend>
        <button onClick={this.handleNew}>Create New Account</button>
      </fieldset>
    );
  }

  async handleNew() {
    try {
      await this.createNewAccount();
    } catch(e) {
      this.props.onLog(`❌ Error: ${e.message}`);
    }
  }

  async createNewAccount() {
    const masterKey = StellarSdk.Keypair.random();
    this.props.onLog(<span>⏳ Generated account: <AccountId id={masterKey.publicKey()} /> / {masterKey.secret()}</span>);

    this.props.onLog(<span>⏳ Funding with friendbot...</span>);
    const response = await fetch(`https://friendbot.stellar.org?addr=${masterKey.publicKey()}`);
    const json = await response.json();
    const account = await this.props.config.horizonServer.loadAccount(masterKey.publicKey());
    this.props.onLog(`⏳ Account balances: ${JSON.stringify(account.balances)}`);
    this.props.onLog(<span>✅ Funded with friendbot</span>);
  }
}
