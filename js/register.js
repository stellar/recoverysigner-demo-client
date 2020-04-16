class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {seed: '', phoneNumber: '+17181111111'};
    this.handleSeedChange = this.handleSeedChange.bind(this);
    this.handlePhoneNumberChange = this.handlePhoneNumberChange.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.register = this.register.bind(this);
    this.registerWithRecoverysigner = this.registerWithRecoverysigner.bind(this);
  }

  render() {
    return (
      <fieldset>
        <legend>Register</legend>
        <label>
          Seed: <input placeholder="S..." size={this.state.seed.length} value={this.state.seed} onChange={this.handleSeedChange} />
        </label>
        <label>
          Phone Number: <input placeholder="+1..." size={this.state.phoneNumber.length} value={this.state.phoneNumber} onChange={this.handlePhoneNumberChange} />
        </label>
        <button onClick={this.handleRegister}>Register</button>
      </fieldset>
    );
  }

  handleSeedChange(event) {
    this.setState({seed: event.target.value, phoneNumber: this.state.phoneNumber})
  }

  handlePhoneNumberChange(event) {
    this.setState({seed: this.state.seed, phoneNumber: event.target.value})
  }

  async handleRegister() {
    try {
      await this.register();
    } catch(e) {
      this.props.onLog(`❌ Error: ${e.message}`);
    }
  }

  async register() {
    const masterKey = StellarSdk.Keypair.fromSecret(this.state.seed);
    this.props.onLog(<span>⏳ Registering <AccountId id={masterKey.publicKey()} />...</span>);

    const account = await this.props.config.horizonServer.loadAccount(masterKey.publicKey());
    this.props.onLog(`⏳ Account balances: ${JSON.stringify(account.balances)}`);

    const transaction = new StellarSdk.TransactionBuilder(account,
      { fee: StellarSdk.BASE_FEE, networkPassphrase: this.props.config.networkPassphrase })
      .addOperation(StellarSdk.Operation.setOptions({
        masterWeight: 0,
        lowThreshold: 10*this.props.config.recoverysigners.length,
        medThreshold: 10*this.props.config.recoverysigners.length,
        highThreshold: 10*this.props.config.recoverysigners.length,
        signer: { ed25519PublicKey: this.props.deviceKey.publicKey(), weight: 10*this.props.config.recoverysigners.length }
      }))
      .setTimeout(30)
      .build();
    transaction.sign(masterKey);
    this.props.onLog(<span>⏳ Submitting transaction <TxXdr xdr={transaction.toXDR('base64')} />...</span>);
    this.props.onLog(<span>⏳ Adding device key (<SignerId config={this.props.config} id={this.props.deviceKey.publicKey()} />) as signer (weight: {10*this.props.config.recoverysigners.length})...</span>);
    this.props.onLog(`⏳ Removing master key as signer (weight: 0)...`);
    await this.props.config.horizonServer.submitTransaction(transaction);
    this.props.onLog(<span>⏳ Submitted transaction <TxId id={transaction.hash().toString('hex')} /></span>);

    let signers = [];
    for (var i=0; i<this.props.config.recoverysigners.length; i++) {
      const config = this.props.config.recoverysigners[i];
      const token1 = await this.authWithAccount(config.webauthURL, masterKey.publicKey(), this.props.deviceKey);
      const signer = await this.registerWithRecoverysigner(token1, config.url, masterKey.publicKey(), this.props.deviceKey, this.state.phoneNumber);
      signers = signers.concat(signer)
    }

    const tx = new StellarSdk.TransactionBuilder(account, { fee: StellarSdk.BASE_FEE, networkPassphrase: this.props.config.networkPassphrase });
    for (var i=0; i<signers.length; i++) {
      tx.addOperation(StellarSdk.Operation.setOptions({
        signer: { ed25519PublicKey: signers[i], weight: 10 }
      }))
    }
    const txBuilt = tx.setTimeout(30).build();
    txBuilt.sign(this.props.deviceKey);
    this.props.onLog(`⏳ Submitting transaction ${txBuilt.hash().toString('hex')}...`);
    for (var i=0; i<signers.length; i++) {
      this.props.onLog(<span>⏳ Adding signing key <SignerId config={this.props.config} id={signers[i]} /> as signer (weight: 10)...</span>);
    }
    await this.props.config.horizonServer.submitTransaction(txBuilt);
    this.props.onLog(<span>⏳ Submitted transaction <TxId id={txBuilt.hash().toString('hex')} /></span>);

    this.props.onLog(`✅ Registration complete`);

    this.props.onAccount(masterKey.publicKey(), this.state.phoneNumber);
  }

  async authWithAccount(webauthURL, account, deviceKey) {
    this.props.onLog(<span>⏳ Authenticating with <a href={webauthURL}>Webauth</a>...</span>);

    const challengeResponse = await fetch(webauthURL+'?account='+account);
    const challengeJson = await challengeResponse.json();
    const challengeTx = new StellarSdk.Transaction(challengeJson.transaction, challengeJson.network_passphrase);

    challengeTx.sign(deviceKey);

    const tokenResponse = await fetch(webauthURL, {
      method: "POST",
      body: JSON.stringify({transaction: challengeTx.toXDR()})
    });
    const tokenJson = await tokenResponse.json();
    const token = tokenJson.token;

    this.props.onLog(<span>⏳ Authenticated with <a href={webauthURL}>Webauth</a></span>);

    return token
  }

  async registerWithRecoverysigner(authToken, recoverysignerURL, account, deviceKey, phoneNumber) {
    this.props.onLog(<span>⏳ Registering account with <a href={recoverysignerURL}>Recoverysigner</a>...</span>);

    const body = {
      identities: [
        {
          role: "owner",
          auth_methods: [
            { type: "phone_number", value: phoneNumber },
          ],
        },
      ],
    };
    const response = await fetch(recoverysignerURL+'/accounts/'+account, {
      method: "POST",
      headers: { 'Authorization': 'BEARER ' + authToken },
      body: JSON.stringify(body)
    });
    const json = await response.json();

    this.props.onLog(<span>⏳ Registered with <a href={recoverysignerURL}>Recoverysigner</a>, signer: <SignerId config={this.props.config} id={json.signer} /></span>);

    return json.signer
  }
}
