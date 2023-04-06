class RecoverWithEmailLink extends React.Component {
  constructor(props) {
    super(props);
    this.state = {account: '', email: ''};
    this.handleAccountChange = this.handleAccountChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleRecover = this.handleRecover.bind(this);
    this.recover = this.recover.bind(this);
    this.authWithEmailLink = this.authWithEmailLink.bind(this);
  }

  render() {
    return (
      <fieldset>
        <legend>Recover with Email Link</legend>
        <label>
          Account:
          <input placeholder="G..." size={this.state.account.length} value={this.state.account} onChange={this.handleAccountChange} />
        </label>
        <label>
          Email:
          <input placeholder="user@example.com" size={this.state.email.length} value={this.state.email} onChange={this.handleEmailChange} />
        </label>
        <button onClick={this.handleRecover}>Recover</button>
      </fieldset>
    );
  }

  handleAccountChange(event) {
    this.setState({account: event.target.value, email: this.state.email})
  }

  handleEmailChange(event) {
    this.setState({account: this.state.account, email: event.target.value})
  }

  async handleRecover() {
    try {
      await this.recover();
    } catch(e) {
      this.props.onLog(`❌ Error: ${e.message}`);
    }
  }

  async recover() {
    this.props.onLog(<span>⏳ Recovering <AccountId id={this.state.account} />...</span>);

    let auths = [];
    for(var i=0; i<this.props.config.recoverysigners.length; i++) {
      const auth = await this.authWithEmailLink(this.props.config.recoverysigners[i].firebase, this.state.email);
      auths = auths.concat(auth);
    }

    const account = await this.props.config.horizonServer.loadAccount(this.state.account);
    const tx = new StellarSdk.TransactionBuilder(
      account, { fee: StellarSdk.BASE_FEE, networkPassphrase: this.props.config.networkPassphrase })
      .setTimeout(30)
      .addOperation(StellarSdk.Operation.setOptions({
        signer: { ed25519PublicKey: this.props.deviceKey.publicKey(), weight: 10*this.props.config.recoverysigners.length }
      }))
      .build();


    for(var i=0; i<this.props.config.recoverysigners.length; i++) {
      const auth = auths[i];
      const sig = await this.signWithRecoverysigner(auth, this.props.config.recoverysigners[i].url, this.state.account, tx);
      tx.addSignature(sig.signer, sig.signature);
    }

    this.props.onLog(<span>⏳ Submitting transaction <TxXdr xdr={tx.toXDR('base64')} />...</span>);
    await this.props.config.horizonServer.submitTransaction(tx);
    this.props.onLog(<span>⏳ Submitted transaction <TxId id={tx.hash().toString('hex')} /></span>);

    this.props.onLog(<span>✅ Recovered <AccountId id={this.state.account} /></span>);

    this.props.onAccount(this.state.account, this.state.phoneNumber);
  }

  async authWithEmailLink(fb, email) {
    this.props.onLog(<span>⏳ Authenticating with Firebase <a href={`https://console.firebase.google.com/project/${fb.name}`}>{fb.name}</a> with {email}...</span>);

    const actionCodeSettings = {
      url: 'http://localhost:8000',
      handleCodeInApp: true,
    };

    await fb.auth().sendSignInLinkToEmail(email, actionCodeSettings);
    const signInLink = window.prompt('Please enter the sign in link that was emailed.', '');
    const auth = await fb.auth().signInWithEmailLink(email, signInLink)
    const idToken = await auth.user.getIdToken();

    this.props.onLog(<span>⏳ Authenticated with Firebase <a href={`https://console.firebase.google.com/project/${fb.name}`}>{fb.name}</a> with {email}</span>);

    return idToken;
  }

  async signWithRecoverysigner(authToken, recoverysignerURL, account, tx) {
    this.props.onLog(<span>⏳ Signing transaction to add device key with <a href={recoverysignerURL}>Recoverysigner</a>...</span>);

    const accountsResp = await fetch(recoverysignerURL + '/accounts/'+account, {
      method: "GET",
      headers: { 'Authorization': 'BEARER ' + authToken},
    })
    const accountsRespJson = await accountsResp.json();
    //TODO handle case where signers[] has multiple keys
    const signer = accountsRespJson.signers[0].key;
    const body = {
      transaction: tx.toXDR('base64'),
    };
    const response = await fetch(recoverysignerURL+'/accounts/'+account+'/sign/'+signer, {
      method: "POST",
      headers: { 'Authorization': 'BEARER ' + authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await response.json();

    this.props.onLog(<span>⏳ Signed transaction with <a href={recoverysignerURL}>Recoverysigner</a>, signer: <SignerId config={this.props.config} id={signer} />, signature: {json.signature}</span>);

    return {...json, signer: signer}
  }
}
