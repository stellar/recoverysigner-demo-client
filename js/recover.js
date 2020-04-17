class Recover extends React.Component {
  constructor(props) {
    super(props);
    this.state = {account: '', phoneNumber: '+17181111111'};
    this.handleAccountChange = this.handleAccountChange.bind(this);
    this.handlePhoneNumberChange = this.handlePhoneNumberChange.bind(this);
    this.handleRecover = this.handleRecover.bind(this);
    this.recover = this.recover.bind(this);
    this.authWithPhoneNumber = this.authWithPhoneNumber.bind(this);
  }

  render() {
    return (
      <fieldset>
        <legend>Recover</legend>
        <label>
          Account:
          <input placeholder="G..." size={this.state.account.length} value={this.state.account} onChange={this.handleAccountChange} />
        </label>
        <label>
          Phone Number:
          <input placeholder="+1..." size={this.state.phoneNumber.length} value={this.state.phoneNumber} onChange={this.handlePhoneNumberChange} />
        </label>
        <button onClick={this.handleRecover}>Recover</button>
        {this.props.config.recoverysigners.map((c, i) => <div key={`recaptcha${i}`} id={`recaptcha_${c.firebaseConfig.projectId}`}></div>)}
      </fieldset>
    );
  }

  handleAccountChange(event) {
    this.setState({account: event.target.value, phoneNumber: this.state.phoneNumber})
  }

  handlePhoneNumberChange(event) {
    this.setState({account: this.state.account, phoneNumber: event.target.value})
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
      const auth = await this.authWithPhoneNumber(this.props.config.recoverysigners[i].firebase, this.state.phoneNumber);
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

  async authWithPhoneNumber(fb, phoneNumber) {
    this.props.onLog(<span>⏳ Authenticating with Firebase <a href={`https://console.firebase.google.com/project/${fb.name}`}>{fb.name}</a> with {phoneNumber}...</span>);

    var appVerifier = new firebase.auth.RecaptchaVerifier(`recaptcha_${fb.name}`, { "size": "invisible" }, fb);
    var provider = new firebase.auth.PhoneAuthProvider(fb.auth());
    const verificationId = await provider.verifyPhoneNumber(phoneNumber, appVerifier)
    const verificationCode = window.prompt('Please enter the verification code that was sent to your mobile device.', '111111');
    const credential = firebase.auth.PhoneAuthProvider.credential(verificationId, verificationCode);
    const auth = await fb.auth().signInWithCredential(credential);
    const idToken = await auth.user.getIdToken();

    this.props.onLog(<span>⏳ Authenticated with Firebase <a href={`https://console.firebase.google.com/project/${fb.name}`}>{fb.name}</a> with {phoneNumber}</span>);

    return idToken;
  }

  async signWithRecoverysigner(authToken, recoverysignerURL, account, tx) {
    this.props.onLog(<span>⏳ Signing transaction to add device key with <a href={recoverysignerURL}>Recoverysigner</a>...</span>);

    const body = {
      transaction: tx.toXDR('base64'),
    };
    const response = await fetch(recoverysignerURL+'/accounts/'+account+'/sign', {
      method: "POST",
      headers: { 'Authorization': 'BEARER ' + authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await response.json();

    this.props.onLog(<span>⏳ Signed transaction with <a href={recoverysignerURL}>Recoverysigner</a>, signer: <SignerId config={this.props.config} id={json.signer} />, signature: {json.signature}</span>);

    return json
  }
}
