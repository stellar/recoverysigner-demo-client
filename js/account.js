class Account extends React.Component {
  constructor(props) {
    super(props);
    this.onAccount = this.onAccount.bind(this);
    this.handleClearAccount = this.handleClearAccount.bind(this);
    this.handleResetDeviceKey = this.handleResetDeviceKey.bind(this);

    let deviceKeySecret = localStorage.getItem('deviceKeySecret');
    if (deviceKeySecret == null) {
      const deviceKey = StellarSdk.Keypair.random();
      deviceKeySecret = deviceKey.secret();
      localStorage.setItem('deviceKeySecret', deviceKeySecret);
      this.props.onLog(`⏳ Generating device key: ${deviceKey.publicKey()}`);
    }
    const deviceKey = StellarSdk.Keypair.fromSecret(deviceKeySecret);
    this.props.onLog(<span>📣 Using device key: <SignerId config={this.props.config} id={deviceKey.publicKey()} /></span>);

    let accountId = localStorage.getItem('accountId') || '';
    if (accountId != '') {
      this.props.onLog(<span>📣 Using account: <AccountId id={accountId} /></span>);
    }

    let phoneNumber = localStorage.getItem('phoneNumber') || '';
    if (phoneNumber != '') {
      this.props.onLog(`📣 Using phone number: ${phoneNumber}`);
    }

    this.state = {
      deviceKey: deviceKey,
      account: accountId,
      phoneNumber: phoneNumber,
    };
  }

  onAccount(account, phoneNumber) {
    this.setState({deviceKey: this.state.deviceKey, account: account, phoneNumber: phoneNumber});
    localStorage.setItem('accountId', account);
    localStorage.setItem('phoneNumber', phoneNumber);
    this.props.onLog(<span>📣 Account in use: <AccountId id={account} /> (Phone Number: {phoneNumber})</span>);
  }

  handleClearAccount() {
    this.onAccount('', '');
    this.props.onLog(`✅ Account details cleared`);
  }

  handleResetDeviceKey() {
    const deviceKey = StellarSdk.Keypair.random();
    localStorage.setItem('deviceKeySecret', deviceKey.secret());
    this.setState({deviceKey: deviceKey, account: this.state.account, phoneNumber: this.state.phoneNumber});
    this.props.onLog(`⏳ Generating device key: ${deviceKey.publicKey()}`);
    this.props.onLog(<span>📣 Using device key: <SignerId config={this.props.config} id={deviceKey.publicKey()} /></span>);
  }

  render() {
    const displayDeviceKeyReset = this.state.account == '';
    return (
      <div>
        {this.state.account == '' &&
          <span>
            <New
              config={this.props.config}
              onAccount={this.onAccount}
              onLog={this.props.onLog}
            />
            <Register
              config={this.props.config}
              deviceKey={this.state.deviceKey}
              onAccount={this.onAccount}
              onLog={this.props.onLog}
            />
            <Recover
              config={this.props.config}
              deviceKey={this.state.deviceKey}
              onAccount={this.onAccount}
              onLog={this.props.onLog}
            />
          </span>
        }
        <fieldset>
          <legend>State</legend>
          Device Key: <SignerId config={this.props.config} id={this.state.deviceKey.publicKey()} /> / {this.state.deviceKey.secret()} {displayDeviceKeyReset && <button onClick={this.handleResetDeviceKey}>Reset</button>}<br/>
          Account: <AccountId id={this.state.account} /> Phone Number: {this.state.phoneNumber} <button onClick={this.handleClearAccount}>Clear</button><br/>
        </fieldset>
        {this.state.account != '' &&
          <span>
            <BumpSeq
              config={this.props.config}
              account={this.state.account}
              deviceKey={this.state.deviceKey}
              onLog={this.props.onLog}
            />
          </span>
        }
      </div>
    );
  }
}
