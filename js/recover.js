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
        <div id="recaptcha"></div>
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

    const auth1 = await this.authWithPhoneNumber(this.props.config.recoverysigner1Firebase, this.state.phoneNumber);
    const auth2 = await this.authWithPhoneNumber(this.props.config.recoverysigner2Firebase, this.state.phoneNumber);

    const account = await this.props.config.horizonServer.loadAccount(this.state.account);
    const tx = new StellarSdk.TransactionBuilder(
      account, { fee: StellarSdk.BASE_FEE, networkPassphrase: this.props.config.networkPassphrase })
      .setTimeout(30)
      .addOperation(StellarSdk.Operation.setOptions({
        signer: { ed25519PublicKey: this.props.deviceKey.publicKey(), weight: 20 }
      }))
      .build();

    const sign1 = await this.signWithRecoverysigner(auth1, this.props.config.recoverysigner1URL, this.state.account, tx);
    const sign2 = await this.signWithRecoverysigner(auth2, this.props.config.recoverysigner2URL, this.state.account, tx);

    tx.addSignature(sign1.signer, sign1.signature);
    tx.addSignature(sign2.signer, sign2.signature);

    this.props.onLog(`⏳ Submitting transaction ${tx.hash().toString('hex')}...`);
    await this.props.config.horizonServer.submitTransaction(tx);
    this.props.onLog(<span>⏳ Submitted transaction <TxId id={tx.hash().toString('hex')} /></span>);

    this.props.onLog(<span>✅ Recovered <AccountId id={this.state.account} /></span>);

    this.props.onAccount(this.state.account, this.state.phoneNumber);
  }

  async authWithPhoneNumber(fb, phoneNumber) {
    this.props.onLog(<span>⏳ Authenticating with Firebase <a href={`https://console.firebase.google.com/project/${fb.name}`}>{fb.name}</a> with {phoneNumber}...</span>);

    fb.auth().settings.appVerificationDisabledForTesting = true;
    var appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha', { "size": "invisible" }, fb);
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
      headers: { 'Authorization': 'BEARER ' + authToken },
      body: JSON.stringify(body)
    });
    const json = await response.json();

    this.props.onLog(<span>⏳ Signed transaction with <a href={recoverysignerURL}>Recoverysigner</a>, signer: {json.signer}, signature: {json.signature}</span>);

    return json
  }
}
