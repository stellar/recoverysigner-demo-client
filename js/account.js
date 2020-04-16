class Account extends React.Component {
  constructor(props) {
    super(props);
    this.onAccount = this.onAccount.bind(this);

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

  render() {
    return (
      <div>
        <fieldset>
          <legend>State</legend>
          Device Key: {this.state.deviceKey.publicKey()} / {this.state.deviceKey.secret()}<br/>
          Account: <AccountId id={this.state.account} /><br/>
          Phone Number: {this.state.phoneNumber}<br/>
        </fieldset>

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

        {this.state.account != '' &&
          <span>
            <Clear
              onAccount={this.onAccount}
              onLog={this.props.onLog}
            />
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
